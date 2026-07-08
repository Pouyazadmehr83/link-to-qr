from datetime import datetime

from pydantic import BaseModel


class QRCodeCreate(BaseModel):
    url: str
    color: str = "#000000"
    size: int = 300
    logo_path: str | None = None


class QRCodeResponse(BaseModel):
    id: int
    url: str
    color: str
    size: int
    logo_path: str | None
    image_path: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class BatchCreate(BaseModel):
    urls: list[str]
    color: str = "#000000"
    size: int = 300


class BatchResponse(BaseModel):
    qr_codes: list[QRCodeResponse]
