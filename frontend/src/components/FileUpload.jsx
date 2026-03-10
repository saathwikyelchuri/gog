import { useCallback, useState } from 'react'

export default function FileUpload({ onUpload, onPreload, isLoading, preloadLoading, datasetInfo }) {
  const [dragOver, setDragOver] = useState(false)

  const handleFile = useCallback((file) => {
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['csv', 'xlsx', 'xls'].includes(ext)) {
      alert('Please upload a CSV or Excel file.')
      return
    }
    onUpload(file)
  }, [onUpload])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files[0])
  }, [handleFile])

  const handleChange = useCallback((e) => {
    handleFile(e.target.files[0])
    e.target.value = ''
  }, [handleFile])

  if (datasetInfo) {
    return (
      <div className="rounded-xl p-3 bg-green-500/10 border border-green-500/20 flex items-start gap-3 animate-fadeIn">
        <div className="text-green-400 text-xl mt-0.5">✓</div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-green-400">Dataset Ready</p>
          <p className="text-xs text-gray-400 mt-0.5 truncate">
            {datasetInfo.rowCount.toLocaleString()} rows · {datasetInfo.columns.length} columns
          </p>
          <button
            onClick={() => document.getElementById('file-input-replace').click()}
            className="text-xs text-brand-400 hover:text-brand-300 mt-1 transition-colors"
          >
            Replace file →
          </button>
          <input id="file-input-replace" type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleChange} />
        </div>
      </div>
    )
  }

  const busy = isLoading || preloadLoading

  return (
    <div className="flex flex-col gap-2">
      {/* Nykaa Quick-Load Button */}
      <button
        onClick={onPreload}
        disabled={busy}
        className={`
          w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3
          bg-gradient-to-r from-pink-600/80 to-rose-600/80
          hover:from-pink-500/90 hover:to-rose-500/90
          border border-pink-500/30 text-white text-sm font-semibold
          transition-all duration-200 shadow-lg shadow-pink-900/20
          ${busy ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:scale-[1.01]'}
        `}
      >
        {preloadLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Loading Nykaa Dataset...
          </>
        ) : (
          <>
            <span className="text-base">💄</span>
            Load Nykaa Digital Marketing Dataset
          </>
        )}
      </button>

      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-xs text-gray-600">or upload your own</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      {/* Drag & Drop Upload */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !busy && document.getElementById('file-input-main').click()}
        className={`
          relative rounded-xl border-2 border-dashed p-5 text-center cursor-pointer transition-all duration-300
          ${dragOver
            ? 'border-brand-400 bg-brand-500/10 scale-[1.01]'
            : 'border-white/15 hover:border-brand-500/50 hover:bg-white/[0.02]'
          }
          ${busy ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''}
        `}
      >
        <input
          id="file-input-main"
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={handleChange}
          disabled={busy}
        />

        {isLoading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-brand-400 font-medium">Processing dataset...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-2xl">
              📂
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Upload Dataset</p>
              <p className="text-xs text-gray-500 mt-0.5">Drag & drop or click to browse</p>
              <p className="text-xs text-gray-600 mt-1">CSV, XLSX, XLS supported</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
