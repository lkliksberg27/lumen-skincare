import { useState } from 'react'
import { CONCERNS } from '../lib/analyze.js'
import { profileComplete } from '../lib/store.js'
import { Rule, Disclaimer } from '../components/Bits.jsx'

const SKIN_TYPES = [
  { id: 'oily', label: 'Oily' },
  { id: 'dry', label: 'Dry' },
  { id: 'combination', label: 'Combination' },
  { id: 'normal', label: 'Normal' },
]

const SENSITIVITY = [
  { id: 'none', label: 'Not sensitive' },
  { id: 'mild', label: 'Slightly' },
  { id: 'sensitive', label: 'Sensitive' },
  { id: 'very', label: 'Very sensitive' },
]

const COMMON_ALLERGENS = [
  'fragrance', 'parfum', 'linalool', 'limonene', 'lanolin',
  'coconut oil', 'essential oil', 'nickel', 'propylene glycol',
]

export default function Profile({ profile, setProfile, latest, goTo }) {
  const [allergyInput, setAllergyInput] = useState('')

  const set = (patch) => setProfile({ ...profile, ...patch })

  const toggle = (field, value) => {
    const list = profile[field] || []
    set({
      [field]: list.includes(value)
        ? list.filter((v) => v !== value)
        : [...list, value],
    })
  }

  const addAllergy = (raw) => {
    const value = raw.trim().toLowerCase()
    if (!value || profile.allergies.includes(value)) return
    set({ allergies: [...profile.allergies, value] })
    setAllergyInput('')
  }

  return (
    <div className="fade">
      <p className="eyebrow">Step two</p>
      <h1 className="display" style={{ marginTop: '0.5rem' }}>
        Tell us what<br />the camera <em>can't</em>.
      </h1>
      <p className="lede" style={{ marginTop: '1rem' }}>
        A photo sees the surface. It has no idea what stings, what you are
        allergic to, or what you are actually trying to fix.
      </p>

      <Rule>Skin type</Rule>
      {latest && (
        <p className="fine" style={{ marginTop: '-0.5rem', marginBottom: '0.875rem' }}>
          Your last scan suggested <strong>{latest.meta.skinType}</strong> based on
          where oil showed up. Overrule it if you disagree, you know your skin
          better than one photo does.
        </p>
      )}
      <div className="chips">
        {SKIN_TYPES.map((t) => (
          <button
            key={t.id}
            className="chip"
            aria-pressed={profile.skinType === t.id}
            onClick={() => set({ skinType: t.id })}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Rule>Sensitivity</Rule>
      <div className="chips">
        {SENSITIVITY.map((s) => (
          <button
            key={s.id}
            className="chip"
            aria-pressed={profile.sensitivity === s.id}
            onClick={() => set({ sensitivity: s.id })}
          >
            {s.label}
          </button>
        ))}
      </div>

      <Rule>What bothers you</Rule>
      <div className="chips">
        {CONCERNS.map((c) => (
          <button
            key={c.key}
            className="chip"
            aria-pressed={profile.concerns.includes(c.key)}
            onClick={() => toggle('concerns', c.key)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <Rule>What you want to fix first</Rule>
      <p className="fine" style={{ marginTop: '-0.5rem', marginBottom: '0.875rem' }}>
        Goals outrank anything the scan found. Pick one or two, not everything.
      </p>
      <div className="chips">
        {CONCERNS.map((c) => (
          <button
            key={c.key}
            className="chip"
            aria-pressed={profile.goals.includes(c.key)}
            onClick={() => toggle('goals', c.key)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <Rule>Allergies and hard nos</Rule>
      <p className="fine" style={{ marginTop: '-0.5rem', marginBottom: '0.875rem' }}>
        Anything listed here becomes an automatic red flag in the ingredient
        checker. Still read the label yourself.
      </p>
      <div className="chips" style={{ marginBottom: '0.875rem' }}>
        {COMMON_ALLERGENS.map((a) => (
          <button
            key={a}
            className="chip"
            aria-pressed={profile.allergies.includes(a)}
            onClick={() => toggle('allergies', a)}
          >
            {a}
          </button>
        ))}
      </div>
      <form
        onSubmit={(e) => { e.preventDefault(); addAllergy(allergyInput) }}
        style={{ display: 'flex', gap: '0.5rem' }}
      >
        <input
          className="input"
          placeholder="Add another ingredient"
          value={allergyInput}
          onChange={(e) => setAllergyInput(e.target.value)}
        />
        <button className="btn ghost slim" type="submit">Add</button>
      </form>
      {profile.allergies.length > 0 && (
        <p className="fine" style={{ marginTop: '0.75rem' }}>
          Avoiding: {profile.allergies.join(', ')}
        </p>
      )}

      <Rule>Preferences</Rule>
      <div className="stack-l">
        <div className="field">
          <label htmlFor="budget">Budget for a full routine</label>
          <div className="row">
            <input
              id="budget"
              type="range"
              min="25"
              max="200"
              step="5"
              value={profile.budget}
              onChange={(e) => set({ budget: Number(e.target.value) })}
              style={{ flex: 1, accentColor: 'var(--accent)' }}
            />
            <span className="num" style={{ minWidth: '3.5rem', textAlign: 'right' }}>
              ${profile.budget}
            </span>
          </div>
        </div>

        <div className="chips">
          <button
            className="chip"
            aria-pressed={profile.avoidFragrance}
            onClick={() => set({ avoidFragrance: !profile.avoidFragrance })}
          >
            Fragrance free only
          </button>
        </div>

        <div className="field">
          <label htmlFor="current">What you use now</label>
          <textarea
            id="current"
            className="textarea"
            placeholder="One product per line, or just paste whatever is on the shelf."
            value={profile.currentProducts}
            onChange={(e) => set({ currentProducts: e.target.value })}
          />
        </div>
      </div>

      <div className="stack" style={{ marginTop: '2rem' }}>
        <button
          className="btn"
          disabled={!profileComplete(profile)}
          onClick={() => goTo('routine')}
        >
          {profileComplete(profile) ? 'See my routine' : 'Pick a skin type and sensitivity'}
        </button>
      </div>

      <Disclaimer />
    </div>
  )
}
