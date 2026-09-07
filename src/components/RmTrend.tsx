import { useId, useMemo } from 'react'
import { formatShortDay } from '../lib/format'
import { formatKgValue, rmTrendPoints, type RmLift } from '../types/rm'

const WIDTH = 320
const HEIGHT = 72
const PAD_X = 10
const PAD_Y = 8

export function RmTrend({ lifts, exercise }: { lifts: RmLift[]; exercise: string }) {
  const fillId = `rm-trend-${useId().replace(/:/g, '')}`
  const points = useMemo(() => rmTrendPoints(lifts), [lifts])
  const chart = useMemo(() => {
    if (points.length < 2) return null
    const kgs = points.map((point) => point.kg)
    const minKg = Math.min(...kgs)
    const maxKg = Math.max(...kgs)
    const span = maxKg - minKg || Math.max(1, maxKg * 0.08)
    const yMin = minKg - span * 0.18
    const yMax = maxKg + span * 0.18
    const minAt = points[0].at
    const maxAt = points[points.length - 1].at
    const atSpan = maxAt - minAt
    const innerW = WIDTH - PAD_X * 2
    const innerH = HEIGHT - PAD_Y * 2
    const plotted = points.map((point, index) => {
      const x =
        atSpan === 0
          ? PAD_X + (points.length === 1 ? innerW / 2 : (index / (points.length - 1)) * innerW)
          : PAD_X + ((point.at - minAt) / atSpan) * innerW
      const y = PAD_Y + (1 - (point.kg - yMin) / (yMax - yMin)) * innerH
      return { ...point, x, y }
    })
    const line = plotted.map((point) => `${point.x},${point.y}`).join(' ')
    const first = plotted[0]
    const last = plotted[plotted.length - 1]
    const linePath = plotted.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
    const area = `${linePath} L ${last.x} ${PAD_Y + innerH} L ${first.x} ${PAD_Y + innerH} Z`
    const delta = last.kg - first.kg
    return { plotted, line, area, first, last, delta }
  }, [points])

  if (!chart) return null

  const deltaLabel =
    Math.abs(chart.delta) < 0.05
      ? 'sin cambio'
      : `${chart.delta > 0 ? '+' : '−'}${formatKgValue(Math.abs(chart.delta))} kg`
  const deltaClass = chart.delta > 0.05 ? 'text-gold' : chart.delta < -0.05 ? 'text-warn' : 'text-mute'

  return (
    <div className="mt-4 rounded-2xl bg-panel-2 px-3 py-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs font-semibold tracking-[0.22em] text-mute">1RM</p>
        <p className={`text-xs font-semibold ${deltaClass}`}>{deltaLabel}</p>
      </div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="mt-1 h-[4.5rem] w-full"
        role="img"
        aria-label={`Evolución del 1RM de ${exercise}: de ${formatKgValue(chart.first.kg)} kg a ${formatKgValue(chart.last.kg)} kg`}
      >
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f5c518" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#f5c518" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={chart.area} fill={`url(#${fillId})`} />
        <polyline
          points={chart.line}
          fill="none"
          stroke="#f5c518"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {chart.plotted.map((point, index) => {
          const latest = index === chart.plotted.length - 1
          return (
            <circle
              key={point.id}
              cx={point.x}
              cy={point.y}
              r={latest ? 4.5 : 3}
              fill={latest ? '#ff5a1f' : '#f5c518'}
            />
          )
        })}
      </svg>
      <div className="mt-1 flex items-center justify-between text-[11px] text-mute">
        <span>
          {formatShortDay(chart.first.at)} · {formatKgValue(chart.first.kg)} kg
        </span>
        <span>
          {formatShortDay(chart.last.at)} · {formatKgValue(chart.last.kg)} kg
        </span>
      </div>
    </div>
  )
}
