/* ============================================================
   Ingredient intelligence.

   Deliberately rule-based, not generated. Every verdict this
   file produces can be traced to a named rule, which matters
   when you are telling someone what to put on their face.

   Sources for the reference data:
     - INCI naming + EU allergen list: CosIng (EC 1223/2009 annexes)
     - Product -> ingredient lookup: Open Beauty Facts
   Both are free. See catalog.js for the live lookup helper.
   ============================================================ */

/* ---------------- active recognition ---------------- */

// Canonical actives and the INCI names they hide behind.
export const ACTIVES = {
  retinoid: {
    label: 'Retinoid',
    aliases: [
      'retinol', 'retinal', 'retinaldehyde', 'retinyl palmitate',
      'retinyl propionate', 'tretinoin', 'adapalene',
      'hydroxypinacolone retinoate', 'retinyl retinoate',
    ],
    role: 'treatment',
  },
  benzoylPeroxide: {
    label: 'Benzoyl peroxide',
    aliases: ['benzoyl peroxide'],
    role: 'treatment',
  },
  vitaminC: {
    label: 'Vitamin C',
    aliases: [
      'ascorbic acid', 'l-ascorbic acid', 'sodium ascorbyl phosphate',
      'magnesium ascorbyl phosphate', '3-o-ethyl ascorbic acid',
      'ethyl ascorbic acid', 'ascorbyl glucoside',
      'tetrahexyldecyl ascorbate',
    ],
    role: 'treatment',
  },
  aha: {
    label: 'AHA',
    aliases: [
      'glycolic acid', 'lactic acid', 'mandelic acid', 'malic acid',
      'tartaric acid',
    ],
    role: 'treatment',
  },
  bha: {
    label: 'BHA',
    aliases: ['salicylic acid', 'betaine salicylate'],
    role: 'treatment',
  },
  pha: {
    label: 'PHA',
    aliases: ['gluconolactone', 'lactobionic acid', 'galactose'],
    role: 'treatment',
  },
  niacinamide: {
    label: 'Niacinamide',
    aliases: ['niacinamide', 'nicotinamide'],
    role: 'treatment',
  },
  azelaic: {
    label: 'Azelaic acid',
    aliases: ['azelaic acid', 'potassium azeloyl diglycinate'],
    role: 'treatment',
  },
  hydroquinone: {
    label: 'Hydroquinone',
    aliases: ['hydroquinone'],
    role: 'treatment',
  },
  hyaluronic: {
    label: 'Hyaluronic acid',
    aliases: ['hyaluronic acid', 'sodium hyaluronate', 'hydrolyzed hyaluronic acid'],
    role: 'hydrator',
  },
  ceramides: {
    label: 'Ceramides',
    aliases: ['ceramide np', 'ceramide ap', 'ceramide eop', 'ceramide ng', 'ceramide'],
    role: 'barrier',
  },
  peptides: {
    label: 'Peptides',
    aliases: ['palmitoyl tripeptide', 'palmitoyl pentapeptide', 'acetyl hexapeptide', 'copper tripeptide'],
    role: 'treatment',
  },
  mineralSpf: {
    label: 'Mineral sunscreen',
    aliases: ['zinc oxide', 'titanium dioxide'],
    role: 'spf',
  },
  chemicalSpf: {
    label: 'Chemical sunscreen',
    aliases: [
      'avobenzone', 'octinoxate', 'ethylhexyl methoxycinnamate',
      'octocrylene', 'homosalate', 'oxybenzone', 'benzophenone-3',
      'uvinul', 'tinosorb', 'bis-ethylhexyloxyphenol methoxyphenyl triazine',
    ],
    role: 'spf',
  },
}

// Ingredients that earn a flag on their own, given the right profile.
const IRRITANTS = {
  fragrance: {
    label: 'Fragrance',
    aliases: ['fragrance', 'parfum', 'aroma'],
    note: 'A common trigger for reactive skin, and the label never says what is in it.',
  },
  dryingAlcohol: {
    label: 'Drying alcohol',
    aliases: ['alcohol denat', 'sd alcohol', 'denatured alcohol', 'isopropyl alcohol'],
    note: 'Gives a fast matte finish but can strip the barrier over time.',
  },
  sulfates: {
    label: 'Sulfates',
    aliases: ['sodium lauryl sulfate', 'sodium laureth sulfate', 'ammonium lauryl sulfate'],
    note: 'A strong cleansing agent that often overshoots on dry or sensitive skin.',
  },
  essentialOils: {
    label: 'Essential oils',
    aliases: [
      'limonene', 'linalool', 'citral', 'eugenol', 'geraniol', 'citronellol',
      'lavandula angustifolia oil', 'mentha piperita oil', 'citrus limon peel oil',
      'melaleuca alternifolia', 'eucalyptus globulus',
    ],
    note: 'These are on the EU list of declarable fragrance allergens.',
  },
  comedogenic: {
    label: 'Pore-clogging oils',
    aliases: [
      'cocos nucifera oil', 'coconut oil', 'isopropyl myristate',
      'isopropyl palmitate', 'lanolin', 'algae extract', 'wheat germ oil',
      'myristyl myristate',
    ],
    note: 'Rated highly comedogenic, so worth watching if you break out easily.',
  },
}

/* ---------------- conflict rules ---------------- */

/**
 * Hand-authored from published formulation guidance. Each rule names
 * the two actives, a severity, and a plain reason the app can show.
 * severity: 'avoid' (do not layer) | 'caution' (separate or ease in)
 */
export const CONFLICTS = [
  {
    a: 'retinoid', b: 'benzoylPeroxide', severity: 'avoid',
    reason:
      'Benzoyl peroxide oxidises retinol and breaks it down, so layering them wastes both. Use them on alternating nights.',
    exception: 'adapalene',
    exceptionNote:
      'Adapalene is the one retinoid that is stable next to benzoyl peroxide, so this pair is fine.',
  },
  {
    a: 'vitaminC', b: 'benzoylPeroxide', severity: 'avoid',
    reason:
      'Benzoyl peroxide oxidises ascorbic acid before it can do anything. The vitamin C turns orange and stops working.',
  },
  {
    a: 'retinoid', b: 'vitaminC', severity: 'caution',
    reason:
      'These want different pH levels and stack up irritation when layered. Vitamin C in the morning, retinoid at night.',
  },
  {
    a: 'retinoid', b: 'aha', severity: 'caution',
    reason:
      'Two resurfacing actives at once is the fastest route to a stripped barrier. Alternate nights.',
  },
  {
    a: 'retinoid', b: 'bha', severity: 'caution',
    reason:
      'Both increase cell turnover. Together they often cause peeling and stinging. Alternate nights.',
  },
  {
    a: 'aha', b: 'bha', severity: 'caution',
    reason:
      'Doubling up on exfoliating acids rarely works better and usually irritates. Pick one.',
  },
  {
    a: 'aha', b: 'vitaminC', severity: 'caution',
    reason:
      'Both are low pH. Stacked, they can sting and leave skin reactive, especially on sensitive skin.',
  },
  {
    a: 'hydroquinone', b: 'benzoylPeroxide', severity: 'caution',
    reason:
      'Used together these can temporarily stain skin a darker shade. Keep them in separate routines.',
  },
  {
    a: 'aha', b: 'pha', severity: 'caution',
    reason: 'Layering exfoliating acids compounds the irritation without extra benefit.',
  },
]

// Pairings people are warned about online that are actually fine.
// Saying so is more useful than staying quiet.
export const MYTHS = [
  {
    a: 'niacinamide', b: 'vitaminC',
    note:
      'Often called a conflict, but at the concentrations and pH used in finished products they are fine together. The flushing story comes from raw-ingredient lab conditions.',
  },
  {
    a: 'niacinamide', b: 'retinoid',
    note:
      'These pair well. Niacinamide supports the barrier and tends to reduce retinoid irritation.',
  },
]

/* ---------------- parsing ---------------- */

/** Turn a messy label paste into a clean, lowercased INCI array. */
export function parseInci(text) {
  if (!text) return []
  return text
    .replace(/\bingredients?\b\s*:?/gi, ' ')
    .replace(/\bmay contain\b[\s\S]*$/i, ' ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[*†‡•]/g, ' ')
    .split(/[,;\n\r]+/)
    .map((s) => s.replace(/\s+/g, ' ').trim().toLowerCase())
    .filter((s) => s.length > 1 && s.length < 80)
}

function hits(list, aliases) {
  const found = []
  for (const alias of aliases) {
    const match = list.find((i) => i.includes(alias))
    if (match) found.push(match)
  }
  return found
}

/** Which canonical actives are present in this ingredient list. */
export function detectActives(inci) {
  const found = {}
  for (const [key, def] of Object.entries(ACTIVES)) {
    const matched = hits(inci, def.aliases)
    if (matched.length) found[key] = { ...def, matched }
  }
  return found
}

function detectIrritants(inci) {
  const found = {}
  for (const [key, def] of Object.entries(IRRITANTS)) {
    const matched = hits(inci, def.aliases)
    if (matched.length) found[key] = { ...def, matched }
  }
  return found
}

/* ---------------- the verdict ---------------- */

/**
 * @param {string[]} inci      parsed ingredient list of the product being checked
 * @param {object}   profile   the user's skin profile
 * @param {string[]} usingKeys canonical actives already in their routine
 * @returns {{verdict:'good'|'caution'|'avoid', headline:string, flags:Array, actives:Array}}
 */
export function checkProduct(inci, profile = {}, usingKeys = []) {
  const flags = []
  const actives = detectActives(inci)
  const irritants = detectIrritants(inci)

  // 1. Declared allergies always win. This is the one hard stop.
  const allergies = (profile.allergies || [])
    .map((a) => a.trim().toLowerCase())
    .filter(Boolean)

  for (const allergy of allergies) {
    const match = inci.find((i) => i.includes(allergy) || allergy.includes(i))
    if (match) {
      flags.push({
        level: 'avoid',
        title: `Contains ${match}`,
        note: `You listed "${allergy}" as an allergy. Do not use this product.`,
      })
    }
  }

  // 2. Conflicts against what they already use.
  const usingSet = new Set(usingKeys)
  for (const rule of CONFLICTS) {
    const inProduct = actives[rule.a] ? rule.a : actives[rule.b] ? rule.b : null
    if (!inProduct) continue
    const other = inProduct === rule.a ? rule.b : rule.a
    if (!usingSet.has(other)) continue

    // Adapalene is the documented exception to the BP rule.
    if (rule.exception && actives[inProduct]?.matched.some((m) => m.includes(rule.exception))) {
      flags.push({
        level: 'ok',
        title: `${ACTIVES[rule.a].label} with ${ACTIVES[rule.b].label}`,
        note: rule.exceptionNote,
      })
      continue
    }

    flags.push({
      level: rule.severity,
      title: `${ACTIVES[inProduct].label} clashes with the ${ACTIVES[other].label} you already use`,
      note: rule.reason,
    })
  }

  // 3. Internal conflicts inside this single product.
  const presentKeys = Object.keys(actives)
  for (const rule of CONFLICTS) {
    if (presentKeys.includes(rule.a) && presentKeys.includes(rule.b)) {
      if (rule.exception && actives[rule.a]?.matched.some((m) => m.includes(rule.exception))) continue
      flags.push({
        level: 'caution',
        title: `This product contains both ${ACTIVES[rule.a].label} and ${ACTIVES[rule.b].label}`,
        note: rule.reason,
      })
    }
  }

  // 4. Profile-driven irritant flags.
  const sensitive = profile.sensitivity === 'sensitive' || profile.sensitivity === 'very'
  const acneProne = (profile.concerns || []).includes('acne') || profile.skinType === 'oily'
  const dry = profile.skinType === 'dry'

  if (irritants.fragrance && sensitive) {
    flags.push({ level: 'caution', title: 'Contains fragrance', note: irritants.fragrance.note })
  }
  if (irritants.essentialOils && sensitive) {
    flags.push({ level: 'caution', title: 'Contains fragrance allergens', note: irritants.essentialOils.note })
  }
  if (irritants.dryingAlcohol && (sensitive || dry)) {
    flags.push({ level: 'caution', title: 'Contains drying alcohol', note: irritants.dryingAlcohol.note })
  }
  if (irritants.sulfates && (sensitive || dry)) {
    flags.push({ level: 'caution', title: 'Contains sulfates', note: irritants.sulfates.note })
  }
  if (irritants.comedogenic && acneProne) {
    flags.push({ level: 'caution', title: 'Contains pore-clogging oils', note: irritants.comedogenic.note })
  }
  if (profile.avoidFragrance && (irritants.fragrance || irritants.essentialOils)) {
    flags.push({
      level: 'caution',
      title: 'Fragrance present',
      note: 'You asked to avoid fragrance and this product contains it.',
    })
  }

  // 5. Doubling up on the same active.
  for (const key of presentKeys) {
    if (usingSet.has(key) && ACTIVES[key].role === 'treatment') {
      flags.push({
        level: 'caution',
        title: `You already use a ${ACTIVES[key].label.toLowerCase()}`,
        note: 'Running two of the same active at once raises irritation without adding much benefit.',
      })
    }
  }

  // 6. Worth saying out loud when a feared combination is actually fine.
  for (const myth of MYTHS) {
    if (presentKeys.includes(myth.a) && (presentKeys.includes(myth.b) || usingSet.has(myth.b))) {
      flags.push({
        level: 'ok',
        title: `${ACTIVES[myth.a].label} with ${ACTIVES[myth.b].label} is fine`,
        note: myth.note,
      })
    }
  }

  const verdict = flags.some((f) => f.level === 'avoid')
    ? 'avoid'
    : flags.some((f) => f.level === 'caution')
      ? 'caution'
      : 'good'

  const headline = {
    good: 'Good match',
    caution: 'Be careful',
    avoid: 'Not recommended',
  }[verdict]

  return {
    verdict,
    headline,
    flags,
    actives: Object.entries(actives).map(([key, v]) => ({ key, label: v.label, matched: v.matched })),
  }
}

/** Barcode lookup against Open Beauty Facts. Free, no key, no auth. */
export async function lookupBarcode(barcode) {
  const url = `https://world.openbeautyfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Lookup failed')
  const data = await res.json()
  if (data.status !== 1) throw new Error('Not in the Open Beauty Facts database yet')

  const name = data.product?.product_name?.trim() || 'Unknown product'
  // `brands` is often a comma-separated list, and the product name
  // frequently already leads with the brand. Joining blindly gives
  // "CeraVe CeraVe Foaming Cleanser".
  const brand = (data.product?.brands || '').split(',')[0].trim()
  const dupe = brand && name.toLowerCase().startsWith(brand.toLowerCase())

  return {
    name,
    brand,
    title: dupe || !brand ? name : `${brand} ${name}`,
    ingredientsText: data.product?.ingredients_text || '',
  }
}
