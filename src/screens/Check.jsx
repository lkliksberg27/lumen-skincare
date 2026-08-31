import { useState } from 'react'
import { parseInci, checkProduct, lookupBarcode } from '../lib/ingredients.js'
import { Rule, Disclaimer } from '../components/Bits.jsx'

const SAMPLE = `Aqua, Glycerin, Niacinamide, Cetearyl Alcohol, Ceramide NP,
Hyaluronic Acid, Salicylic Acid, Parfum, Limonene, Linalool,
Phenoxyethanol, Tocopherol`

export default function Check({ profile, usingActives }) {
  const [text, setText] = useState('')
  const [barcode, setBarcode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [product, setProduct] = useState(null)
  const [result, setResult] = useState(null)

  function analyze(inciText, meta = null) {
    const inci = parseInci(inciText)
    if (inci.length < 2) {
      setError('That does not look like an ingredient list. Paste the full one, comma separated.')
      return
    }
    setError('')
    setProduct(meta)
    setResult({ ...checkProduct(inci, profile, usingActives), count: inci.length })
  }

  async function fromBarcode(e) {
    e.preventDefault()
    if (!barcode.trim()) return
    setBusy(true)
    setError('')
    setResult(null)
    try {
      const found = await lookupBarcode(barcode.trim())
      if (!found.ingredientsText) {
        setError(`Found "${found.name}" but Open Beauty Facts has no ingredient list for it yet. Paste the label instead.`)
        setProduct(found)
      } else {
        setText(found.ingredientsText)
        analyze(found.ingredientsText, found)
      }
    } catch (err) {
      setError(err.message || 'Lookup failed.')
    } finally {
      setBusy(false)
    }
  }

  const reset = () => { setResult(null); setProduct(null); setError('') }

  return (
    <div className="fade">
      <p className="eyebrow">Ingredient check</p>
      <h1 className="display" style={{ marginTop: '0.5rem' }}>
        Is this right<br />for <em>you</em>?
      </h1>
      <p className="lede" style={{ marginTop: '1rem' }}>
        Checked against your allergies, your sensitivity, and what is already in
        your routine. Every verdict below traces to a named rule, nothing is
        guessed.
      </p>

      <Rule>By barcode</Rule>
      <form onSubmit={fromBarcode} style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          className="input"
          placeholder="e.g. 3337875597357"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          inputMode="numeric"
        />
        <button className="btn ghost slim" type="submit" disabled={busy}>
          {busy ? <span className="spin" /> : 'Look up'}
        </button>
      </form>
      <p className="fine" style={{ marginTop: '0.625rem' }}>
        Free lookup against Open Beauty Facts, a crowdsourced open database.
        Coverage is patchy, so pasting the label is more reliable.
      </p>

      <Rule>Or paste the label</Rule>
      <textarea
        className="textarea"
        placeholder="Aqua, Glycerin, Niacinamide, ..."
        value={text}
        onChange={(e) => { setText(e.target.value); reset() }}
      />
      <div className="stack" style={{ marginTop: '0.75rem' }}>
        <button className="btn" onClick={() => analyze(text)} disabled={!text.trim()}>
          Check this product
        </button>
        {!text && (
          <button className="btn ghost" onClick={() => setText(SAMPLE)}>
            Use a sample list
          </button>
        )}
      </div>

      {error && <div className="note" style={{ marginTop: '1rem' }}>{error}</div>}

      {result && (
        <div className="fade">
          <Rule>Verdict</Rule>

          {product && (
            <p className="small" style={{ marginTop: '-0.5rem', marginBottom: '0.875rem' }}>
              {product.brand} {product.name}
            </p>
          )}

          <div className={`verdict ${result.verdict}`}>
            <div className="verdict-label">
              {result.verdict === 'good' && '● Good match'}
              {result.verdict === 'caution' && '● Be careful'}
              {result.verdict === 'avoid' && '● Not recommended'}
            </div>
            <p className="small" style={{ margin: 0, color: 'var(--ink)' }}>
              {result.verdict === 'good' &&
                'Nothing in this list conflicts with your profile or your current routine.'}
              {result.verdict === 'caution' &&
                'Usable, but introduce it slowly and read the notes below first.'}
              {result.verdict === 'avoid' &&
                'This clashes with something you told us. Details below.'}
            </p>
          </div>

          {result.actives.length > 0 && (
            <>
              <Rule>Actives found</Rule>
              <div className="chips">
                {result.actives.map((a) => (
                  <span key={a.key} className="chip" aria-pressed="true">{a.label}</span>
                ))}
              </div>
            </>
          )}

          {result.flags.length > 0 && (
            <>
              <Rule>Notes</Rule>
              {result.flags.map((f, i) => (
                <div className="flag" key={`${f.title}-${i}`}>
                  <div className="row" style={{ alignItems: 'baseline' }}>
                    <span className="flag-inci">{f.title}</span>
                    <span className={`delta ${f.level === 'avoid' ? 'down' : f.level === 'ok' ? 'up' : 'flat'}`}>
                      {f.level === 'avoid' ? 'avoid' : f.level === 'ok' ? 'fine' : 'caution'}
                    </span>
                  </div>
                  <p className="flag-note">{f.note}</p>
                </div>
              ))}
            </>
          )}

          <p className="fine" style={{ marginTop: '1.25rem' }}>
            Read from {result.count} ingredients.
            {usingActives.length > 0
              ? ' Cross-checked against the actives in your current routine.'
              : ' Build a routine first and this will also check for clashes with it.'}
          </p>

          <div className="note" style={{ marginTop: '1.25rem' }}>
            This checks the ingredients you gave it against what you told us.
            It cannot see concentration, formulation or pH, all of which change
            how an ingredient behaves. Check the physical label before you buy,
            and patch test anything new on your inner arm for a few days.
          </div>
        </div>
      )}

      <Disclaimer />
    </div>
  )
}
