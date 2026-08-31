import { useEffect, useState, useMemo } from 'react'
import Scan from './screens/Scan.jsx'
import Profile from './screens/Profile.jsx'
import Routine from './screens/Routine.jsx'
import Progress from './screens/Progress.jsx'
import Check from './screens/Check.jsx'
import { loadProfile, saveProfile, loadScans, profileComplete } from './lib/store.js'
import { buildRoutine, activesInRoutine } from './lib/catalog.js'

const ICONS = {
  scan: (
    <>
      <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
      <circle cx="12" cy="12" r="3.4" />
    </>
  ),
  routine: (
    <>
      <path d="M12 3c3 3.6 4.8 6.2 4.8 8.6A4.8 4.8 0 0 1 12 16.4a4.8 4.8 0 0 1-4.8-4.8C7.2 9.2 9 6.6 12 3Z" />
      <path d="M6 20.5h12" />
    </>
  ),
  progress: (
    <>
      <path d="M3 20V4" />
      <path d="M3 17.5 9 12l4 3.5L21 7" />
      <path d="M21 11V7h-4" />
    </>
  ),
  check: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M7 9v6M10.5 9v6M14 9v6M17 9v6" />
    </>
  ),
}

const TABS = [
  { id: 'scan', label: 'Scan' },
  { id: 'routine', label: 'Routine' },
  { id: 'progress', label: 'Progress' },
  { id: 'check', label: 'Check' },
]

export default function App() {
  const [tab, setTab] = useState('scan')
  const [profile, setProfile] = useState(loadProfile)
  const [scans, setScans] = useState(loadScans)

  useEffect(() => { saveProfile(profile) }, [profile])

  const latest = scans[0] || null

  const routine = useMemo(() => {
    if (!profileComplete(profile)) return null
    return buildRoutine(profile, latest?.concerns || {}, profile.budget)
  }, [profile, latest])

  const usingActives = useMemo(() => activesInRoutine(routine), [routine])

  const onScanSaved = (scan) => {
    setScans((prev) => [scan, ...prev])
    // If the scan disagrees with a blank profile, seed the skin type.
    setProfile((p) => (p.skinType ? p : { ...p, skinType: scan.meta.skinType }))
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="wordmark">Lumen<span>.</span></div>
        <button
          className="btn ghost slim"
          onClick={() => setTab('profile')}
          aria-current={tab === 'profile'}
        >
          {profileComplete(profile) ? 'Profile' : 'Set up'}
        </button>
      </header>

      <main className="main" key={tab}>
        {tab === 'scan' && (
          <Scan latest={latest} onSaved={onScanSaved} goTo={setTab} profile={profile} />
        )}
        {tab === 'profile' && (
          <Profile profile={profile} setProfile={setProfile} latest={latest} goTo={setTab} />
        )}
        {tab === 'routine' && (
          <Routine routine={routine} profile={profile} latest={latest} goTo={setTab} />
        )}
        {tab === 'progress' && (
          <Progress scans={scans} goTo={setTab} />
        )}
        {tab === 'check' && (
          <Check profile={profile} usingActives={usingActives} />
        )}
      </main>

      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className="tab"
            aria-current={tab === t.id}
            onClick={() => setTab(t.id)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {ICONS[t.id]}
            </svg>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
