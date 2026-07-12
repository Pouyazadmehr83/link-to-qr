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
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <h2 className="text-lg font-semibold mb-6 text-white">Generate QR Code</h2>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
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
            <label className="block text-sm font-medium text-slate-300 mb-2">
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
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Logo (optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setLogo(e.target.files?.[0] || null)}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
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

        <div className="flex flex-col items-center justify-center">
          <p className="text-sm text-slate-400 mb-4">Live Preview</p>
          <QRPreview value={url} color={color} size={size} />
        </div>
      </div>
    </div>
  )
}
