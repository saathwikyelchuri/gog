import { useRef, useCallback } from 'react'
import html2canvas from 'html2canvas'
import MetricCards from './MetricCards'
import ChartRenderer from './ChartRenderer'

const CHART_TYPE_ICONS = {
  bar: '📊', line: '📈', pie: '🥧', scatter: '🔵'
}

const CHART_TYPE_LABELS = {
  bar: 'Bar Chart', line: 'Line Chart', pie: 'Pie Chart', scatter: 'Scatter Plot'
}

function WelcomeState({ datasetInfo }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 select-none">
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-brand-500/20 to-purple-500/20 border border-brand-500/20 flex items-center justify-center text-5xl mx-auto">
          📊
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-sm shadow-lg">
          ✦
        </div>
      </div>
      <h2 className="text-2xl font-bold text-white mb-3 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
        {datasetInfo ? 'Ask a Question' : 'Upload Your Dataset'}
      </h2>
      <p className="text-gray-500 text-sm max-w-md leading-relaxed">
        {datasetInfo
          ? 'Type a question in the chat to generate interactive charts and insights from your marketing data.'
          : 'Upload a CSV or Excel file with your marketing data. Then ask questions in natural language to instantly generate charts and insights.'
        }
      </p>
      {!datasetInfo && (
        <div className="mt-8 grid grid-cols-3 gap-4">
          {[
            { icon: '📂', label: 'Upload CSV/XLSX' },
            { icon: '💬', label: 'Ask in plain English' },
            { icon: '✨', label: 'Get instant charts' }
          ].map((s, i) => (
            <div key={i} className="glass rounded-2xl p-4 text-center">
              <div className="text-2xl mb-2">{s.icon}</div>
              <p className="text-xs text-gray-400 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      )}
      {datasetInfo && (
        <div className="mt-6 grid grid-cols-2 gap-3 text-left w-full max-w-sm">
          {[
            'Show total revenue by channel',
            'Which campaign type has highest ROI?',
            'Show revenue trend over time',
            'Conversions by target audience'
          ].map((q, i) => (
            <div key={i} className="glass p-3 rounded-xl text-xs text-gray-400 border border-white/5 hover:border-brand-500/20 transition-colors cursor-default">
              "{q}"
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Dashboard({ chartPayload, datasetInfo }) {
  const chartContainerRef = useRef(null)

  const handleDownload = useCallback(async () => {
    if (!chartContainerRef.current) return
    try {
      const canvas = await html2canvas(chartContainerRef.current, {
        backgroundColor: '#0a0a1a',
        scale: 2,
        logging: false
      })
      const link = document.createElement('a')
      link.download = `bi-chart-${Date.now()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (e) {
      console.error('Download failed:', e)
    }
  }, [])

  if (!chartPayload) {
    return (
      <div className="h-full flex flex-col">
        <WelcomeState datasetInfo={datasetInfo} />
      </div>
    )
  }

  const { chartType, title, insight, filters, rowCount, sqlExecuted } = chartPayload
  const hasFilters = filters && filters.length > 0

  return (
    <div className="h-full flex flex-col p-5 overflow-auto">
      {/* Chart Header */}
      <div className="flex items-start justify-between mb-4 animate-fadeIn">
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-lg">{CHART_TYPE_ICONS[chartType] || '📊'}</span>
            <h2 className="text-lg font-bold text-white truncate">{title}</h2>
            <span className="text-xs text-brand-400 bg-brand-500/10 border border-brand-500/20 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
              {CHART_TYPE_LABELS[chartType] || chartType}
            </span>
          </div>
          {insight && (
            <p className="text-sm text-gray-400 leading-relaxed">{insight}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleDownload}
            className="btn-ghost text-xs flex items-center gap-1.5 py-1.5 px-3"
            title="Download chart as PNG"
            id="download-chart-btn"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </button>
        </div>
      </div>

      {/* Active Filters Badge */}
      {hasFilters && (
        <div className="flex flex-wrap gap-2 mb-3 animate-fadeIn">
          <span className="text-xs text-gray-500">Filters:</span>
          {filters.map((f, i) => (
            <span key={i} className="text-xs bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 px-2.5 py-1 rounded-full font-medium">
              {f.column}: {f.value}
            </span>
          ))}
        </div>
      )}

      {/* Metric Cards */}
      {chartPayload.metrics && <MetricCards metrics={chartPayload.metrics} />}

      {/* Chart */}
      <div
        ref={chartContainerRef}
        className="glass rounded-2xl p-5 flex-1 min-h-[420px] animate-slideUp"
      >
        <ChartRenderer chartPayload={chartPayload} chartRef={null} />
      </div>

      {/* Footer meta */}
      <div className="flex items-center justify-between mt-3 text-xs text-gray-600 animate-fadeIn">
        <span>{rowCount} data points</span>
        {sqlExecuted && (
          <details className="cursor-pointer">
            <summary className="hover:text-gray-400 transition-colors select-none">View SQL ▾</summary>
            <pre className="mt-2 glass rounded-lg p-3 text-gray-400 whitespace-pre-wrap overflow-auto max-h-32 text-[10px] text-left">
              {sqlExecuted}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}
