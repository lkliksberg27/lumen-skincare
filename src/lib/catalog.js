/* ============================================================
   Seed catalog + routine builder.

   NOTE ON PRICES: these are indicative US drugstore prices used
   to demonstrate budget fitting. They drift constantly. A real
   build swaps `price` for a live feed (Amazon PA-API, Rainforest)
   or an affiliate catalog. Nothing else here changes.

   NOTE ON INGREDIENTS: each product records the canonical actives
   it is known for, not a full INCI list. Inventing a real
   product's full label would be worse than having none. Users
   check actual labels through the Check tab.
   ============================================================ */

export const SLOTS = {
  cleanser: 'Cleanser',
  treatment: 'Treatment',
  moisturizer: 'Moisturizer',
  spf: 'Sunscreen',
}

/**
 * tags:
 *   skin       - skin types it suits
 *   targets    - concern keys it addresses
 *   actives    - canonical keys from ingredients.js ACTIVES
 *   gentle     - safe bet for sensitive skin
 *   fragranceFree
 *   timing     - 'am' | 'pm' | 'any'
 */
export const CATALOG = [
  // ---------- cleansers ----------
  { id: 'cerave-hydrating', slot: 'cleanser', brand: 'CeraVe', name: 'Hydrating Facial Cleanser', price: 16,
    skin: ['dry', 'normal', 'combination'], targets: ['dryness'], actives: ['ceramides', 'hyaluronic'],
    gentle: true, fragranceFree: true, timing: 'any', keyIngredients: 'Ceramides, hyaluronic acid' },
  { id: 'cerave-foaming', slot: 'cleanser', brand: 'CeraVe', name: 'Foaming Facial Cleanser', price: 16,
    skin: ['oily', 'combination', 'normal'], targets: ['oiliness', 'pores'], actives: ['ceramides', 'niacinamide'],
    gentle: true, fragranceFree: true, timing: 'any', keyIngredients: 'Ceramides, niacinamide' },
  { id: 'vanicream-cleanser', slot: 'cleanser', brand: 'Vanicream', name: 'Gentle Facial Cleanser', price: 10,
    skin: ['dry', 'normal', 'combination', 'oily'], targets: ['irritation', 'redness'], actives: [],
    gentle: true, fragranceFree: true, timing: 'any', keyIngredients: 'No fragrance, dye or lanolin' },
  { id: 'lrp-toleriane-cleanser', slot: 'cleanser', brand: 'La Roche-Posay', name: 'Toleriane Purifying Foaming Cleanser', price: 17,
    skin: ['oily', 'combination', 'normal'], targets: ['oiliness', 'redness', 'irritation'], actives: ['niacinamide'],
    gentle: true, fragranceFree: true, timing: 'any', keyIngredients: 'Niacinamide, thermal spring water' },
  { id: 'ordinary-squalane-cleanser', slot: 'cleanser', brand: 'The Ordinary', name: 'Squalane Cleanser', price: 9,
    skin: ['dry', 'normal', 'sensitive'], targets: ['dryness'], actives: [],
    gentle: true, fragranceFree: true, timing: 'any', keyIngredients: 'Squalane' },
  { id: 'neutrogena-acne-wash', slot: 'cleanser', brand: 'Neutrogena', name: 'Oil-Free Acne Wash', price: 9,
    skin: ['oily', 'combination'], targets: ['acne', 'oiliness'], actives: ['bha'],
    gentle: false, fragranceFree: false, timing: 'any', keyIngredients: 'Salicylic acid 2%' },
  { id: 'cetaphil-gentle', slot: 'cleanser', brand: 'Cetaphil', name: 'Gentle Skin Cleanser', price: 13,
    skin: ['dry', 'normal', 'combination'], targets: ['irritation'], actives: [],
    gentle: true, fragranceFree: true, timing: 'any', keyIngredients: 'Glycerin, panthenol' },

  // ---------- treatments ----------
  { id: 'ordinary-niacinamide', slot: 'treatment', brand: 'The Ordinary', name: 'Niacinamide 10% + Zinc 1%', price: 6,
    skin: ['oily', 'combination', 'normal'], targets: ['oiliness', 'pores', 'unevenTone', 'acne'], actives: ['niacinamide'],
    gentle: true, fragranceFree: true, timing: 'am', keyIngredients: 'Niacinamide 10%, zinc PCA' },
  { id: 'ordinary-azelaic', slot: 'treatment', brand: 'The Ordinary', name: 'Azelaic Acid Suspension 10%', price: 11,
    skin: ['oily', 'combination', 'normal', 'dry'], targets: ['redness', 'acne', 'unevenTone'], actives: ['azelaic'],
    gentle: true, fragranceFree: true, timing: 'am', keyIngredients: 'Azelaic acid 10%' },
  { id: 'ordinary-retinoid', slot: 'treatment', brand: 'The Ordinary', name: 'Granactive Retinoid 2% in Squalane', price: 12,
    skin: ['normal', 'combination', 'oily', 'dry'], targets: ['acne', 'pores', 'unevenTone'], actives: ['retinoid'],
    gentle: false, fragranceFree: true, timing: 'pm', keyIngredients: 'Hydroxypinacolone retinoate' },
  { id: 'differin', slot: 'treatment', brand: 'Differin', name: 'Adapalene Gel 0.1%', price: 14,
    skin: ['oily', 'combination', 'normal'], targets: ['acne', 'pores'], actives: ['retinoid'],
    gentle: false, fragranceFree: true, timing: 'pm', keyIngredients: 'Adapalene 0.1%' },
  { id: 'paulas-bha', slot: 'treatment', brand: "Paula's Choice", name: 'Skin Perfecting 2% BHA Liquid', price: 35,
    skin: ['oily', 'combination', 'normal'], targets: ['pores', 'acne', 'unevenTone'], actives: ['bha'],
    gentle: false, fragranceFree: true, timing: 'pm', keyIngredients: 'Salicylic acid 2%' },
  { id: 'ordinary-ha', slot: 'treatment', brand: 'The Ordinary', name: 'Hyaluronic Acid 2% + B5', price: 9,
    skin: ['dry', 'normal', 'combination', 'oily'], targets: ['dryness'], actives: ['hyaluronic'],
    gentle: true, fragranceFree: true, timing: 'any', keyIngredients: 'Hyaluronic acid, panthenol' },
  { id: 'lrp-effaclar-duo', slot: 'treatment', brand: 'La Roche-Posay', name: 'Effaclar Duo Acne Treatment', price: 17,
    skin: ['oily', 'combination'], targets: ['acne', 'oiliness'], actives: ['benzoylPeroxide'],
    gentle: false, fragranceFree: true, timing: 'pm', keyIngredients: 'Benzoyl peroxide 5.5%' },
  { id: 'ordinary-vitc', slot: 'treatment', brand: 'The Ordinary', name: 'Ascorbyl Glucoside Solution 12%', price: 12,
    skin: ['normal', 'combination', 'dry', 'oily'], targets: ['unevenTone'], actives: ['vitaminC'],
    gentle: true, fragranceFree: true, timing: 'am', keyIngredients: 'Ascorbyl glucoside 12%' },
  { id: 'naturium-azelaic', slot: 'treatment', brand: 'Naturium', name: 'Azelaic Topical Acid 10%', price: 16,
    skin: ['normal', 'combination', 'oily', 'dry'], targets: ['redness', 'unevenTone', 'irritation'], actives: ['azelaic', 'niacinamide'],
    gentle: true, fragranceFree: true, timing: 'am', keyIngredients: 'Azelaic acid, niacinamide' },
  { id: 'inkey-succinic', slot: 'treatment', brand: 'The INKEY List', name: 'Succinic Acid Blemish Treatment', price: 10,
    skin: ['oily', 'combination', 'normal'], targets: ['acne'], actives: ['bha'],
    gentle: true, fragranceFree: true, timing: 'pm', keyIngredients: 'Succinic acid, salicylic acid, sulfur' },

  // ---------- moisturizers ----------
  { id: 'cerave-pm', slot: 'moisturizer', brand: 'CeraVe', name: 'PM Facial Moisturizing Lotion', price: 15,
    skin: ['normal', 'combination', 'oily'], targets: ['dryness', 'oiliness'], actives: ['ceramides', 'niacinamide', 'hyaluronic'],
    gentle: true, fragranceFree: true, timing: 'any', keyIngredients: 'Ceramides, niacinamide, hyaluronic acid' },
  { id: 'cerave-cream', slot: 'moisturizer', brand: 'CeraVe', name: 'Moisturizing Cream', price: 17,
    skin: ['dry', 'normal'], targets: ['dryness', 'irritation'], actives: ['ceramides', 'hyaluronic'],
    gentle: true, fragranceFree: true, timing: 'any', keyIngredients: 'Ceramides, hyaluronic acid' },
  { id: 'vanicream-moisturizer', slot: 'moisturizer', brand: 'Vanicream', name: 'Daily Facial Moisturizer', price: 13,
    skin: ['dry', 'normal', 'combination', 'oily'], targets: ['irritation', 'redness', 'dryness'], actives: ['ceramides', 'hyaluronic'],
    gentle: true, fragranceFree: true, timing: 'any', keyIngredients: 'Ceramides, hyaluronic acid, squalane' },
  { id: 'neutrogena-hydroboost', slot: 'moisturizer', brand: 'Neutrogena', name: 'Hydro Boost Water Gel', price: 20,
    skin: ['oily', 'combination', 'normal'], targets: ['dryness', 'oiliness'], actives: ['hyaluronic'],
    gentle: false, fragranceFree: false, timing: 'any', keyIngredients: 'Hyaluronic acid' },
  { id: 'lrp-double-repair', slot: 'moisturizer', brand: 'La Roche-Posay', name: 'Toleriane Double Repair Face Moisturizer', price: 20,
    skin: ['dry', 'normal', 'combination', 'oily'], targets: ['dryness', 'redness', 'irritation'], actives: ['ceramides', 'niacinamide'],
    gentle: true, fragranceFree: true, timing: 'any', keyIngredients: 'Ceramides, niacinamide, glycerin' },
  { id: 'ordinary-nmf', slot: 'moisturizer', brand: 'The Ordinary', name: 'Natural Moisturizing Factors + HA', price: 9,
    skin: ['normal', 'combination', 'oily', 'dry'], targets: ['dryness'], actives: ['hyaluronic'],
    gentle: true, fragranceFree: true, timing: 'any', keyIngredients: 'Amino acids, hyaluronic acid' },

  // ---------- sunscreens ----------
  { id: 'trader-joes-spf', slot: 'spf', brand: "Trader Joe's", name: 'Daily Facial Sunscreen SPF 40', price: 9,
    skin: ['normal', 'combination', 'oily', 'dry'], targets: [], actives: ['chemicalSpf', 'mineralSpf'],
    gentle: true, fragranceFree: true, timing: 'am', keyIngredients: 'Zinc oxide, chemical filters, SPF 40' },
  { id: 'neutrogena-ultrasheer', slot: 'spf', brand: 'Neutrogena', name: 'Ultra Sheer Dry-Touch SPF 55', price: 11,
    skin: ['oily', 'combination', 'normal'], targets: ['oiliness'], actives: ['chemicalSpf'],
    gentle: false, fragranceFree: false, timing: 'am', keyIngredients: 'Avobenzone, homosalate, SPF 55' },
  { id: 'cerave-mineral-spf', slot: 'spf', brand: 'CeraVe', name: 'Hydrating Mineral Sunscreen SPF 30', price: 16,
    skin: ['dry', 'normal', 'combination'], targets: ['dryness', 'irritation'], actives: ['mineralSpf', 'ceramides'],
    gentle: true, fragranceFree: true, timing: 'am', keyIngredients: 'Zinc oxide, titanium dioxide, ceramides' },
  { id: 'lrp-anthelios', slot: 'spf', brand: 'La Roche-Posay', name: 'Anthelios Melt-In Milk SPF 60', price: 25,
    skin: ['dry', 'normal', 'combination', 'oily'], targets: [], actives: ['chemicalSpf'],
    gentle: true, fragranceFree: false, timing: 'am', keyIngredients: 'Broad spectrum SPF 60' },
  { id: 'boj-relief-sun', slot: 'spf', brand: 'Beauty of Joseon', name: 'Relief Sun Rice + Probiotics SPF 50', price: 18,
    skin: ['dry', 'normal', 'combination', 'oily'], targets: ['dryness'], actives: ['chemicalSpf'],
    gentle: true, fragranceFree: false, timing: 'am', keyIngredients: 'Rice extract, niacinamide, SPF 50' },
  { id: 'vanicream-spf', slot: 'spf', brand: 'Vanicream', name: 'Facial Moisturizer SPF 30', price: 14,
    skin: ['dry', 'normal', 'combination'], targets: ['irritation', 'dryness'], actives: ['mineralSpf'],
    gentle: true, fragranceFree: true, timing: 'am', keyIngredients: 'Zinc oxide, SPF 30' },
]

/* ---------------- scoring ---------------- */

import { CONFLICTS, ACTIVES } from './ingredients.js'

const ACTIVE_LABEL = (key) => ACTIVES[key]?.label || key

function scoreProduct(product, ctx) {
  const { severities, profile } = ctx
  let score = 0

  // Match against what the scan actually found, weighted by severity.
  for (const target of product.targets) {
    score += (severities[target] || 0) / 10
  }

  // Goals the user picked themselves count for more than measured ones.
  for (const goal of profile.goals || []) {
    if (product.targets.includes(goal)) score += 6
  }

  // Skin type fit.
  if (product.skin.includes(profile.skinType)) score += 5
  else score -= 6

  // Sensitivity gates.
  const sensitive = profile.sensitivity === 'sensitive' || profile.sensitivity === 'very'
  if (sensitive) {
    if (product.gentle) score += 7
    else score -= 10
  }
  if (profile.sensitivity === 'very' && !product.gentle) score -= 12

  if (profile.avoidFragrance && !product.fragranceFree) score -= 25

  // A mild nudge toward cheaper picks so budget fitting has room.
  score -= product.price * 0.06

  return score
}

function conflictsWith(product, chosen) {
  const chosenActives = new Set(chosen.flatMap((p) => p.actives))
  for (const rule of CONFLICTS) {
    const has = product.actives.includes(rule.a) ? rule.a
      : product.actives.includes(rule.b) ? rule.b : null
    if (!has) continue
    const other = has === rule.a ? rule.b : rule.a
    if (chosenActives.has(other)) {
      // Adapalene is stable next to benzoyl peroxide.
      if (rule.exception && product.id === 'differin') continue
      return rule
    }
  }
  return null
}

/* ---------------- budget ---------------- */

/**
 * Multiple-choice knapsack over the slots.
 *
 * Solved by exhaustive search rather than greedy downgrade. The
 * option lists are sorted by score, not price, so a greedy walk
 * stalls the moment the next-best item happens to cost more, and
 * it reports "over budget" while a cheaper valid combination sits
 * further down the list.
 *
 * Five slots capped at eight options is at most 32,768 combinations,
 * which is nothing. The point of doing this in code rather than
 * asking a model is that the total always actually adds up.
 */
const SEARCH_WIDTH = 8

function fitBudget(slots, budget) {
  const lists = slots.map((s) => s.options.slice(0, SEARCH_WIDTH))
  const amIdx = slots.findIndex((s) => s.slot === 'treatment' && s.when === 'am')
  const pmIdx = slots.findIndex((s) => s.slot === 'treatment' && s.when === 'pm')

  const pick = new Array(lists.length).fill(0)
  let best = null

  const consider = () => {
    // Morning and night should not be the same bottle twice.
    if (amIdx >= 0 && pmIdx >= 0 && lists[amIdx][pick[amIdx]].id === lists[pmIdx][pick[pmIdx]].id) {
      return
    }

    const chosen = pick.map((idx, k) => lists[k][idx])
    // Cleanser and moisturizer are shared, so you buy them once.
    const unique = [...new Map(chosen.map((p) => [p.id, p])).values()]
    const cost = unique.reduce((s, p) => s + p.price, 0)
    const score = chosen.reduce((s, p) => s + p.score, 0)
    const fits = !budget || cost <= budget

    if (!best) { best = { pick: [...pick], cost, score, fits }; return }

    // A combination that fits always beats one that does not.
    if (fits !== best.fits) {
      if (fits) best = { pick: [...pick], cost, score, fits }
      return
    }
    // Within budget, maximise score. Over budget, minimise cost, so
    // we report the genuinely cheapest option we could find.
    const better = fits ? score > best.score : cost < best.cost
    if (better) best = { pick: [...pick], cost, score, fits }
  }

  const walk = (i) => {
    if (i === lists.length) return consider()
    for (let j = 0; j < lists[i].length; j++) {
      pick[i] = j
      walk(i + 1)
    }
  }
  walk(0)

  return {
    picks: slots.map((s, i) => ({ ...s, options: lists[i], index: best.pick[i] })),
    overBudget: !best.fits,
    total: best.cost,
  }
}

/* ---------------- the builder ---------------- */

/**
 * @param {object} profile   skin profile
 * @param {object} severities concern key -> 0-100 from the latest scan
 * @param {number} budget    optional dollar cap for the whole routine
 */
export function buildRoutine(profile, severities = {}, budget = 0) {
  const ctx = { severities, profile }

  const rank = (slot, timing) =>
    CATALOG
      .filter((p) => p.slot === slot)
      .filter((p) => !timing || p.timing === timing || p.timing === 'any')
      .map((p) => ({ ...p, score: scoreProduct(p, ctx) }))
      .sort((a, b) => b.score - a.score)

  const cleansers = rank('cleanser')
  const amTreat = rank('treatment', 'am')
  const pmTreat = rank('treatment', 'pm')
  const moisturizers = rank('moisturizer')
  const spfs = rank('spf')

  const slots = [
    { slot: 'cleanser', when: 'both', options: cleansers },
    { slot: 'treatment', when: 'am', options: amTreat },
    { slot: 'treatment', when: 'pm', options: pmTreat },
    { slot: 'moisturizer', when: 'both', options: moisturizers },
    { slot: 'spf', when: 'am', options: spfs },
  ].filter((s) => s.options.length > 0)

  const fitted = fitBudget(slots, budget)
  const chosen = fitted.picks.map((s) => ({ ...s, product: s.options[s.index] }))

  const get = (slot, when) =>
    chosen.find((c) => c.slot === slot && c.when === when)?.product

  const am = [
    { role: 'Cleanser', product: get('cleanser', 'both') },
    { role: 'Treatment', product: get('treatment', 'am') },
    { role: 'Moisturizer', product: get('moisturizer', 'both') },
    { role: 'Sunscreen', product: get('spf', 'am') },
  ].filter((s) => s.product)

  const pm = [
    { role: 'Cleanser', product: get('cleanser', 'both') },
    { role: 'Treatment', product: get('treatment', 'pm') },
    { role: 'Moisturizer', product: get('moisturizer', 'both') },
  ].filter((s) => s.product)

  // Unique products, since cleanser and moisturizer are shared.
  const unique = [...new Map(chosen.map((c) => [c.product.id, c.product])).values()]

  return {
    am,
    pm,
    products: unique,
    total: fitted.total,
    budget,
    overBudget: fitted.overBudget,
    notes: routineNotes(am, pm, severities),
  }
}

function routineNotes(am, pm, severities) {
  const notes = []
  const all = [...am, ...pm].map((s) => s.product)
  const actives = new Set(all.flatMap((p) => p.actives))

  // When a known conflicting pair ends up split across morning and
  // night, say so. That split is the reason it is safe.
  const amTreatment = am.find((s) => s.role === 'Treatment')?.product
  const pmTreatment = pm.find((s) => s.role === 'Treatment')?.product
  if (amTreatment && pmTreatment) {
    const rule = conflictsWith(amTreatment, [pmTreatment])
    if (rule) {
      notes.push(
        `${ACTIVE_LABEL(rule.a)} and ${ACTIVE_LABEL(rule.b)} are deliberately split across morning and night. Used in the same sitting they work against each other.`
      )
    }
  }

  if (actives.has('retinoid')) {
    notes.push(
      'Start the retinoid twice a week and build up. Going nightly straight away is the usual reason people quit.'
    )
  }
  if (actives.has('bha') || actives.has('aha')) {
    notes.push('Exfoliating acids go on clean, dry skin. Twice a week is plenty to start.')
  }
  if (actives.has('benzoylPeroxide')) {
    notes.push('Benzoyl peroxide bleaches fabric. Use a white towel and pillowcase.')
  }
  if ((severities.dryness || 0) > 55) {
    notes.push('Apply moisturizer while skin is still slightly damp. It holds noticeably more water that way.')
  }
  notes.push('Sunscreen every morning, even indoors near windows. It does more for tone and texture than any serum here.')

  return notes
}

/** Canonical actives currently in the routine, for the ingredient checker. */
export function activesInRoutine(routine) {
  if (!routine) return []
  return [...new Set(routine.products.flatMap((p) => p.actives))]
}
