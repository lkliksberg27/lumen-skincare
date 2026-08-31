/* ============================================================
   Local persistence. No backend, no accounts.

   Scan metadata and the profile live in localStorage (small,
   synchronous, easy to read). Photos live in IndexedDB, because
   a handful of base64 selfies will blow the ~5MB localStorage
   quota almost immediately.
   ============================================================ */

const KEY_PROFILE = 'lumen.profile.v1'
const KEY_SCANS = 'lumen.scans.v1'

const DB_NAME = 'lumen'
const DB_STORE = 'photos'

/* ---------------- profile + scans ---------------- */

export const EMPTY_PROFILE = {
  skinType: '',
  sensitivity: '',
  concerns: [],
  goals: [],
  allergies: [],
  currentProducts: '',
  budget: 60,
  avoidFragrance: false,
  preference: 'drugstore',
}

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export const loadProfile = () => ({ ...EMPTY_PROFILE, ...read(KEY_PROFILE, {}) })
export const saveProfile = (p) => write(KEY_PROFILE, p)

export const loadScans = () => read(KEY_SCANS, [])

export function saveScan(scan) {
  const scans = loadScans()
  scans.unshift(scan)
  write(KEY_SCANS, scans.slice(0, 40))
  return scan
}

export function clearAll() {
  localStorage.removeItem(KEY_PROFILE)
  localStorage.removeItem(KEY_SCANS)
  indexedDB.deleteDatabase(DB_NAME)
}

/** True when the profile has enough filled in to build a routine. */
export const profileComplete = (p) => Boolean(p?.skinType && p?.sensitivity)

/* ---------------- photos ---------------- */

let dbPromise = null

function getDb() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1)
      req.onupgradeneeded = () => {
        const db = req.result
        if (!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE)
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  }
  return dbPromise
}

export async function savePhoto(id, blob) {
  try {
    const db = await getDb()
    await new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, 'readwrite')
      tx.objectStore(DB_STORE).put(blob, id)
      tx.oncomplete = resolve
      tx.onerror = () => reject(tx.error)
    })
    return true
  } catch {
    return false // a private window or blocked storage should not break the scan
  }
}

export async function loadPhoto(id) {
  try {
    const db = await getDb()
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, 'readonly')
      const req = tx.objectStore(DB_STORE).get(id)
      req.onsuccess = () => resolve(req.result || null)
      req.onerror = () => reject(req.error)
    })
  } catch {
    return null
  }
}

/* ---------------- formatting ---------------- */

export function formatDate(ts) {
  return new Date(ts).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function daysAgo(ts) {
  const days = Math.floor((Date.now() - ts) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days} days ago`
  const months = Math.floor(days / 30)
  return months === 1 ? '1 month ago' : `${months} months ago`
}
