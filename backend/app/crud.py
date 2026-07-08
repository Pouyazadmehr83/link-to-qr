from sqlalchemy.orm import Session

from .models import QRCode
from .schemas import QRCodeCreate


def create_qr_code(db: Session, qr_code: QRCodeCreate, image_path: str | None = None) -> QRCode:
    db_qr = QRCode(
        url=qr_code.url,
        color=qr_code.color,
        size=qr_code.size,
        logo_path=qr_code.logo_path,
        image_path=image_path,
    )
    db.add(db_qr)
    db.commit()
    db.refresh(db_qr)
    return db_qr


def get_qr_codes(db: Session, skip: int = 0, limit: int = 100) -> list[QRCode]:
    return db.query(QRCode).offset(skip).limit(limit).all()


def get_qr_code(db: Session, qr_code_id: int) -> QRCode | None:
    return db.query(QRCode).filter(QRCode.id == qr_code_id).first()


def delete_qr_code(db: Session, qr_code_id: int) -> QRCode | None:
    db_qr = db.query(QRCode).filter(QRCode.id == qr_code_id).first()
    if db_qr:
        db.delete(db_qr)
        db.commit()
    return db_qr
