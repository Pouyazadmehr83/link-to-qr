# Link to QR

A full-stack QR code generator with a FastAPI backend, React frontend, and PostgreSQL database — all containerized with Docker Compose.

![License](https://img.shields.io/badge/license-MIT-blue)
![Python](https://img.shields.io/badge/python-3.11+-blue)
![Node](https://img.shields.io/badge/node-18+-green)

## Features

- **QR Code Generation** — Convert any URL to a styled QR code
- **Customization** — Custom colors, sizes (100-2000px), and logo overlay
- **Live Preview** — See your QR code update in real-time as you type
- **Batch Generation** — Generate up to 100 QR codes at once
- **History** — Browse, search, and download previously generated codes
- **Dark Mode** — Beautiful dark theme with responsive design
- **Auto-Download** — QR codes download automatically after generation

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | FastAPI, SQLAlchemy, Pillow, python-qrcode |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Database | PostgreSQL 15 |
| Infrastructure | Docker Compose |

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Git

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/link-to-qr.git
cd link-to-qr
```

### 2. Configure environment (optional)

```bash
cp .env.example .env
# Edit .env with your preferred credentials
```

### 3. Start the application

```bash
docker compose up --build -d
```

### 4. Open in browser

```
http://localhost:80
```

That's it! The app is ready to use.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/generate` | Generate a QR code |
| `POST` | `/api/upload-logo` | Upload a logo for QR overlay |
| `POST` | `/api/batch` | Generate multiple QR codes |
| `GET` | `/api/history` | List generated QR codes |
| `GET` | `/api/history/:id` | Get a specific QR code |
| `DELETE` | `/api/history/:id` | Delete a QR code |
| `GET` | `/api/qr/:filename` | Download a QR code image |

### Example: Generate a QR code

```bash
curl -X POST http://localhost:8000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "color": "#6366f1", "size": 300}'
```

## Project Structure

```
link-to-qr/
├── docker-compose.yml          # Multi-service orchestration
├── .env.example                # Environment template
├── backend/
│   ├── Dockerfile              # Python 3.11 container
│   ├── requirements.txt        # Python dependencies
│   └── app/
│       ├── main.py             # FastAPI application & endpoints
│       ├── database.py         # SQLAlchemy configuration
│       ├── models.py           # Database models
│       ├── schemas.py          # Pydantic schemas (with validation)
│       ├── crud.py             # Database operations
│       └── qr_generator.py     # QR code generation logic
└── frontend/
    ├── Dockerfile              # Multi-stage build (Node → nginx)
    ├── nginx.conf              # SPA routing + API proxy
    ├── package.json            # Dependencies
    ├── vite.config.ts          # Vite configuration
    ├── tailwind.config.js      # Tailwind CSS config
    └── src/
        ├── App.tsx             # Main application
        ├── index.css           # Global styles
        ├── api/
        │   └── client.ts       # Typed API client
        └── components/
            ├── QRGenerator.tsx  # QR generation form
            ├── QRPreview.tsx    # Live QR preview
            └── History.tsx      # History grid
```

## Development

### Without Docker

**Backend:**

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Start PostgreSQL locally or use Docker for just the DB
docker run -d --name qr_db -p 5432:5432 \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=qr_codes \
  postgres:15-alpine

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/qr_codes \
  uvicorn app.main:app --reload --port 8000
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

### Docker Commands

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop all services
docker compose down

# Rebuild and restart
docker compose up --build -d

# Remove volumes (fresh start)
docker compose down -v
```

## Security

This application implements the following security measures:

- **Path Traversal Protection** — File access is restricted to designated directories
- **Input Validation** — URLs must be HTTP/HTTPS, colors must be valid hex, sizes are bounded
- **Upload Limits** — Max 5MB per file, image-only with magic byte verification
- **CORS Restriction** — Origins are configurable via environment variable
- **Non-Root Containers** — Backend runs as unprivileged user
- **No Exposed DB Port** — PostgreSQL is only accessible within Docker network
- **Environment Variables** — Credentials are not hardcoded in source

See [SECURITY.md](SECURITY.md) for details and vulnerability reporting.

## License

MIT
