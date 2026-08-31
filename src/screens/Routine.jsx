import { Rule, Empty, Disclaimer } from '../components/Bits.jsx'
import { CONCERNS } from '../lib/analyze.js'

function Steps({ title, steps }) {
  return (
    <>
      <Rule>{title}</Rule>
      {steps.map((s, i) => (
        <div className="step" key={`${title}-${s.role}`}>
          <div className="step-n">{String(i + 1).padStart(2, '0')}</div>
          <div>
            <div className="step-role">{s.role}</div>
            <div className="step-prod">
              {s.product.brand} {s.product.name}
            </div>
            <div className="row" style={{ marginTop: '0.375rem' }}>
              <span className="step-why">{s.product.keyIngredients}</span>
              <span className="step-price">${s.product.price}</span>
            </div>
          </div>
        </div>
      ))}
    </>
  )
}

export default function Routine({ routine, profile, latest, goTo }) {
  if (!routine) {
    return (
      <Empty
        title="Your profile first"
        action={
          <button className="btn" onClick={() => goTo('profile')} style={{ marginTop: '1rem' }}>
            Set up my profile
          </button>
        }
      >
        A routine needs to know your skin type and how reactive you are.
        Two taps and you are done.
      </Empty>
    )
  }

  const drivers = latest
    ? CONCERNS
        .map((c) => ({ ...c, value: latest.concerns[c.key] }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 2)
    : []

  const goalLabels = (profile.goals || [])
    .map((g) => CONCERNS.find((c) => c.key === g)?.label)
    .filter(Boolean)

  return (
    <div className="fade">
      <p className="eyebrow">Step three</p>
      <h1 className="display" style={{ marginTop: '0.5rem' }}>
        Built for<br /><em>your</em> skin.
      </h1>

      <p className="lede" style={{ marginTop: '1rem' }}>
        {goalLabels.length > 0
          ? `Aimed at ${goalLabels.join(' and ').toLowerCase()}`
          : 'Aimed at keeping things steady'}
        {drivers.length > 0 && `, with ${drivers.map((d) => d.label.toLowerCase()).join(' and ')} scoring highest in your last scan`}
        . Everything here is fragrance-conscious{profile.sensitivity === 'very' || profile.sensitivity === 'sensitive' ? ' and picked to be gentle' : ''}.
      </p>

      <Steps title="Morning" steps={routine.am} />
      <Steps title="Night" steps={routine.pm} />

      <Rule>Cost</Rule>
      <p className="fine" style={{ marginTop: '-0.5rem' }}>
        Cleanser and moisturizer are shared across both routines, so you buy{' '}
        {routine.products.length} products, not {routine.am.length + routine.pm.length}.
      </p>
      <div className={`total${routine.overBudget ? ' over' : ''}`}>
        <span>{routine.products.length} products</span>
        <span>
          ${routine.total}
          {routine.budget > 0 && ` / $${routine.budget}`}
        </span>
      </div>
      {routine.overBudget && (
        <div className="note" style={{ marginTop: '0.875rem' }}>
          This is the cheapest combination that still fits your skin type and
          sensitivity. Raising the budget slider opens up better matches.
        </div>
      )}

      <Rule>How to run it</Rule>
      <div className="stack">
        {routine.notes.map((n) => (
          <p className="small" key={n} style={{ margin: 0 }}>{n}</p>
        ))}
      </div>

      <div className="stack" style={{ marginTop: '2rem' }}>
        <button className="btn ghost" onClick={() => goTo('profile')}>
          Adjust my profile
        </button>
      </div>

      <p className="fine" style={{ marginTop: '1.5rem' }}>
        Prices are indicative US drugstore prices for demonstration and will not
        match what you actually pay. A production build would pull live pricing.
      </p>

      <Disclaimer />
    </div>
  )
}
