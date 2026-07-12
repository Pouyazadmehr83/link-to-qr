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
