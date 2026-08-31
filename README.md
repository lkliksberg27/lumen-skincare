# Lumen

Skin scan, personalised routine, progress tracking, ingredient checker.
No backend, no accounts, no trained models. Everything runs in the browser.

**Live:** https://lumen-skincare-kappa.vercel.app
**Repo:** https://github.com/lkliksberg27/lumen-skincare (private)

```
npm install
npm run dev            # http://localhost:5180
node test-routine.mjs  # budget + conflict rule checks
```

Pushing to `main` deploys to production automatically.

The camera needs a secure context, so it works on the deployed HTTPS URL and
on `localhost`, but not over plain HTTP on a LAN address. Photo upload works
everywhere.

## The governing rule

**Anything that must be reproducible or must add up is code. Anything that
must sound human is a language model.**

That split is why the app is built the way it is. The scan produces numbers
that have to be identical across runs or progress tracking is meaningless. The
budget has to actually sum to less than the budget. Neither is a job for
generated text.

## How each step works

| Step | Approach | Where |
|---|---|---|
| 1. Skin scan | MediaPipe FaceLandmarker finds the face, then CIELAB pixel statistics over five regions | `src/lib/analyze.js` |
| 2. Skin profile | Plain form. The scan seeds skin type, the user can overrule it | `src/screens/Profile.jsx` |
| 3. Routine | Scored catalog match, then exhaustive knapsack against the budget | `src/lib/catalog.js` |
| 4. Tracking | Delta between two scans, with a 6 point noise floor | `src/lib/analyze.js` |
| 5. Products | Seed catalog with indicative prices | `src/lib/catalog.js` |
| Ingredient check | Hand-authored conflict rules over a parsed INCI list | `src/lib/ingredients.js` |

## The scan

Five regions are sampled: forehead, both cheeks, nose, chin. Eyes, brows and
lips are deliberately excluded, since their colour would wreck the redness
numbers.

Per region it measures mean L\*a\*b\*, specular fraction (bright desaturated
pixels, meaning light off sebum), micro-contrast via a Laplacian, and a
connected-component count of locally red blobs for blemishes.

Two normalisation steps matter:

- The image is downscaled to 1280px before detection. An 18 megapixel phone
  photo takes minutes through CPU inference and gains nothing.
- Every face is then rescaled so its width is always 480px. Without this a
  close-up and an arm's-length shot of identical skin would produce different
  roughness numbers, and tracking would be measuring camera distance.

### Calibration, honestly

The measurements are real. The ranges that convert them to 0-100 are reasoned,
not fitted, because fitting them needs face photos scored by a dermatologist.

- Comparing two of your own scans is sound. Same pipeline, deterministic,
  so the delta is real. Verified bit-identical across repeat runs.
- The absolute number is an indication, not a clinical grade.

To calibrate properly: roughly 100-200 face photos with dermatologist severity
scores, then fit each range to that distribution. Buying calibrated absolute
scores is what a hosted API actually sells.

## Swapping in a hosted skin API

`analyzeFace()` in `src/lib/analyze.js` is the only function that touches
pixels. Replace its body with a call to your provider and return the same
shape:

```js
{ concerns: { acne: 0-100, redness: 0-100, ... }, meta: {...}, regions: [...] }
```

Nothing else changes. Candidates, from the research pass:

- **DermIQ** free 10 scans then $0.05 each. 15+ metrics, self-serve key.
- **AILabTools** similar coverage, pricing not published.
- **Face++ SkinStatus** cheap and established, coarser.
- Perfect Corp, Haut.AI, Revieve are enterprise, quote only.

## Ingredient rules

`src/lib/ingredients.js` is deliberately rule-based. Every verdict traces to a
named rule, which matters when telling someone what to put on their face.

Conflicts are hand-authored from published formulation guidance, including the
exceptions: adapalene is stable next to benzoyl peroxide, and niacinamide with
vitamin C is reported as fine rather than repeating a myth.

Barcode lookup hits Open Beauty Facts, which is free and needs no key. Coverage
is patchy, so pasting the label is the reliable path.

Reference data worth wiring in next: the CosIng CSV (~30k INCI entries with EU
restriction annexes) and INCI API (2,000 free requests a month, returns
per-ingredient allergen and comedogenic ratings).

## Data

`localStorage` for the profile and scan metadata, IndexedDB for photos, since a
handful of base64 selfies blows the ~5MB localStorage quota. Photos never leave
the device.

## Known gaps

- Prices are indicative, not live. Wire up Amazon PA-API or Rainforest.
- Catalog is ~30 seed products. Kaggle has larger starting sets.
- No OCR yet on the ingredient label. Claude vision is the right tool: it reads
  the photo into a clean INCI array, then the existing rules engine decides.
- Severity scale is uncalibrated, see above.

## Scope

General wellness and cosmetic appearance only. No disease names, no treatment
claims, and it never flags moles or lesions. That boundary is deliberate:
lesion screening would make this a regulated medical device.
