import { useEffect, useRef, useState } from 'react'
import { analyzeFace, drawRegionOverlay, CONCERNS, lightingDrift } from '../lib/analyze.js'
import { savePhoto, saveScan, daysAgo } from '../lib/store.js'
import { Rule, Metric, Disclaimer } from '../components/Bits.jsx'

/** The five regions we sample, drawn rather than described. */
function RegionDiagram() {
  const boxes = [
    { x: 82, y: 60, w: 36, h: 30, label: 'forehead' },
    { x: 50, y: 135, w: 32, h: 32, label: 'left cheek' },
    { x: 118, y: 135, w: 32, h: 32, label: 'right cheek' },
    { x: 88, y: 118, w: 24, h: 26, label: 'nose' },
    { x: 85, y: 180, w: 30, h: 24, label: 'chin' },
  ]

  return (
    <figure style={{ margin: '2rem 0 0', textAlign: 'center' }}>
      <svg
        viewBox="0 0 200 260"
        width="180"
        role="img"
        aria-label="Diagram of a face with the five sampled regions marked"
        style={{ display: 'inline-block' }}
      >
        <ellipse
          cx="100" cy="130" rx="62" ry="85"
          fill="none" stroke="var(--line-2)" strokeWidth="1.25"
        />
        {boxes.map((b) => (
          <rect
            key={b.label}
            x={b.x} y={b.y} width={b.w} height={b.h}
            fill="var(--accent-soft)"
            stroke="var(--accent)"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        ))}
      </svg>
      <figcaption className="fine" style={{ marginTop: '0.5rem' }}>
        Five regions are measured. Eyes, brows and lips are left out because
        their colour would skew the readings.
      </figcaption>
    </figure>
  )
}

export default function Scan({ latest, onSaved, goTo }) {
  const [mode, setMode] = useState('idle') // idle | camera | working | done
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [drift, setDrift] = useState(null)

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const fileRef = useRef(null)

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  useEffect(() => stopCamera, [])

  // The result canvas does not exist until React has rendered the
  // results view, so the overlay has to be drawn after that commit
  // rather than straight after setMode('done').
  useEffect(() => {
    if (mode === 'done' && result && canvasRef.current) {
      // Region boxes are in the normalised canvas coordinate space,
      // not the original photo's.
      drawRegionOverlay(canvasRef.current, result.canvas, result.regions)
    }
  }, [mode, result])

  async function startCamera() {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: false,
      })
      streamRef.current = stream
      setMode('camera')
      // The video element only exists after the mode switch renders.
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(() => {})
        }
      })
    } catch {
      setError('Could not open the camera. You can upload a photo instead.')
      setMode('idle')
    }
  }

  async function run(source, blob) {
    setMode('working')
    setError('')
    try {
      const analysis = await analyzeFace(source)

      const scan = {
        id: `scan_${Date.now()}`,
        at: Date.now(),
        concerns: analysis.concerns,
        meta: analysis.meta,
      }

      if (blob) await savePhoto(scan.id, blob)

      setDrift(lightingDrift(analysis, latest))
      setResult({ ...analysis, scan })
      setMode('done')

      saveScan(scan)
      onSaved(scan)
    } catch (err) {
      setError(err.message || 'Something went wrong reading that photo.')
      setMode('idle')
    }
  }

  async function capture() {
    const video = videoRef.current
    if (!video) return

    const c = document.createElement('canvas')
    c.width = video.videoWidth
    c.height = video.videoHeight
    c.getContext('2d').drawImage(video, 0, 0)
    stopCamera()

    const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.9))
    await run(c, blob)
  }

  function onFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const img = new Image()
    img.onload = () => run(img, file)
    img.onerror = () => setError('Could not read that image file.')
    img.src = URL.createObjectURL(file)
  }

  /* ---------- results ---------- */

  if (mode === 'done' && result) {
    const ordered = CONCERNS
      .map((c) => ({ ...c, value: result.concerns[c.key] }))
      .sort((a, b) => b.value - a.value)

    return (
      <div className="fade">
        <p className="eyebrow">Scan complete</p>
        <h1 className="display" style={{ marginTop: '0.5rem' }}>
          Here is what<br />the photo <em>shows</em>.
        </h1>

        <div className="frame" style={{ marginTop: '1.5rem' }}>
          <canvas ref={canvasRef} />
        </div>
        <p className="fine" style={{ marginTop: '0.625rem' }}>
          Five regions sampled: forehead, both cheeks, nose and chin. Eyes, brows
          and lips are excluded because their colour would skew the readings.
        </p>

        {drift && <div className="note" style={{ marginTop: '1rem' }}>{drift}</div>}

        <Rule>Findings</Rule>
        {ordered.map((c) => (
          <Metric key={c.key} label={c.label} value={c.value} />
        ))}
        <p className="fine" style={{ marginTop: '0.875rem' }}>
          Treat these as an indication, not a grade. The measurements are real,
          but the scale that turns them into a number out of 100 has not been
          calibrated against dermatologist-scored faces. What is dependable is
          the change between two of your own scans, because both run through
          exactly the same pipeline.
        </p>

        <Rule>Reading</Rule>
        <div className="stack">
          <div className="row">
            <span className="small">Skin type suggested by oil distribution</span>
            <span className="num" style={{ textTransform: 'capitalize' }}>
              {result.meta.skinType}
            </span>
          </div>
          <div className="row">
            <span className="small">Image brightness</span>
            <span className="num">{result.meta.brightness}</span>
          </div>
          {!result.meta.lightingOk && (
            <div className="note">
              This photo is quite {result.meta.brightness < 38 ? 'dark' : 'bright'}.
              Even, indirect daylight gives the most reliable reading.
            </div>
          )}
          {!result.meta.framingOk && (
            <div className="note">
              Your face fills only {Math.round(result.meta.faceFill * 100)}% of the
              frame. Move closer so there are enough pixels per region for the
              texture readings to mean anything.
            </div>
          )}
        </div>

        <div className="stack" style={{ marginTop: '2rem' }}>
          <button className="btn" onClick={() => goTo('routine')}>
            Build my routine
          </button>
          <button
            className="btn ghost"
            onClick={() => { setResult(null); setMode('idle') }}
          >
            Scan again
          </button>
        </div>

        <Disclaimer />
      </div>
    )
  }

  /* ---------- camera ---------- */

  if (mode === 'camera') {
    return (
      <div className="fade">
        <p className="eyebrow">Position</p>
        <h1 className="display" style={{ marginTop: '0.5rem' }}>
          Face the light,<br />not the <em>window</em>.
        </h1>

        <div className="frame" style={{ marginTop: '1.5rem' }}>
          <video ref={videoRef} className="mirror" playsInline muted />
          <div className="frame-guide" />
        </div>

        <div className="stack" style={{ marginTop: '1.5rem' }}>
          <button className="btn" onClick={capture}>Capture</button>
          <button
            className="btn ghost"
            onClick={() => { stopCamera(); setMode('idle') }}
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  /* ---------- working ---------- */

  if (mode === 'working') {
    return (
      <div className="empty fade">
        <span className="spin" />
        <p className="lede" style={{ marginTop: '1rem' }}>
          Finding your face, then measuring five regions.
        </p>
        <p className="fine">The model loads once, so the first scan is the slow one.</p>
      </div>
    )
  }

  /* ---------- idle ---------- */

  return (
    <div className="fade">
      <p className="eyebrow">
        {latest ? `Last scan ${daysAgo(latest.at).toLowerCase()}` : 'Step one'}
      </p>
      <h1 className="display" style={{ marginTop: '0.5rem' }}>
        Let's take a<br />proper <em>look</em>.
      </h1>
      <p className="lede" style={{ marginTop: '1rem' }}>
        One photo, straight on, in even light. Everything is measured on this
        device and the picture never leaves it.
      </p>

      <RegionDiagram />

      {error && <div className="note" style={{ marginTop: '1rem' }}>{error}</div>}

      <div className="stack" style={{ marginTop: '1.5rem' }}>
        <button className="btn" onClick={startCamera}>Use camera</button>
        <button className="btn ghost" onClick={() => fileRef.current?.click()}>
          Upload a photo
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={onFile}
          className="sr"
        />
      </div>

      <Rule>For a reading you can compare</Rule>
      <ul className="small" style={{ paddingLeft: '1.1rem', margin: 0, lineHeight: 1.8 }}>
        <li>Bare skin, no makeup</li>
        <li>Even indirect daylight, not backlit</li>
        <li>Same spot and same time of day each scan</li>
        <li>Neutral expression, hair off the face</li>
      </ul>

      <Disclaimer />
    </div>
  )
}
