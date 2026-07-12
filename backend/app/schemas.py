import re
from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class QRCodeCreate(BaseModel):
    url: str
    color: str = "#000000"
    size: int = Field(default=300, ge=100, le=2000)
    logo_path: str | None = None

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        if not re.match(r"^https?://", v):
            raise ValueError("URL must start with http:// or https://")
        return v

    @field_validator("color")
    @classmethod
    def validate_color(cls, v: str) -> str:
        if not re.match(r"^#[0-9a-fA-F]{6}$", v):
            raise ValueError("Color must be a valid hex color (e.g. #ff0000)")
        return v


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
    urls: list[str] = Field(..., max_length=100)
    color: str = "#000000"
    size: int = Field(default=300, ge=100, le=2000)

    @field_validator("urls")
    @classmethod
    def validate_urls(cls, v: list[str]) -> list[str]:
        for url in v:
            if not re.match(r"^https?://", url):
                raise ValueError(f"URL must start with http:// or https://: {url}")
        return v


class BatchResponse(BaseModel):
    qr_codes: list[QRCodeResponse]
