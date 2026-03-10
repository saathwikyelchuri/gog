const COLOR_MAP = {
  blue: 'metric-card-blue',
  green: 'metric-card-green',
  purple: 'metric-card-purple',
  orange: 'metric-card-orange'
}

const ICON_BG = {
  blue: 'bg-blue-500/20 text-blue-400',
  green: 'bg-green-500/20 text-green-400',
  purple: 'bg-purple-500/20 text-purple-400',
  orange: 'bg-orange-500/20 text-orange-400'
}

export default function MetricCards({ metrics }) {
  if (!metrics || metrics.length === 0) return null

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
      {metrics.map((m, i) => (
        <div
          key={i}
          className={`rounded-2xl p-4 ${COLOR_MAP[m.color] || COLOR_MAP.blue} animate-slideUp transition-all duration-300 hover:scale-[1.02]`}
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className={`w-8 h-8 rounded-xl ${ICON_BG[m.color] || ICON_BG.blue} flex items-center justify-center text-base`}>
              {m.icon}
            </span>
          </div>
          <p className="text-xl font-bold text-white leading-tight truncate" title={m.value}>{m.value}</p>
          <p className="text-xs text-gray-400 mt-1 font-medium truncate">{m.label}</p>
        </div>
      ))}
    </div>
  )
}
