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
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mt-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">History</h2>
        <input
          type="text"
          placeholder="Search URLs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg w-64 text-white placeholder-slate-400"
        />
      </div>

      {loading ? (
        <p className="text-slate-400 text-center py-8">Loading...</p>
      ) : codes.length === 0 ? (
        <p className="text-slate-400 text-center py-8">No QR codes generated yet</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {codes.map((code) => (
            <div
              key={code.id}
              className="bg-slate-700 rounded-lg p-3 group relative"
            >
              <img
                src={code.image_path}
                alt="QR Code"
                className="w-full rounded mb-2"
              />
              <p className="text-xs text-slate-400 truncate" title={code.url}>
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
