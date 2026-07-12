import { useState } from 'react'
import QRGenerator from './components/QRGenerator'
import History from './components/History'

function App() {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleGenerated = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary-400">Link to QR</h1>
          <p className="text-slate-400 text-sm">Generate QR codes from any URL</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        <QRGenerator onGenerated={handleGenerated} />
        <History refreshKey={refreshKey} />
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 border-t border-slate-700 px-6 py-4">
        <div className="max-w-7xl mx-auto text-center text-slate-500 text-sm">
          Link to QR &mdash; Convert URLs to QR codes instantly
        </div>
      </footer>
    </div>
  )
}

export default App
