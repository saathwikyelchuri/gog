import { useRef } from 'react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Brush, LabelList
} from 'recharts'

const COLORS = [
  '#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b',
  '#ef4444', '#ec4899', '#14b8a6', '#f97316', '#84cc16'
]

const CHART_BG = 'rgba(255,255,255,0)'
const GRID_COLOR = 'rgba(255,255,255,0.06)'
const AXIS_COLOR = '#6b7280'
const TEXT_COLOR = '#9ca3af'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="glass rounded-xl px-4 py-3 shadow-2xl text-sm">
      {label && <p className="text-white font-semibold mb-1">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color || entry.fill }} className="font-medium">
          {entry.name}: {typeof entry.value === 'number'
            ? entry.value.toLocaleString(undefined, { maximumFractionDigits: 2 })
            : entry.value}
        </p>
      ))}
    </div>
  )
}

const CustomPieTooltip = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null
  const entry = payload[0]
  return (
    <div className="glass rounded-xl px-4 py-3 shadow-2xl text-sm">
      <p className="text-white font-semibold">{entry.name}</p>
      <p style={{ color: entry.payload.fill }} className="font-medium">
        {entry.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        {' '}({((entry.payload.percent || 0) * 100).toFixed(1)}%)
      </p>
    </div>
  )
}

const renderCustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, percent }) => {
  if (percent < 0.05) return null
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {(percent * 100).toFixed(0)}%
    </text>
  )
}

export default function ChartRenderer({ chartPayload, chartRef }) {
  const { chartType, chartData, yColumn = 'value', xColumn = 'name' } = chartPayload

  const axisStyle = { tick: { fill: TEXT_COLOR, fontSize: 11 }, axisLine: false, tickLine: false }
  const gridStyle = { stroke: GRID_COLOR, strokeDasharray: '3 3' }

  const tickFormatter = (val) => {
    if (typeof val === 'number') {
      if (Math.abs(val) >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`
      if (Math.abs(val) >= 1_000) return `${(val / 1_000).toFixed(0)}K`
      return val.toLocaleString(undefined, { maximumFractionDigits: 1 })
    }
    if (typeof val === 'string' && val.length > 12) return val.slice(0, 12) + '…'
    return val
  }

  const renderChart = () => {
    if (chartType === 'bar') {
      return (
        <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 60 }} barCategoryGap="30%" barGap={4}>
          <CartesianGrid {...gridStyle} vertical={false} />
          <XAxis dataKey="name" angle={-35} textAnchor="end" interval={0} {...axisStyle} />
          <YAxis tickFormatter={tickFormatter} {...axisStyle} width={60} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(v) => <span style={{ color: TEXT_COLOR, fontSize: 12 }}>{v}</span>}
            wrapperStyle={{ paddingTop: '8px' }}
          />
          <Brush dataKey="name" height={20} stroke="rgba(99,102,241,0.3)" fill="rgba(99,102,241,0.05)" travellerWidth={6} />
          <Bar dataKey={yColumn} radius={[6, 6, 0, 0]} maxBarSize={60}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.9} />
            ))}
          </Bar>
        </BarChart>
      )
    }

    if (chartType === 'line') {
      return (
        <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 60 }}>
          <CartesianGrid {...gridStyle} />
          <XAxis dataKey="name" angle={-35} textAnchor="end" interval={Math.floor(chartData.length / 8)} {...axisStyle} />
          <YAxis tickFormatter={tickFormatter} {...axisStyle} width={60} />
          <Tooltip content={<CustomTooltip />} />
          <Legend formatter={(v) => <span style={{ color: TEXT_COLOR, fontSize: 12 }}>{v}</span>} />
          <Brush dataKey="name" height={20} stroke="rgba(99,102,241,0.3)" fill="rgba(99,102,241,0.05)" travellerWidth={6} />
          <Line
            type="monotone"
            dataKey={yColumn}
            stroke="#6366f1"
            strokeWidth={2.5}
            dot={{ fill: '#6366f1', r: 3, strokeWidth: 2 }}
            activeDot={{ r: 6, fill: '#818cf8', strokeWidth: 0 }}
          />
        </LineChart>
      )
    }

    if (chartType === 'pie') {
      return (
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            outerRadius="70%"
            innerRadius="35%"
            dataKey="value"
            nameKey="name"
            paddingAngle={3}
            labelLine={false}
            label={renderCustomPieLabel}
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="rgba(0,0,0,0.3)" strokeWidth={1} />
            ))}
          </Pie>
          <Tooltip content={<CustomPieTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(v) => <span style={{ color: TEXT_COLOR, fontSize: 11 }}>{v}</span>}
          />
        </PieChart>
      )
    }

    if (chartType === 'scatter') {
      return (
        <ScatterChart margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
          <CartesianGrid {...gridStyle} />
          <XAxis dataKey="x" name={xColumn} tickFormatter={tickFormatter} {...axisStyle} label={{ value: xColumn, position: 'bottom', fill: AXIS_COLOR, fontSize: 11, dy: 15 }} />
          <YAxis dataKey="y" name={yColumn} tickFormatter={tickFormatter} {...axisStyle} width={60} label={{ value: yColumn, angle: -90, position: 'insideLeft', fill: AXIS_COLOR, fontSize: 11 }} />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: GRID_COLOR }} />
          <Scatter data={chartData} fill={COLORS[0]} fillOpacity={0.7} />
        </ScatterChart>
      )
    }

    return <p className="text-gray-400">Unsupported chart type: {chartType}</p>
  }

  return (
    <div ref={chartRef} className="w-full" style={{ height: 420 }}>
      <ResponsiveContainer width="100%" height="100%">
        {renderChart()}
      </ResponsiveContainer>
    </div>
  )
}
