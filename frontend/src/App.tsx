function App() {
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* QR Generator Section */}
          <section className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h2 className="text-lg font-semibold mb-4 text-white">Generate QR Code</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  URL or Text
                </label>
                <input
                  type="text"
                  placeholder="https://example.com"
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <button className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-lg transition-colors">
                Generate QR Code
              </button>
            </div>

            {/* QR Preview Area */}
            <div className="mt-6 border-2 border-dashed border-slate-600 rounded-lg p-8 flex items-center justify-center text-slate-500">
              QR code preview will appear here
            </div>
          </section>

          {/* History Section */}
          <section className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h2 className="text-lg font-semibold mb-4 text-white">Recent QR Codes</h2>
            <div className="space-y-3">
              <div className="text-slate-500 text-center py-8">
                No QR codes generated yet
              </div>
            </div>
          </section>
        </div>
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
