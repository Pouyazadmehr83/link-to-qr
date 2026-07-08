# QR Code Generator App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-featured QR code generator with FastAPI backend, React frontend, Docker Compose deployment, and PostgreSQL persistence.

**Architecture:** Three-service Docker Compose stack: FastAPI backend with QR generation/history API, React frontend with dark theme UI, PostgreSQL database. Backend generates QR codes with customization options (color, size, logo overlay) and stores metadata.

**Tech Stack:** Python 3.11, FastAPI, SQLAlchemy, Pillow, python-qrcode, PostgreSQL 15, React 18, TypeScript, Vite, Tailwind CSS, Docker Compose

## Global Constraints

- Python 3.11+, Node.js 18+, PostgreSQL 15
- All QR images stored in `backend/generated/` directory
- Frontend communicates with backend via `/api` prefix (proxied in Docker)
- Dark mode theme throughout frontend
- TDD: write tests before implementation where applicable

---

## File Structure

```
link_to_qr/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── crud.py
│   │   └── qr_generator.py
│   └── generated/           # QR images stored here
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── index.css
│       ├── components/
│       │   ├── QRGenerator.tsx
│       │   ├── QRPreview.tsx
│       │   ├── History.tsx
│       │   └── BatchMode.tsx
│       └── api/
│           └── client.ts
└── docs/compose/specs/
    └── 2026-07-08-qr-code-app-design.md
```

---

### Task 1: Docker Compose & Project Scaffolding

**Covers:** [S1, S2]

**Files:**
- Create: `docker-compose.yml`
- Create: `backend/Dockerfile`
- Create: `backend/requirements.txt`
- Create: `frontend/Dockerfile`
- Create: `frontend/nginx.conf`

**Interfaces:**
- Consumes: None (initial setup)
- Produces: Running Docker Compose stack with 3 services

- [ ] **Step 1: Create docker-compose.yml**

```yaml
version: '3.8'

services:
  db:
    image: postgres:15
    environment:
      POSTGRES_USER: qruser
      POSTGRES_PASSWORD: qrpass
      POSTGRES_DB: qrdb
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    volumes:
      - ./backend:/app
      - ./backend/generated:/app/generated
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://qruser:qrpass@db:5432/qrdb
    depends_on:
      - db

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend

volumes:
  pgdata:
```

- [ ] **Step 2: Create backend/Dockerfile**

```dockerfile
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p /app/generated

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

- [ ] **Step 3: Create backend/requirements.txt**

```
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
python-multipart==0.0.6
python-dotenv==1.0.0
pillow==10.1.0
qrcode[pil]==7.4.2
aiofiles==23.2.1
alembic==1.13.0
pydantic==2.5.3
```

- [ ] **Step 4: Create frontend/Dockerfile**

```dockerfile
FROM node:18-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

- [ ] **Step 5: Create frontend/nginx.conf**

```nginx
server {
    listen 80;
    server_name localhost;

    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://backend:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

- [ ] **Step 6: Commit**

```bash
git add docker-compose.yml backend/ frontend/
git commit -m "feat: add Docker Compose scaffolding for backend, frontend, and PostgreSQL"
```

---

### Task 2: Backend Database & Models

**Covers:** [S2]

**Files:**
- Create: `backend/app/__init__.py`
- Create: `backend/app/database.py`
- Create: `backend/app/models.py`
- Create: `backend/app/schemas.py`
- Create: `backend/app/crud.py`

**Interfaces:**
- Consumes: None (database setup)
- Produces: `QRCode` model, `QRCodeCreate`, `QRCodeResponse` schemas, CRUD functions

- [ ] **Step 1: Create backend/app/database.py**

```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://qruser:qrpass@localhost:5432/qrdb")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

- [ ] **Step 2: Create backend/app/models.py**

```python
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from .database import Base

class QRCode(Base):
    __tablename__ = "qr_codes"

    id = Column(Integer, primary_key=True, index=True)
    url = Column(String, nullable=False)
    color = Column(String, default="#000000")
    size = Column(Integer, default=300)
    logo_path = Column(String, nullable=True)
    image_path = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
```

- [ ] **Step 3: Create backend/app/schemas.py**

```python
from pydantic import BaseModel, HttpUrl
from datetime import datetime
from typing import Optional, List

class QRCodeCreate(BaseModel):
    url: str
    color: str = "#000000"
    size: int = 300
    logo_path: Optional[str] = None

class QRCodeResponse(BaseModel):
    id: int
    url: str
    color: str
    size: int
    logo_path: Optional[str]
    image_path: str
    created_at: datetime

    class Config:
        from_attributes = True

class BatchCreate(BaseModel):
    codes: List[QRCodeCreate]

class BatchResponse(BaseModel):
    results: List[QRCodeResponse]
    errors: List[str]
```

- [ ] **Step 4: Create backend/app/crud.py**

```python
from sqlalchemy.orm import Session
from . import models, schemas
from typing import List, Optional

def create_qr_code(db: Session, qr_code: schemas.QRCodeCreate, image_path: str):
    db_qr = models.QRCode(
        url=qr_code.url,
        color=qr_code.color,
        size=qr_code.size,
        logo_path=qr_code.logo_path,
        image_path=image_path
    )
    db.add(db_qr)
    db.commit()
    db.refresh(db_qr)
    return db_qr

def get_qr_codes(db: Session, skip: int = 0, limit: int = 100, search: Optional[str] = None):
    query = db.query(models.QRCode)
    if search:
        query = query.filter(models.QRCode.url.contains(search))
    return query.order_by(models.QRCode.created_at.desc()).offset(skip).limit(limit).all()

def get_qr_code(db: Session, qr_id: int):
    return db.query(models.QRCode).filter(models.QRCode.id == qr_id).first()

def delete_qr_code(db: Session, qr_id: int):
    db_qr = db.query(models.QRCode).filter(models.QRCode.id == qr_id).first()
    if db_qr:
        db.delete(db_qr)
        db.commit()
        return True
    return False
```

- [ ] **Step 5: Commit**

```bash
git add backend/app/
git commit -m "feat: add database models, schemas, and CRUD operations"
```

---

### Task 3: Backend QR Generator

**Covers:** [S3]

**Files:**
- Create: `backend/app/qr_generator.py`

**Interfaces:**
- Consumes: QR customization options (url, color, size, logo_path)
- Produces: Generated QR image file path

- [ ] **Step 1: Create backend/app/qr_generator.py**

```python
import qrcode
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.moduledrawers import RoundedModuleDrawer
from PIL import Image
import os
import uuid
from typing import Optional

GENERATED_DIR = "/app/generated"
os.makedirs(GENERATED_DIR, exist_ok=True)

def generate_qr_code(
    url: str,
    color: str = "#000000",
    size: int = 300,
    logo_path: Optional[str] = None
) -> str:
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)

    qr_image = qr.make_image(
        fill_color=color,
        back_color="white",
        image_factory=StyledPilImage,
        module_drawer=RoundedModuleDrawer()
    )

    qr_image = qr_image.resize((size, size), Image.LANCZOS)

    if logo_path and os.path.exists(logo_path):
        logo = Image.open(logo_path)
        logo_size = size // 4
        logo = logo.resize((logo_size, logo_size), Image.LANCZOS)

        white_bg = Image.new("RGB", (logo_size + 20, logo_size + 20), "white")
        white_bg.paste(logo, (10, 10))

        pos = ((size - white_bg.size[0]) // 2, (size - white_bg.size[1]) // 2)
        qr_image.paste(white_bg, pos)

    filename = f"{uuid.uuid4().hex}.png"
    filepath = os.path.join(GENERATED_DIR, filename)
    qr_image.save(filepath, "PNG")

    return filename
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/qr_generator.py
git commit -m "feat: add QR code generator with color, size, and logo customization"
```

---

### Task 4: Backend API Endpoints

**Covers:** [S2, S4]

**Files:**
- Create: `backend/app/main.py`

**Interfaces:**
- Consumes: `crud` module, `qr_generator` module, `schemas` module
- Produces: FastAPI app with all API endpoints

- [ ] **Step 1: Create backend/app/main.py**

```python
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import shutil

from . import crud, models, schemas, qr_generator
from .database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="QR Code Generator", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://frontend:80"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GENERATED_DIR = "/app/generated"
os.makedirs(GENERATED_DIR, exist_ok=True)
app.mount("/generated", StaticFiles(directory=GENERATED_DIR), name="generated")

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}

@app.post("/api/generate", response_model=schemas.QRCodeResponse)
def generate_qr(qr_code: schemas.QRCodeCreate, db: Session = Depends(get_db)):
    try:
        image_filename = qr_generator.generate_qr_code(
            url=qr_code.url,
            color=qr_code.color,
            size=qr_code.size,
            logo_path=qr_code.logo_path
        )
        image_path = f"/generated/{image_filename}"
        return crud.create_qr_code(db, qr_code, image_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/upload-logo")
async def upload_logo(file: UploadFile = File(...)):
    upload_dir = "/app/generated/logos"
    os.makedirs(upload_dir, exist_ok=True)

    file_ext = os.path.splitext(file.filename)[1]
    filename = f"{os.urandom(8).hex()}{file_ext}"
    filepath = os.path.join(upload_dir, filename)

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {"logo_path": filepath}

@app.post("/api/batch", response_model=schemas.BatchResponse)
def batch_generate(batch: schemas.BatchCreate, db: Session = Depends(get_db)):
    results = []
    errors = []

    for qr_code in batch.codes:
        try:
            image_filename = qr_generator.generate_qr_code(
                url=qr_code.url,
                color=qr_code.color,
                size=qr_code.size,
                logo_path=qr_code.logo_path
            )
            image_path = f"/generated/{image_filename}"
            result = crud.create_qr_code(db, qr_code, image_path)
            results.append(result)
        except Exception as e:
            errors.append(f"Error for {qr_code.url}: {str(e)}")

    return schemas.BatchResponse(results=results, errors=errors)

@app.get("/api/history", response_model=List[schemas.QRCodeResponse])
def get_history(
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    return crud.get_qr_codes(db, skip=skip, limit=limit, search=search)

@app.get("/api/history/{qr_id}", response_model=schemas.QRCodeResponse)
def get_qr(qr_id: int, db: Session = Depends(get_db)):
    db_qr = crud.get_qr_code(db, qr_id)
    if not db_qr:
        raise HTTPException(status_code=404, detail="QR code not found")
    return db_qr

@app.delete("/api/history/{qr_id}")
def delete_qr(qr_id: int, db: Session = Depends(get_db)):
    db_qr = crud.get_qr_code(db, qr_id)
    if not db_qr:
        raise HTTPException(status_code=404, detail="QR code not found")

    image_path = db_qr.image_path.replace("/generated/", "/app/generated/")
    if os.path.exists(image_path):
        os.remove(image_path)

    crud.delete_qr_code(db, qr_id)
    return {"message": "QR code deleted successfully"}
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/main.py
git commit -m "feat: add FastAPI endpoints for QR generation, batch, and history"
```

---

### Task 5: Frontend Setup & Styling

**Covers:** [S2]

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/tailwind.config.js`
- Create: `frontend/index.html`
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/App.tsx`
- Create: `frontend/src/index.css`

**Interfaces:**
- Consumes: Backend API at `/api/`
- Produces: React app shell with dark theme

- [ ] **Step 1: Create frontend/package.json**

```json
{
  "name": "qr-generator-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-qr-code": "^2.0.12"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.3",
    "vite": "^5.0.10"
  }
}
```

- [ ] **Step 2: Create frontend/vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://backend:8000',
        changeOrigin: true,
      }
    }
  }
})
```

- [ ] **Step 3: Create frontend/tailwind.config.js**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 4: Create frontend/index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>QR Code Generator</title>
  </head>
  <body class="bg-gray-900 text-white">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Create frontend/src/main.tsx**

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

- [ ] **Step 6: Create frontend/src/index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

.gradient-bg {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.card-glass {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

- [ ] **Step 7: Create frontend/src/App.tsx**

```typescript
import { useState } from 'react'
import QRGenerator from './components/QRGenerator'
import History from './components/History'

function App() {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleGenerated = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="gradient-bg py-12 text-center">
        <h1 className="text-4xl font-bold mb-2">QR Code Generator</h1>
        <p className="text-white/80">Generate beautiful QR codes instantly</p>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <QRGenerator onGenerated={handleGenerated} />
        <History refreshKey={refreshKey} />
      </main>

      <footer className="text-center py-6 text-gray-500 text-sm">
        Built with FastAPI + React
      </footer>
    </div>
  )
}

export default App
```

- [ ] **Step 8: Commit**

```bash
git add frontend/
git commit -m "feat: add React frontend setup with Vite, Tailwind, and dark theme"
```

---

### Task 6: Frontend API Client

**Covers:** [S4]

**Files:**
- Create: `frontend/src/api/client.ts`

**Interfaces:**
- Consumes: Backend API endpoints
- Produces: Typed API functions for QR operations

- [ ] **Step 1: Create frontend/src/api/client.ts**

```typescript
const API_BASE = '/api'

export interface QRCodeData {
  id: number
  url: string
  color: string
  size: number
  logo_path: string | null
  image_path: string
  created_at: string
}

export interface GenerateOptions {
  url: string
  color?: string
  size?: number
  logo_path?: string
}

export async function generateQR(options: GenerateOptions): Promise<QRCodeData> {
  const res = await fetch(`${API_BASE}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options),
  })
  if (!res.ok) throw new Error('Failed to generate QR code')
  return res.json()
}

export async function uploadLogo(file: File): Promise<{ logo_path: string }> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch(`${API_BASE}/upload-logo`, {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) throw new Error('Failed to upload logo')
  return res.json()
}

export async function getHistory(
  skip = 0,
  limit = 50,
  search?: string
): Promise<QRCodeData[]> {
  const params = new URLSearchParams({ skip: String(skip), limit: String(limit) })
  if (search) params.set('search', search)
  const res = await fetch(`${API_BASE}/history?${params}`)
  if (!res.ok) throw new Error('Failed to fetch history')
  return res.json()
}

export async function deleteQR(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/history/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete QR code')
}

export async function batchGenerate(
  codes: GenerateOptions[]
): Promise<{ results: QRCodeData[]; errors: string[] }> {
  const res = await fetch(`${API_BASE}/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ codes }),
  })
  if (!res.ok) throw new Error('Failed to batch generate')
  return res.json()
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/api/
git commit -m "feat: add typed API client for backend communication"
```

---

### Task 7: QR Generator Component

**Covers:** [S3]

**Files:**
- Create: `frontend/src/components/QRGenerator.tsx`
- Create: `frontend/src/components/QRPreview.tsx`

**Interfaces:**
- Consumes: `generateQR`, `uploadLogo` from API client
- Produces: QR generator form with live preview

- [ ] **Step 1: Create frontend/src/components/QRPreview.tsx**

```typescript
import QRCode from 'react-qr-code'

interface QRPreviewProps {
  value: string
  color: string
  size: number
}

export default function QRPreview({ value, color, size }: QRPreviewProps) {
  if (!value) {
    return (
      <div
        className="bg-gray-800 rounded-lg flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <span className="text-gray-500">Enter a URL to preview</span>
      </div>
    )
  }

  return (
    <div className="bg-white p-4 rounded-lg inline-block">
      <QRCode
        value={value}
        size={size}
        fgColor={color}
        bgColor="white"
        level="H"
      />
    </div>
  )
}
```

- [ ] **Step 2: Create frontend/src/components/QRGenerator.tsx**

```typescript
import { useState } from 'react'
import QRPreview from './QRPreview'
import { generateQR, uploadLogo } from '../api/client'

interface QRGeneratorProps {
  onGenerated: () => void
}

export default function QRGenerator({ onGenerated }: QRGeneratorProps) {
  const [url, setUrl] = useState('')
  const [color, setColor] = useState('#6366f1')
  const [size, setSize] = useState(300)
  const [logo, setLogo] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleGenerate = async () => {
    if (!url) {
      setError('Please enter a URL')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      let logoPath: string | undefined

      if (logo) {
        const logoResult = await uploadLogo(logo)
        logoPath = logoResult.logo_path
      }

      const result = await generateQR({
        url,
        color,
        size,
        logo_path: logoPath,
      })

      setSuccess('QR code generated! Check history below.')
      onGenerated()

      const link = document.createElement('a')
      link.href = result.image_path
      link.download = `qr-${Date.now()}.png`
      link.click()
    } catch (err) {
      setError('Failed to generate QR code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card-glass rounded-2xl p-8 mb-8">
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-6">Generate QR Code</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">URL</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Color: {color}
              </label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full h-12 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Size: {size}px
              </label>
              <input
                type="range"
                min="100"
                max="1000"
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Logo (optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setLogo(e.target.files?.[0] || null)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors"
            >
              {loading ? 'Generating...' : 'Generate & Download'}
            </button>

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}
            {success && (
              <p className="text-green-400 text-sm">{success}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center">
          <p className="text-sm text-gray-400 mb-4">Live Preview</p>
          <QRPreview value={url} color={color} size={size} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/
git commit -m "feat: add QR generator component with live preview and customization"
```

---

### Task 8: History Component

**Covers:** [S4]

**Files:**
- Create: `frontend/src/components/History.tsx`

**Interfaces:**
- Consumes: `getHistory`, `deleteQR` from API client
- Produces: History grid with search and delete

- [ ] **Step 1: Create frontend/src/components/History.tsx**

```typescript
import { useState, useEffect } from 'react'
import { QRCodeData, getHistory, deleteQR } from '../api/client'

interface HistoryProps {
  refreshKey: number
}

export default function History({ refreshKey }: HistoryProps) {
  const [codes, setCodes] = useState<QRCodeData[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const data = await getHistory(0, 50, search || undefined)
      setCodes(data)
    } catch (err) {
      console.error('Failed to fetch history')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [refreshKey, search])

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this QR code?')) return
    try {
      await deleteQR(id)
      setCodes(codes.filter(c => c.id !== id))
    } catch (err) {
      console.error('Failed to delete')
    }
  }

  const handleDownload = (imagePath: string) => {
    const link = document.createElement('a')
    link.href = imagePath
    link.download = `qr-${Date.now()}.png`
    link.click()
  }

  return (
    <div className="card-glass rounded-2xl p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">History</h2>
        <input
          type="text"
          placeholder="Search URLs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg w-64"
        />
      </div>

      {loading ? (
        <p className="text-gray-400 text-center py-8">Loading...</p>
      ) : codes.length === 0 ? (
        <p className="text-gray-400 text-center py-8">No QR codes generated yet</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {codes.map((code) => (
            <div
              key={code.id}
              className="bg-gray-800 rounded-lg p-3 group relative"
            >
              <img
                src={code.image_path}
                alt="QR Code"
                className="w-full rounded mb-2"
              />
              <p className="text-xs text-gray-400 truncate" title={code.url}>
                {code.url}
              </p>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <button
                  onClick={() => handleDownload(code.image_path)}
                  className="p-1 bg-primary-600 rounded text-xs"
                >
                  ↓
                </button>
                <button
                  onClick={() => handleDelete(code.id)}
                  className="p-1 bg-red-600 rounded text-xs"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/History.tsx
git commit -m "feat: add history component with search, download, and delete"
```

---

### Task 9: Integration Test & Final Verification

**Covers:** [S1, S2, S3, S4, S5]

**Files:**
- None (verification only)

**Interfaces:**
- Consumes: All previous tasks
- Produces: Verified working application

- [ ] **Step 1: Build and start Docker Compose**

```bash
docker-compose up --build -d
```

- [ ] **Step 2: Verify backend health**

```bash
curl http://localhost:8000/api/health
# Expected: {"status": "healthy"}
```

- [ ] **Step 3: Test QR generation API**

```bash
curl -X POST http://localhost:8000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "color": "#6366f1", "size": 300}'
# Expected: JSON with id, url, image_path, etc.
```

- [ ] **Step 4: Test history endpoint**

```bash
curl http://localhost:8000/api/history
# Expected: Array with the QR code we just created
```

- [ ] **Step 5: Verify frontend loads**

```bash
curl -s http://localhost:3000 | head -20
# Expected: HTML with React app
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: complete QR code generator application"
```

---

## Execution Handoff

Plan saved. How would you like to execute it?

- **Subagent, always** — Fresh subagent per task, remember for future sessions
- **Subagent, this time** — Fresh subagent per task, just this once
- **Inline, always** — Execute in this session, remember for future sessions
- **Inline, this time** — Execute in this session, just this once
