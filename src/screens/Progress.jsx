import { useMemo } from 'react'
import { compareScans, lightingDrift, CONCERNS } from '../lib/analyze.js'
import { formatDate, daysAgo } from '../lib/store.js'
import { Rule, Empty, Metric, Disclaimer } from '../components/Bits.jsx'

const ARROW = { improving: '↑', worsening: '↓', steady: '→' }
const CLASS = { improving: 'up', worsening: 'down', steady: 'flat' }
const WORD = { improving: 'Improving', worsening: 'Worse', steady: 'Steady' }

/** Tiny inline sparkline of one concern over time. */
function Spark({ values }) {
  if (values.length < 2) return null

  const w = 62
  const h = 18
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const span = Math.max(max - min, 1)

  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w
      const y = h - ((v - min) / span) * h
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true"
      style={{ overflow: 'visible' }}>
      <polyline
        points={points}
        fill="none"
        stroke="var(--ink-4)"
        strokeWidth="1.25"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function Progress({ scans, goTo }) {
  const latest = scans[0]
  const previous = scans[1]

  const comparison = useMemo(
    () => (latest && previous ? compareScans(latest, previous) : null),
    [latest, previous]
  )

  const drift = useMemo(
    () => (latest && previous ? lightingDrift(latest, previous) : null),
    [latest, previous]
  )

  // Oldest first, so the sparklines read left to right in time.
  const history = useMemo(() => [...scans].reverse(), [scans])

  if (!latest) {
    return (
      <Empty
        title="Nothing to compare yet"
        action={
          <button className="btn" onClick={() => goTo('scan')} style={{ marginTop: '1rem' }}>
            Take a scan
          </button>
        }
      >
        Progress needs at least two scans. Take one now, then come back in three
        or four weeks. Skin turns over slowly and checking daily just measures
        your lighting.
      </Empty>
    )
  }

  if (!previous) {
    return (
      <div className="fade">
        <p className="eyebrow">Baseline set</p>
        <h1 className="display" style={{ marginTop: '0.5rem' }}>
          One down.<br />Come back in a <em>month</em>.
        </h1>
        <p className="lede" style={{ marginTop: '1rem' }}>
          Scanned {daysAgo(latest.at).toLowerCase()}. There is nothing to compare
          against yet, and that is fine. Give the routine three to four weeks
          before the next one, because that is roughly one full skin cycle.
        </p>

        <Rule>Your baseline</Rule>
        {CONCERNS.map((c) => (
          <Metric key={c.key} label={c.label} value={latest.concerns[c.key]} />
        ))}

        <Disclaimer />
      </div>
    )
  }

  const improving = comparison.filter((c) => c.direction === 'improving').length
  const worsening = comparison.filter((c) => c.direction === 'worsening').length

  return (
    <div className="fade">
      <p className="eyebrow">Step four</p>
      <h1 className="display" style={{ marginTop: '0.5rem' }}>
        {improving > worsening ? (
          <>Moving the<br />right <em>way</em>.</>
        ) : worsening > improving ? (
          <>Something<br />needs a <em>change</em>.</>
        ) : (
          <>Mostly<br />holding <em>steady</em>.</>
        )}
      </h1>

      <p className="lede" style={{ marginTop: '1rem' }}>
        Comparing {formatDate(latest.at)} against {formatDate(previous.at)}.
        {improving > 0 && ` ${improving} improving.`}
        {worsening > 0 && ` ${worsening} worse.`}
      </p>

      {drift && <div className="note" style={{ marginTop: '1.25rem' }}>{drift}</div>}

      <Rule>Change since last scan</Rule>
      {comparison.map((c) => {
        const series = history.map((s) => s.concerns[c.key])
        return (
          <div className="metric" key={c.key}>
            <div className="metric-head">
              <span className="metric-name">{c.label}</span>
              <span className="row" style={{ gap: '0.625rem' }}>
                <Spark values={series} />
                <span className={`delta ${CLASS[c.direction]}`}>
                  {ARROW[c.direction]} {WORD[c.direction]}
                </span>
              </span>
            </div>
            <div className="bar">
              <i
                className={c.now >= 66 ? 'high' : c.now >= 34 ? 'warn' : ''}
                style={{ width: `${c.now}%` }}
              />
            </div>
            <p className="fine" style={{ marginTop: '0.4375rem' }}>
              <span className="num">{c.before}</span> to <span className="num">{c.now}</span>
              {c.direction === 'steady' && ', inside the noise floor for photo lighting'}
            </p>
          </div>
        )
      })}

      <Rule>What to do about it</Rule>
      <div className="stack">
        {worsening > 0 ? (
          <>
            <p className="small" style={{ margin: 0 }}>
              {comparison.filter((c) => c.direction === 'worsening').map((c) => c.label.toLowerCase()).join(' and ')} went
              the wrong way. The usual cause is a new active introduced too fast.
            </p>
            <p className="small" style={{ margin: 0 }}>
              Pull your strongest treatment back to twice a week for two weeks
              before changing anything else. Changing two things at once means
              you learn nothing from either.
            </p>
          </>
        ) : improving > 0 ? (
          <p className="small" style={{ margin: 0 }}>
            It is working. Do not add anything. The most common mistake at this
            point is stacking a second active onto a routine that is already
            doing its job.
          </p>
        ) : (
          <p className="small" style={{ margin: 0 }}>
            Nothing moved much. Four weeks is early for texture and tone, so this
            is normal. If the next scan is also flat, it is worth stepping the
            treatment up.
          </p>
        )}
      </div>

      <Rule>All scans</Rule>
      {scans.map((s) => (
        <div className="metric" key={s.id}>
          <div className="row">
            <span>
              <span className="metric-name">{formatDate(s.at)}</span>
              <span className="fine" style={{ display: 'block' }}>
                {daysAgo(s.at)} · {s.meta.skinType} · brightness{' '}
                <span className="num">{s.meta.brightness}</span>
              </span>
            </span>
            {!s.meta.lightingOk && <span className="delta flat">lighting</span>}
          </div>
        </div>
      ))}

      <Disclaimer />
    </div>
  )
}
