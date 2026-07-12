import os
import shutil
import uuid
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from PIL import Image
from sqlalchemy.orm import Session

from . import crud, schemas
from .database import Base, engine, get_db
from .models import QRCode
from .qr_generator import GENERATED_DIR, generate_qr_code

app = FastAPI(title="QR Code Generator API", version="1.0.0")

# CORS - restrict to frontend origin in production
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost,http://localhost:80").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["*"],
)

# Upload limits
MAX_UPLOAD_SIZE = 5 * 1024 * 1024  # 5MB
ALLOWED_IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp"}

# Create database tables on startup
Base.metadata.create_all(bind=engine)

# Mount static files for serving generated QR codes
app.mount(
    "/generated",
    StaticFiles(directory=str(GENERATED_DIR)),
    name="generated",
)


@app.get("/api/health")
def health_check():
    return {"status": "healthy"}


@app.post("/api/generate", response_model=schemas.QRCodeResponse)
def create_qr_code(
    qr_code: schemas.QRCodeCreate,
    db: Session = Depends(get_db),
):
    # Generate QR code image
    filename = generate_qr_code(
        url=qr_code.url,
        color=qr_code.color,
        size=qr_code.size,
        logo_path=qr_code.logo_path,
    )
    image_path = str(GENERATED_DIR / filename)

    # Save to database
    db_qr = crud.create_qr_code(db, qr_code, image_path=image_path)
    return db_qr


@app.post("/api/upload-logo")
async def upload_logo(file: UploadFile):
    # Validate content type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    # Validate file extension
    file_ext = Path(file.filename).suffix.lower() if file.filename else ".png"
    if file_ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File extension {file_ext} not allowed")

    # Read file contents and check size
    contents = await file.read()
    if len(contents) > MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 5MB)")

    # Validate it's actually an image using Pillow
    try:
        import io
        img = Image.open(io.BytesIO(contents))
        img.verify()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file")

    # Generate unique filename
    filename = f"{uuid.uuid4().hex}{file_ext}"
    upload_dir = GENERATED_DIR / "logos"
    upload_dir.mkdir(parents=True, exist_ok=True)
    file_path = upload_dir / filename

    # Save file
    with open(file_path, "wb") as buffer:
        buffer.write(contents)

    return {"path": str(file_path), "filename": filename}


@app.post("/api/batch", response_model=schemas.BatchResponse)
def create_batch_qr_codes(
    batch: schemas.BatchCreate,
    db: Session = Depends(get_db),
):
    qr_codes = []
    for url in batch.urls:
        # Generate QR code for each URL
        filename = generate_qr_code(
            url=url,
            color=batch.color,
            size=batch.size,
        )
        image_path = str(GENERATED_DIR / filename)

        # Create schema for each URL
        qr_code_schema = schemas.QRCodeCreate(
            url=url,
            color=batch.color,
            size=batch.size,
        )
        db_qr = crud.create_qr_code(db, qr_code_schema, image_path=image_path)
        qr_codes.append(db_qr)

    return {"qr_codes": qr_codes}


@app.get("/api/history", response_model=list[schemas.QRCodeResponse])
def get_qr_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
    db: Session = Depends(get_db),
):
    if search:
        db_qr_codes = (
            db.query(QRCode)
            .filter(QRCode.url.contains(search))
            .offset(skip)
            .limit(limit)
            .all()
        )
    else:
        db_qr_codes = crud.get_qr_codes(db, skip=skip, limit=limit)
    return db_qr_codes


@app.get("/api/history/{qr_id}", response_model=schemas.QRCodeResponse)
def get_qr_code(
    qr_id: int,
    db: Session = Depends(get_db),
):
    db_qr = crud.get_qr_code(db, qr_id)
    if not db_qr:
        raise HTTPException(status_code=404, detail="QR code not found")
    return db_qr


@app.delete("/api/history/{qr_id}")
def delete_qr_code(
    qr_id: int,
    db: Session = Depends(get_db),
):
    db_qr = crud.get_qr_code(db, qr_id)
    if not db_qr:
        raise HTTPException(status_code=404, detail="QR code not found")

    # Delete file if it exists
    if db_qr.image_path and os.path.exists(db_qr.image_path):
        os.remove(db_qr.image_path)

    crud.delete_qr_code(db, qr_id)
    return {"message": "QR code deleted successfully"}


@app.get("/api/qr/{filename}")
def get_qr_image(filename: str):
    # Prevent path traversal
    file_path = (GENERATED_DIR / filename).resolve()
    if not str(file_path).startswith(str(GENERATED_DIR.resolve())):
        raise HTTPException(status_code=403, detail="Forbidden")
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="QR code image not found")
    return FileResponse(path=file_path, media_type="image/png")
