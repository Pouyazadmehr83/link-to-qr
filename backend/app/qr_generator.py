import os
import uuid
from pathlib import Path

import qrcode
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.moduledrawers import RoundedModuleDrawer
from PIL import Image

# Directory where generated QR codes are stored
# Uses QR_OUTPUT_DIR env var, defaults to /app/generated (Docker) or ./generated (local)
GENERATED_DIR = Path(os.environ.get("QR_OUTPUT_DIR", "/app/generated"))
try:
    GENERATED_DIR.mkdir(parents=True, exist_ok=True)
except PermissionError:
    # Fall back to local directory if /app is not writable
    GENERATED_DIR = Path("./generated")
    GENERATED_DIR.mkdir(parents=True, exist_ok=True)


def generate_qr_code(
    url: str,
    color: str = "#000000",
    size: int = 300,
    logo_path: str | None = None,
) -> str:
    """Generate a QR code image and return the filename.

    Args:
        url: The URL to encode in the QR code.
        color: Hex color string for the QR code foreground (e.g. "#ff0000").
        size: Target size in pixels (width and height).
        logo_path: Optional path to a logo image to overlay centered on the QR code.

    Returns:
        The filename of the generated QR code image.
    """
    GENERATED_DIR.mkdir(parents=True, exist_ok=True)

    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=2,
    )
    qr.add_data(url)
    qr.make(fit=True)

    # Parse hex color
    hex_color = color.lstrip("#")
    rgb = tuple(int(hex_color[i : i + 2], 16) for i in (0, 2, 4))

    qr_image = qr.make_image(
        image_factory=StyledPilImage,
        module_drawer=RoundedModuleDrawer(),
        fill_color=rgb,
        back_color=(255, 255, 255),
    )

    # Resize to target size
    qr_image = qr_image.resize((size, size), Image.LANCZOS)

    # Overlay logo if provided
    if logo_path and os.path.exists(logo_path):
        logo = Image.open(logo_path).convert("RGBA")
        # Calculate logo size (roughly 1/5 of QR code size)
        logo_max = size // 5
        logo.thumbnail((logo_max, logo_max), Image.LANCZOS)

        # Create white background for logo
        logo_bg_size = (logo.width + 10, logo.height + 10)
        logo_bg = Image.new("RGBA", logo_bg_size, (255, 255, 255, 255))
        logo_bg.paste(logo, (5, 5), logo)

        # Center the logo on the QR code
        pos = ((size - logo_bg.width) // 2, (size - logo_bg.height) // 2)
        qr_image.paste(logo_bg, pos, logo_bg)

    # Save with UUID filename
    filename = f"{uuid.uuid4().hex}.png"
    output_path = GENERATED_DIR / filename
    qr_image.save(output_path, "PNG")

    return filename
