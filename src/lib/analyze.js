/* ============================================================
   Local skin scan.

   Runs entirely in the browser: MediaPipe FaceLandmarker finds
   the face, then we sample five fixed regions and measure real
   pixel statistics in CIELAB.

   Everything here is deterministic. The same photo always
   produces the same numbers, which is the whole reason progress
   tracking means anything.

   ---- Swapping in a hosted API ----
   Replace analyzeFace() with a fetch to your provider (DermIQ,
   AILabTools, Face++) and return the same shape:
     { concerns: {key: 0-100}, meta: {...}, regions: [...] }
   Nothing else in the app touches pixels.
   ============================================================ */

import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision'

const WASM =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm'
const MODEL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'

// Concern keys, in the order we show them.
export const CONCERNS = [
  { key: 'acne', label: 'Acne' },
  { key: 'redness', label: 'Redness' },
  { key: 'dryness', label: 'Dryness' },
  { key: 'oiliness', label: 'Oiliness' },
  { key: 'unevenTone', label: 'Uneven tone' },
  { key: 'pores', label: 'Visible pores' },
  { key: 'irritation', label: 'Irritation' },
]

let detectorPromise = null

function getDetector() {
  if (!detectorPromise) {
    detectorPromise = (async () => {
      const fileset = await FilesetResolver.forVisionTasks(WASM)
      return FaceLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL, delegate: 'GPU' },
        runningMode: 'IMAGE',
        numFaces: 1,
      })
    })().catch((err) => {
      detectorPromise = null // let the next attempt retry
      throw err
    })
  }
  return detectorPromise
}

/* ---------------- colour maths ---------------- */

function srgbToLab(r, g, b) {
  const lin = (c) => {
    c /= 255
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  }
  const R = lin(r)
  const G = lin(g)
  const B = lin(b)

  let X = (R * 0.4124564 + G * 0.3575761 + B * 0.1804375) / 0.95047
  let Y = R * 0.2126729 + G * 0.7151522 + B * 0.072175
  let Z = (R * 0.0193339 + G * 0.119192 + B * 0.9503041) / 1.08883

  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116)
  const fx = f(X)
  const fy = f(Y)
  const fz = f(Z)

  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)]
}

function saturation(r, g, b) {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  return max === 0 ? 0 : (max - min) / max
}

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)

/** Map a raw measurement onto 0-100 severity. */
const norm = (v, lo, hi) => Math.round(clamp01((v - lo) / (hi - lo)) * 100)

function mean(a) {
  if (!a.length) return 0
  let s = 0
  for (const v of a) s += v
  return s / a.length
}

function stdev(a) {
  if (a.length < 2) return 0
  const m = mean(a)
  let s = 0
  for (const v of a) s += (v - m) * (v - m)
  return Math.sqrt(s / a.length)
}

/* ---------------- region sampling ---------------- */

// Landmark indices on the MediaPipe 478-point mesh.
const LM = {
  foreheadTop: 10,
  noseTip: 4,
  chin: 152,
  leftEdge: 234,
  rightEdge: 454,
  leftEye: 33,
  rightEye: 263,
}

// Each region is normalised to this resolution before measuring, so
// results do not depend on how many megapixels the camera has.
const PATCH = 96

// Longest edge used for face detection. Anything larger is wasted work.
const MAX_DIM = 1280

// Every face is rescaled to this width before measurement, so two
// scans taken at different distances stay comparable.
const TARGET_FACE_W = 480

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v)

/**
 * Region centres derived from landmarks rather than raw mesh polygons.
 * Small boxes in safe zones keep eyes, brows, lips and nostrils out of
 * the sample, which would otherwise wreck the redness numbers.
 */
function buildRegions(pts, w, h) {
  const px = (i) => ({ x: pts[i].x * w, y: pts[i].y * h })

  const top = px(LM.foreheadTop)
  const nose = px(LM.noseTip)
  const chin = px(LM.chin)
  const left = px(LM.leftEdge)
  const right = px(LM.rightEdge)
  const eyeY = (px(LM.leftEye).y + px(LM.rightEye).y) / 2

  const faceW = Math.hypot(right.x - left.x, right.y - left.y)
  const r = faceW * 0.105

  const lerp = (a, b, t) => a + (b - a) * t

  return [
    {
      name: 'forehead',
      zone: 'tzone',
      x: top.x,
      y: lerp(top.y, eyeY, 0.45),
      r,
    },
    {
      name: 'left cheek',
      zone: 'cheek',
      x: lerp(left.x, nose.x, 0.42),
      y: lerp(eyeY, chin.y, 0.34),
      r,
    },
    {
      name: 'right cheek',
      zone: 'cheek',
      x: lerp(right.x, nose.x, 0.42),
      y: lerp(eyeY, chin.y, 0.34),
      r,
    },
    {
      name: 'nose',
      zone: 'tzone',
      x: nose.x,
      y: lerp(nose.y, eyeY, 0.28),
      r: r * 0.72,
    },
    {
      name: 'chin',
      zone: 'cheek',
      x: chin.x,
      y: lerp(chin.y, nose.y, 0.22),
      r: r * 0.78,
    },
  ]
}

/** Pull one region into a fixed-size patch and measure it. */
function measureRegion(source, region) {
  const c = document.createElement('canvas')
  c.width = c.height = PATCH
  const ctx = c.getContext('2d', { willReadFrequently: true })

  const size = region.r * 2
  ctx.drawImage(
    source,
    region.x - region.r,
    region.y - region.r,
    size,
    size,
    0,
    0,
    PATCH,
    PATCH
  )

  const { data } = ctx.getImageData(0, 0, PATCH, PATCH)

  const L = new Float32Array(PATCH * PATCH)
  const A = new Float32Array(PATCH * PATCH)
  const B = new Float32Array(PATCH * PATCH)
  let specular = 0

  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const [l, a, bb] = srgbToLab(r, g, b)
    L[p] = l
    A[p] = a
    B[p] = bb
    // A bright, desaturated pixel is light bouncing off sebum.
    if (l > 78 && saturation(r, g, b) < 0.22) specular++
  }

  const meanL = mean(L)
  const meanA = mean(A)
  const meanB = mean(B)

  // Micro-contrast: how much a pixel differs from its neighbours.
  // Flaky, rough skin scores high; smooth skin scores low.
  let micro = 0
  let microN = 0
  for (let y = 1; y < PATCH - 1; y++) {
    for (let x = 1; x < PATCH - 1; x++) {
      const p = y * PATCH + x
      const lap =
        4 * L[p] - L[p - 1] - L[p + 1] - L[p - PATCH] - L[p + PATCH]
      micro += Math.abs(lap)
      microN++
    }
  }
  micro /= microN

  // Blemishes: locally red spots that form compact blobs.
  // The minimum area matters more than it looks. At 6px, sensor noise
  // and film grain register as hundreds of blemishes.
  const aStd = stdev(A)
  const thresh = meanA + Math.max(1.9 * aStd, 2.0)
  const mask = new Uint8Array(PATCH * PATCH)
  for (let p = 0; p < mask.length; p++) mask[p] = A[p] > thresh ? 1 : 0

  const blobs = countBlobs(mask, PATCH, PATCH, 12, 500)

  return {
    ...region,
    meanL,
    meanA,
    meanB,
    lStd: stdev(L),
    aStd,
    micro,
    specular: specular / (PATCH * PATCH),
    blobs,
  }
}

/** 4-connected flood fill, counting components inside a size window. */
function countBlobs(mask, w, h, minArea, maxArea) {
  const seen = new Uint8Array(mask.length)
  const stack = []
  let found = 0

  for (let start = 0; start < mask.length; start++) {
    if (!mask[start] || seen[start]) continue

    let area = 0
    stack.length = 0
    stack.push(start)
    seen[start] = 1

    while (stack.length) {
      const p = stack.pop()
      area++
      const x = p % w
      const y = (p / w) | 0
      if (x > 0 && mask[p - 1] && !seen[p - 1]) { seen[p - 1] = 1; stack.push(p - 1) }
      if (x < w - 1 && mask[p + 1] && !seen[p + 1]) { seen[p + 1] = 1; stack.push(p + 1) }
      if (y > 0 && mask[p - w] && !seen[p - w]) { seen[p - w] = 1; stack.push(p - w) }
      if (y < h - 1 && mask[p + w] && !seen[p + w]) { seen[p + w] = 1; stack.push(p + w) }
    }

    if (area >= minArea && area <= maxArea) found++
  }
  return found
}

/* ---------------- the scan ---------------- */

/**
 * @param {HTMLImageElement|HTMLCanvasElement|HTMLVideoElement} source
 * @returns {Promise<{concerns:Object, meta:Object, regions:Array}>}
 */
export async function analyzeFace(source) {
  const detector = await getDetector()

  const w = source.naturalWidth || source.videoWidth || source.width
  const h = source.naturalHeight || source.videoHeight || source.height

  // Pass 1: detect on a downscaled copy. An 18-megapixel phone photo
  // takes minutes through CPU inference and gains nothing.
  const shrink = Math.min(1, MAX_DIM / Math.max(w, h))
  const dw = Math.round(w * shrink)
  const dh = Math.round(h * shrink)

  const flat = document.createElement('canvas')
  flat.width = dw
  flat.height = dh
  flat.getContext('2d').drawImage(source, 0, 0, dw, dh)

  const result = detector.detect(flat)
  const pts = result.faceLandmarks?.[0]
  if (!pts) {
    throw new Error(
      'No face found. Try facing the camera straight on in even light.'
    )
  }

  // Pass 2: redraw so the face is always the same width on screen.
  //
  // This matters more than it looks. Micro-texture is measured by
  // resampling each region down to a fixed patch, so a close-up and
  // an arm's-length shot of identical skin would otherwise average
  // differently and produce different roughness numbers. Holding face
  // width constant is what makes two scans weeks apart comparable.
  const faceWidthPx = Math.hypot(
    (pts[LM.rightEdge].x - pts[LM.leftEdge].x) * dw,
    (pts[LM.rightEdge].y - pts[LM.leftEdge].y) * dh
  )
  const k = clamp(TARGET_FACE_W / faceWidthPx, 0.15, 3)

  const work = document.createElement('canvas')
  work.width = Math.round(dw * k)
  work.height = Math.round(dh * k)
  const nctx = work.getContext('2d')
  nctx.imageSmoothingQuality = 'high'
  nctx.drawImage(flat, 0, 0, work.width, work.height)

  const regions = buildRegions(pts, work.width, work.height)
    .map((r) => measureRegion(work, r))

  const tzone = regions.filter((r) => r.zone === 'tzone')
  const cheeks = regions.filter((r) => r.zone === 'cheek')

  const tzoneOil = mean(tzone.map((r) => r.specular))
  const cheekOil = mean(cheeks.map((r) => r.specular))
  const allMicro = mean(regions.map((r) => r.micro))
  const cheekMicro = mean(cheeks.map((r) => r.micro))
  const faceA = mean(regions.map((r) => r.meanA))
  const totalBlobs = regions.reduce((s, r) => s + r.blobs, 0)

  // Tone evenness: spread of lightness and warmth across regions,
  // plus the average patchiness within each one.
  const acrossL = stdev(regions.map((r) => r.meanL))
  const acrossB = stdev(regions.map((r) => r.meanB))
  const withinL = mean(regions.map((r) => r.lStd))

  // Dry skin reads as rough but matte. Oily skin is also rough but
  // shines, so damp the texture signal by how much light it throws
  // back. Never damp it all the way to zero: a shiny T-zone does not
  // prove the cheeks are not flaking.
  const matte = 0.35 + 0.65 * (1 - clamp01(cheekOil / 0.14))

  /* ------------------------------------------------------------------
     CALIBRATION, honestly stated.

     The measurements above are real. The ranges below, which turn them
     into 0-100, are reasoned rather than fitted, because fitting them
     needs a labelled set of faces scored by a dermatologist. They were
     widened after test photos pinned three concerns at 100.

     What this means in practice:
       - Comparing two of YOUR scans is sound. Same pipeline, same
         normalisation, deterministic, so the delta is real.
       - The absolute number is an indication, not a clinical grade.
         Do not present it as one.

     To calibrate properly you need roughly 100-200 face photos with
     dermatologist severity scores, then fit each range to that
     distribution. Buying calibrated absolute scores instead is what a
     hosted API is actually selling. See the header of this file.
     ------------------------------------------------------------------ */
  const concerns = {
    acne: norm(totalBlobs, 2, 45),
    redness: norm(faceA, 9.5, 24),
    dryness: norm(cheekMicro * matte, 1.1, 6.0),
    oiliness: norm(tzoneOil, 0.01, 0.42),
    unevenTone: norm(acrossL * 0.6 + acrossB * 0.5 + withinL * 0.35, 2.2, 12),
    pores: norm(allMicro, 1.4, 7.5),
    irritation: norm(
      mean(regions.map((r) => r.aStd)) * 0.7 + Math.max(0, faceA - 12) * 0.9,
      2.0,
      11
    ),
  }

  // Skin type falls out of where the oil actually is.
  let skinType
  if (tzoneOil > 0.10 && cheekOil > 0.08) skinType = 'oily'
  else if (tzoneOil > 0.06 && cheekOil <= 0.08) skinType = 'combination'
  else if (concerns.dryness > 55) skinType = 'dry'
  else skinType = 'normal'

  const brightness = mean(regions.map((r) => r.meanL))
  const warmth = mean(regions.map((r) => r.meanB))

  // How much of the frame the face fills. Too small and there are not
  // enough pixels per region for texture to mean anything.
  const faceFill = faceWidthPx / dw

  return {
    concerns,
    regions,
    canvas: work,
    meta: {
      skinType,
      brightness: Math.round(brightness),
      warmth: Math.round(warmth * 10) / 10,
      faceFill: Math.round(faceFill * 100) / 100,
      // Lighting is the single biggest confound when comparing two
      // scans. We keep these so the app can warn about it honestly.
      lightingOk: brightness > 38 && brightness < 88,
      framingOk: faceFill > 0.22,
    },
  }
}

/**
 * Compare two scans. Positive delta means the concern got worse,
 * because every concern is scored as severity.
 */
export function compareScans(current, previous) {
  if (!previous) return null
  return CONCERNS.map(({ key, label }) => {
    const now = current.concerns[key]
    const before = previous.concerns[key]
    const delta = now - before
    return {
      key,
      label,
      now,
      before,
      delta,
      // Below 6 points is inside the noise floor for photo lighting.
      direction: delta <= -6 ? 'improving' : delta >= 6 ? 'worsening' : 'steady',
    }
  })
}

/** Warn when two scans were shot in very different light. */
export function lightingDrift(current, previous) {
  if (!previous?.meta) return null
  const dB = Math.abs(current.meta.brightness - previous.meta.brightness)
  const dW = Math.abs(current.meta.warmth - previous.meta.warmth)
  if (dB > 14 || dW > 4) {
    return 'Lighting looks quite different from your last scan, so small changes here are not reliable. Try to shoot in the same spot at the same time of day.'
  }
  return null
}

export function drawRegionOverlay(canvas, source, regions) {
  const w = source.naturalWidth || source.width
  const h = source.naturalHeight || source.height
  canvas.width = w
  canvas.height = h

  const ctx = canvas.getContext('2d')
  ctx.drawImage(source, 0, 0, w, h)
  ctx.strokeStyle = 'rgba(255,255,255,0.85)'
  ctx.lineWidth = Math.max(1.5, w / 400)
  ctx.setLineDash([w / 90, w / 90])

  for (const r of regions) {
    ctx.strokeRect(r.x - r.r, r.y - r.r, r.r * 2, r.r * 2)
  }
}
