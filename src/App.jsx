import React from 'react'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'

// ── Data generation ───────────────────────────────────────────────────────────
function generateData() {
  const start = new Date('2026-04-14')
  const rows = []
  for (let i = 0; i < 30; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const label = d.toISOString().slice(0, 10)
    const isTripOff = i >= 16 && i <= 21

    let normalRev = 0, normalLoss = 0, normalConv = 0
    let tripRev = 0, tripLoss = 0, tripConv = 0

    if (isTripOff) {
      const scale = i === 18 ? 3 : i === 17 || i === 19 ? 2 : i === 20 ? 1.5 : 1.2
      tripRev  = Math.round(25000 * scale + Math.random() * 5000)
      tripLoss = Math.round(tripRev * (0.08 + Math.random() * 0.06))
      tripConv = Math.round(900 * scale + Math.random() * 200)
    } else {
      normalRev  = Math.round(25000 + Math.random() * 20000)
      normalLoss = Math.round(normalRev * (0.03 + Math.random() * 0.04))
      normalConv = Math.round(400 + Math.random() * 200)
    }

    rows.push({ date: label, normalRev, normalLoss, normalConv, tripRev, tripLoss, tripConv })
  }
  return rows
}

const data = generateData()

// Refunds as negative values so they render below the zero line
const chartData = data.map(d => ({
  ...d,
  normalLossNeg: -d.normalLoss,
  tripLossNeg:   -d.tripLoss,
}))

const totalNormalRev = data.reduce((s, d) => s + d.normalRev, 0)
const totalTripRev   = data.reduce((s, d) => s + d.tripRev, 0)
const totalLoss      = data.reduce((s, d) => s + d.normalLoss + d.tripLoss, 0)
const avgDailyRev    = Math.round((totalNormalRev + totalTripRev) / data.length)
const totalConversions = data.reduce((s, d) => s + d.normalConv + d.tripConv, 0)

// Aligned zero: y1Min forces the right axis 0 to the same pixel height as the left axis 0
const yMax  = Math.ceil(Math.max(...data.map(d => d.normalRev + d.tripRev)) * 1.1 / 10000) * 10000
const yMin  = -Math.ceil(Math.max(...data.map(d => d.normalLoss + d.tripLoss)) * 1.6 / 1000) * 1000
const y1Max = Math.ceil(Math.max(...data.map(d => d.normalConv + d.tripConv)) * 1.1 / 100) * 100
const y1Min = Math.round(y1Max * yMin / yMax)

function fmt(n) {
  return '¥' + n.toLocaleString()
}

// ── Custom Tooltip ────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null

  const get = key => payload.find(x => x.dataKey === key)?.value ?? 0

  const normalRev   = get('normalRev')
  const tripRev     = get('tripRev')
  const normalLoss  = -get('normalLossNeg')
  const tripLoss    = -get('tripLossNeg')
  const normalConv  = get('normalConv')
  const tripConv    = get('tripConv')
  const totalRev    = normalRev + tripRev
  const totalRefund = normalLoss + tripLoss

  return (
    <div className="tooltip-box">
      <div className="tooltip-date">{label}</div>

      <div className="tooltip-row" style={{ color: '#3b82f6' }}>
        <span>Normal Revenue</span><span>{fmt(normalRev)}</span>
      </div>
      <div className="tooltip-row" style={{ color: '#8b5cf6' }}>
        <span>Trip-off Revenue</span><span>{fmt(tripRev)}</span>
      </div>
      <div className="tooltip-row tooltip-total">
        <span>Total Revenue (Gross)</span><span>{fmt(totalRev)}</span>
      </div>

      <hr className="tooltip-divider" />

      <div className="tooltip-row" style={{ color: '#e53e3e' }}>
        <span>Normal Refund</span><span>−{fmt(normalLoss)}</span>
      </div>
      <div className="tooltip-row" style={{ color: '#e53e3e' }}>
        <span>Trip-off Refund</span><span>−{fmt(tripLoss)}</span>
      </div>
      <div className="tooltip-row tooltip-total tooltip-loss">
        <span>Total Refund</span><span>−{fmt(totalRefund)}</span>
      </div>

      <hr className="tooltip-divider" />

      <div className="tooltip-row" style={{ color: '#3b82f6' }}>
        <span>Normal Conversions</span><span>{normalConv.toLocaleString()}</span>
      </div>
      <div className="tooltip-row" style={{ color: '#8b5cf6' }}>
        <span>Trip-off Conversions</span><span>{tripConv.toLocaleString()}</span>
      </div>
      <div className="tooltip-row tooltip-total">
        <span>Total Conversions</span><span>{(normalConv + tripConv).toLocaleString()}</span>
      </div>
    </div>
  )
}

// ── Legend ────────────────────────────────────────────────────────────────────
function CustomLegend() {
  const bars = [
    { color: '#93c5fd', label: 'Normal Revenue' },
    { color: '#c4b5fd', label: 'Trip-off Revenue' },
    { color: '#fca5a5', label: 'Normal Refund' },
    { color: '#f87171', label: 'Trip-off Refund' },
  ]
  const lines = [
    { color: '#3b82f6', label: 'Normal Conversions',   dashed: false },
    { color: '#8b5cf6', label: 'Trip-off Conversions', dashed: true  },
  ]
  return (
    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '10px', fontSize: '12px' }}>
      {bars.map(({ color, label }) => (
        <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#555' }}>
          <span style={{ width: 11, height: 11, background: color, borderRadius: 2, flexShrink: 0 }} />
          {label}
        </span>
      ))}
      {lines.map(({ color, label, dashed }) => (
        <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#555' }}>
          <svg width="22" height="10" viewBox="0 0 22 10" style={{ flexShrink: 0 }}>
            <line x1="0" y1="5" x2="22" y2="5" stroke={color} strokeWidth="1.8"
              strokeDasharray={dashed ? '4 2' : undefined} strokeLinecap="round" />
          </svg>
          {label}
        </span>
      ))}
    </div>
  )
}

// ── Zero label on both sides of the baseline ─────────────────────────────────
function ZeroLabel({ viewBox }) {
  const { x, y, width } = viewBox
  const style = { fontSize: 10, fill: 'rgba(100,100,100,0.85)', fontWeight: 700 }
  return (
    <>
      <text x={x - 4} y={y + 4} textAnchor="end" {...style}>0</text>
      <text x={x + width + 4} y={y + 4} textAnchor="start" {...style}>0</text>
    </>
  )
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <div className="card">
      <div className="chart-title">Daily Performance Trend</div>
      <div className="chart-subtitle">Apr 14 – May 13, 2026</div>

      <div className="summary-cards">
        <div className="summary-card">
          <div className="label">Total Revenue (Gross)</div>
          <div className="value">{fmt(totalNormalRev + totalTripRev)}</div>
        </div>
        <div className="summary-card">
          <div className="label">Average Daily Revenue</div>
          <div className="value">{fmt(avgDailyRev)}</div>
        </div>
        <div className="summary-card loss">
          <div className="label">Total Refund</div>
          <div className="value">-{fmt(totalLoss)}</div>
        </div>
        <div className="summary-card">
          <div className="label">Total Conversions</div>
          <div className="value">{totalConversions.toLocaleString()}</div>
        </div>
      </div>

      <CustomLegend />
      <ResponsiveContainer width="100%" height={380}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 60, left: 10, bottom: 0 }} barGap={0} barCategoryGap="15%">
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <ReferenceLine yAxisId="rev" y={0} stroke="rgba(136,135,128,0.55)" strokeWidth={1.5} label={<ZeroLabel />} />

          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#999' }}
            tickFormatter={v => v.slice(5)}
            interval={1}
            angle={-45}
            textAnchor="end"
            height={50}
          />
          <YAxis
            yAxisId="rev"
            orientation="left"
            domain={[yMin, yMax]}
            tick={{ fontSize: 10, fill: '#999' }}
            tickFormatter={v => v === 0 ? '0' : (v / 1000) + 'k'}
            axisLine={false}
            tickLine={false}
            label={{ value: 'Revenue (¥)', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 11, fill: '#aaa' } }}
          />
          <YAxis
            yAxisId="conv"
            orientation="right"
            domain={[y1Min, y1Max]}
            tick={{ fontSize: 10, fill: '#999' }}
            tickFormatter={v => v < 0 ? '' : v.toLocaleString()}
            axisLine={false}
            tickLine={false}
            label={{ value: 'Conversions', angle: 90, position: 'insideRight', offset: 10, style: { fontSize: 11, fill: '#aaa' } }}
          />

          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />

          {/* Revenue bars — stacked upward */}
          <Bar yAxisId="rev" dataKey="normalRev"     stackId="rev"  fill="#93c5fd" name="Normal Revenue" />
          <Bar yAxisId="rev" dataKey="tripRev"       stackId="rev"  fill="#c4b5fd" name="Trip-off Revenue" />

          {/* Refund bars — stacked downward (negative values) */}
          <Bar yAxisId="rev" dataKey="normalLossNeg" stackId="loss" fill="#fca5a5" name="Normal Refund" />
          <Bar yAxisId="rev" dataKey="tripLossNeg"   stackId="loss" fill="#f87171" name="Trip-off Refund" />

          {/* Conversion lines */}
          <Line yAxisId="conv" type="monotone" dataKey="normalConv" stroke="#3b82f6" strokeWidth={1.5} dot={false} name="Normal Conversions" />
          <Line yAxisId="conv" type="monotone" dataKey="tripConv"   stroke="#8b5cf6" strokeWidth={1.5} dot={false} strokeDasharray="4 2" name="Trip-off Conversions" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
