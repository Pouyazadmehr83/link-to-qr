# QR Code Generator App — Design Spec

**Date:** 2026-07-08
**Status:** Approved

## [S1] Problem

Build a full-featured QR code generator web application with FastAPI backend, React frontend, Docker Compose deployment, and PostgreSQL for persistence. Users should be able to generate QR codes from URLs with customization options, view history, and batch generate.

## [S2] Solution Overview

### Architecture

- **Backend:** FastAPI + PostgreSQL (Docker Compose services)
- **Frontend:** React 18 + Vite + Tailwind CSS (Docker Compose service)
- **Deployment:** Docker Compose with 3 services: `backend`, `frontend`, `db`

### Backend (FastAPI)

**Endpoints:**
- `POST /api/generate` — creates QR code with customization, saves to DB, returns image
- `POST /api/batch` — accepts list of URLs, processes in parallel
- `GET /api/history` — paginated list with search/filter
- `DELETE /api/history/{id}` — removes QR code record + file
- `GET /api/qr/{filename}` — serves generated QR image files

**Tech Stack:**
- FastAPI with async support
- SQLAlchemy ORM + Alembic migrations
- Pillow for image processing (logo overlay)
- python-qrcode for QR generation

**Database Schema:**
- `qr_codes` table: id, url, color, size, logo_path, created_at, image_path

### Frontend (React)

**UI Layout:**
- Hero section with gradient background
- Generator card with URL input, customization options (color picker, size slider, logo upload)
- Live QR preview that updates in real-time
- Download button (PNG/SVG)
- History section with grid of saved QR codes, search bar, and filters
- Batch mode toggle to generate multiple QR codes at once

**Tech Stack:**
- React 18 + TypeScript
- Vite for bundling
- Tailwind CSS for styling
- Dark mode theme with accent colors

### Docker Compose

Three services:
1. `backend` — Python 3.11 + uvicorn
2. `frontend` — Node 18 + nginx
3. `db` — PostgreSQL 15

## [S3] Customization Features

- Color picker for QR code foreground
- Size slider (100px to 1000px)
- Logo upload (centered overlay with white background)
- Live preview that updates as options change

## [S4] History & Batch

- All generated QR codes saved to database with metadata
- Paginated history view with search by URL
- Batch mode: input multiple URLs, generate all at once
- Delete individual QR codes from history

## [S5] Error Handling

- Invalid URLs return 400 with descriptive error
- Database errors return 500 with generic message
- File upload validation (size, type)
- CORS configuration for frontend communication
