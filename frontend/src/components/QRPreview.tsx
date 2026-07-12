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
