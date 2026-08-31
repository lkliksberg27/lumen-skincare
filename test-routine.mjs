/**
 * Checks on the parts that must be exactly right rather than
 * merely plausible: the budget arithmetic and the conflict rules.
 *
 * Run with:  node test-routine.mjs
 */

import { buildRoutine, CATALOG } from './src/lib/catalog.js'
import { parseInci, checkProduct } from './src/lib/ingredients.js'

let pass = 0
let fail = 0

const ok = (name, cond, detail = '') => {
  if (cond) { pass++; console.log(`  PASS  ${name}`) }
  else { fail++; console.log(`  FAIL  ${name}${detail ? `\n        ${detail}` : ''}`) }
}

/* ---------------- budget ---------------- */

console.log('\nBudget solver')

const profile = {
  skinType: 'combination',
  sensitivity: 'sensitive',
  concerns: ['acne', 'dryness'],
  goals: ['acne'],
  allergies: [],
  avoidFragrance: false,
}

const severities = { acne: 72, dryness: 55, redness: 30, oiliness: 48, unevenTone: 25, pores: 40, irritation: 15 }

// Cheapest possible routine across the slots, computed independently.
const cheapest = ['cleanser', 'treatment', 'moisturizer', 'spf']
  .map((slot) => Math.min(...CATALOG.filter((p) => p.slot === slot).map((p) => p.price)))
const floorCost = cheapest.reduce((a, b) => a + b, 0)
console.log(`  (absolute cheapest one-per-slot floor: $${floorCost})`)

for (const budget of [200, 100, 60, 50, 45, 40, 20, 0]) {
  const r = buildRoutine(profile, severities, budget)
  const sum = r.products.reduce((s, p) => s + p.price, 0)

  ok(`$${budget}: total matches sum of unique products`, r.total === sum,
    `total=${r.total} sum=${sum}`)

  if (budget > 0) {
    if (!r.overBudget) {
      ok(`$${budget}: fits and is flagged as fitting`, r.total <= budget,
        `total=${r.total} budget=${budget}`)
    } else {
      // If flagged over, no cheaper valid combination should exist.
      ok(`$${budget}: over-budget claim is honest`, r.total <= floorCost + 12,
        `claimed cheapest=${r.total} but per-slot floor is ${floorCost}`)
    }
  }

  const am = r.am.find((s) => s.role === 'Treatment')?.product
  const pm = r.pm.find((s) => s.role === 'Treatment')?.product
  ok(`$${budget}: morning and night treatments differ`, am && pm && am.id !== pm.id,
    `am=${am?.id} pm=${pm?.id}`)
}

/* ---------------- budget actually bites ---------------- */

console.log('\nBudget changes the answer')

const rich = buildRoutine(profile, severities, 200)
const poor = buildRoutine(profile, severities, 45)
ok('a tight budget produces a cheaper routine', poor.total < rich.total,
  `rich=$${rich.total} poor=$${poor.total}`)
ok('the generous budget is not artificially capped', rich.total > floorCost,
  `rich=$${rich.total} floor=$${floorCost}`)

/* ---------------- profile constraints ---------------- */

console.log('\nProfile constraints')

const fragFree = buildRoutine(
  { ...profile, avoidFragrance: true }, severities, 200
)
ok('fragrance-free request is respected',
  fragFree.products.every((p) => p.fragranceFree),
  fragFree.products.filter((p) => !p.fragranceFree).map((p) => p.id).join(', '))

const verySensitive = buildRoutine(
  { ...profile, sensitivity: 'very' }, severities, 200
)
ok('very sensitive skin gets only gentle products',
  verySensitive.products.every((p) => p.gentle),
  verySensitive.products.filter((p) => !p.gentle).map((p) => p.id).join(', '))

const dry = buildRoutine(
  { ...profile, skinType: 'dry', goals: ['dryness'] }, severities, 200
)
ok('dry skin gets products rated for dry skin',
  dry.products.every((p) => p.skin.includes('dry')),
  dry.products.filter((p) => !p.skin.includes('dry')).map((p) => p.id).join(', '))

/* ---------------- conflict rules ---------------- */

console.log('\nIngredient conflicts')

const base = { skinType: 'normal', sensitivity: 'none', concerns: [], allergies: [] }

const bpVsRetinol = checkProduct(
  parseInci('Aqua, Benzoyl Peroxide, Glycerin'), base, ['retinoid']
)
ok('benzoyl peroxide flags against an existing retinoid',
  bpVsRetinol.flags.some((f) => f.title.toLowerCase().includes('benzoyl')),
  JSON.stringify(bpVsRetinol.flags.map((f) => f.title)))

const allergy = checkProduct(
  parseInci('Aqua, Glycerin, Parfum, Tocopherol'),
  { ...base, allergies: ['parfum'] }, []
)
ok('a declared allergy returns avoid', allergy.verdict === 'avoid', allergy.verdict)

const clean = checkProduct(
  parseInci('Aqua, Glycerin, Ceramide NP, Sodium Hyaluronate, Panthenol'), base, []
)
ok('a bland list returns good', clean.verdict === 'good',
  `${clean.verdict}: ${clean.flags.map((f) => f.title).join(', ')}`)

const myth = checkProduct(
  parseInci('Aqua, Niacinamide, Ascorbyl Glucoside'), base, []
)
ok('niacinamide with vitamin C is reported as fine, not a conflict',
  myth.verdict === 'good' && myth.flags.some((f) => f.level === 'ok'),
  `${myth.verdict}: ${myth.flags.map((f) => `${f.level}/${f.title}`).join(', ')}`)

const adapalene = checkProduct(
  parseInci('Aqua, Adapalene, Carbomer'), base, ['benzoylPeroxide']
)
ok('adapalene is exempted from the benzoyl peroxide rule',
  !adapalene.flags.some((f) => f.level === 'avoid'),
  adapalene.flags.map((f) => `${f.level}/${f.title}`).join(', '))

const parse = parseInci('INGREDIENTS: Aqua (Water), Glycerin*, Niacinamide; May Contain: CI 77491')
ok('parser strips headings, parentheticals, asterisks and the may-contain tail',
  parse.length === 3 && parse[0] === 'aqua' && parse[2] === 'niacinamide',
  JSON.stringify(parse))

/* ---------------- result ---------------- */

console.log(`\n${pass} passed, ${fail} failed\n`)
process.exit(fail ? 1 : 0)
