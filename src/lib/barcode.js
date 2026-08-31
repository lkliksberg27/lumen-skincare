/* ============================================================
   Barcode scanning from the camera.

   Two paths, picked at runtime:

   1. The native BarcodeDetector API. Instant, nothing to
      download, but it is Chrome and Edge only. No Safari, no
      iOS, no Firefox.
   2. ZXing, lazy-imported only when the native API is missing.
      Keeping it out of the main bundle means iPhone users pay
      the download and nobody else does.

   Either way a code has to be read twice in a row before it
   counts. A single frame of a barcode at an angle reads wrong
   often enough to matter, and looking up the wrong product is
   worse than taking another half second.
   ============================================================ */

// Retail formats only. Narrowing the list makes both engines
// faster and cuts false reads from other symbologies.
const NATIVE_FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e']

const CONFIRMATIONS = 2

export function nativeAvailable() {
  return typeof window !== 'undefined' && 'BarcodeDetector' in window
}

export async function getCameraStream() {
  return navigator.mediaDevices.getUserMedia({
    video: {
      // Rear camera. A barcode is on the thing in your hand, not your face.
      facingMode: { ideal: 'environment' },
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
    audio: false,
  })
}

/**
 * @param {HTMLVideoElement} video
 * @param {(code: string) => void} onDetect  fires once, then scanning stops
 * @param {(msg: string) => void} onError
 * @returns {Promise<() => void>} stop function
 */
export async function startScanner(video, onDetect, onError) {
  let stopped = false
  let stream = null
  let controls = null
  let timer = null

  // Require the same value twice before trusting it.
  let last = null
  let streak = 0

  const consider = (raw) => {
    if (stopped || !raw) return
    const value = String(raw).trim()
    if (!/^\d{6,14}$/.test(value)) return

    if (value === last) streak += 1
    else { last = value; streak = 1 }

    if (streak >= CONFIRMATIONS) {
      stop()
      onDetect(value)
    }
  }

  function stop() {
    if (stopped) return
    stopped = true
    if (timer) { clearInterval(timer); timer = null }
    try { controls?.stop() } catch { /* already torn down */ }
    stream?.getTracks().forEach((t) => t.stop())
    stream = null
    if (video) video.srcObject = null
  }

  try {
    stream = await getCameraStream()
    if (stopped) { stream.getTracks().forEach((t) => t.stop()); return stop }

    video.srcObject = stream
    video.setAttribute('playsinline', 'true')
    await video.play().catch(() => {})

    if (nativeAvailable()) {
      let detector
      try {
        detector = new window.BarcodeDetector({ formats: NATIVE_FORMATS })
      } catch {
        detector = new window.BarcodeDetector()
      }

      let busy = false
      timer = setInterval(async () => {
        if (stopped || busy || video.readyState < 2) return
        busy = true
        try {
          const codes = await detector.detect(video)
          if (codes?.length) consider(codes[0].rawValue)
        } catch {
          // A transient decode failure is normal, keep going.
        } finally {
          busy = false
        }
      }, 220)
    } else {
      // Pulled in only on browsers without the native API.
      const [{ BrowserMultiFormatReader }, { DecodeHintType, BarcodeFormat }] =
        await Promise.all([import('@zxing/browser'), import('@zxing/library')])

      if (stopped) { stop(); return stop }

      const hints = new Map()
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
      ])

      const reader = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 200 })
      controls = await reader.decodeFromStream(stream, video, (result) => {
        if (result) consider(result.getText())
      })
    }
  } catch (err) {
    stop()
    const denied = err?.name === 'NotAllowedError' || err?.name === 'SecurityError'
    onError?.(
      denied
        ? 'Camera access was blocked. Allow it in your browser settings, or type the number in instead.'
        : 'Could not open the camera. You can type the number in instead.'
    )
  }

  return stop
}
