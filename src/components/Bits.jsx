/** Small shared pieces. Kept deliberately plain. */

export function Rule({ children }) {
  return (
    <div className="rule">
      <span className="eyebrow">{children}</span>
    </div>
  )
}

const band = (v) => (v >= 66 ? 'high' : v >= 34 ? 'warn' : '')

const WORDING = [
  { max: 20, word: 'Barely present' },
  { max: 40, word: 'Mild' },
  { max: 60, word: 'Moderate' },
  { max: 80, word: 'Noticeable' },
  { max: 101, word: 'Pronounced' },
]

export const severityWord = (v) => WORDING.find((w) => v < w.max).word

export function Metric({ label, value, right }) {
  return (
    <div className="metric">
      <div className="metric-head">
        <span className="metric-name">{label}</span>
        <span className="metric-val">
          {right ?? (
            <>
              {severityWord(value)} <span className="num">{value}</span>
            </>
          )}
        </span>
      </div>
      <div className="bar">
        <i className={band(value)} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

export function Empty({ title, children, action }) {
  return (
    <div className="empty stack">
      <div className="h2" style={{ color: 'var(--ink)' }}>{title}</div>
      <p className="lede">{children}</p>
      {action}
    </div>
  )
}

export function Disclaimer() {
  return (
    <p className="fine" style={{ marginTop: '2rem' }}>
      Lumen looks at the appearance of skin in a photo. It is not a medical
      device and does not diagnose anything. For a rash, a painful or changing
      spot, or anything that worries you, see a doctor or dermatologist. Always
      read the product label yourself before using something new.
    </p>
  )
}
