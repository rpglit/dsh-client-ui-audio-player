/**
 * Build-artifact sanitize: strip this machine's absolute build root from the
 * prebuilt assets under lib/ so the published repository carries only
 * repo-relative paths (CSS region comments in lib/client.js, source-map
 * "sources" entries, anything else the bundler may have stamped).
 *
 * The replacement table is computed from this script's own location, so the
 * same script sanitizes the repo on any machine — no absolute path is
 * hardcoded here (the file itself must stay pushable anywhere).
 *
 *   replacement table:
 *     <repo root>/  ->  ''        (path becomes relative to the repo root)
 *
 * Rules:
 *   - .js files: literal text replacement of the absolute prefix.
 *   - .map files: same literal replacement, then the result must still parse
 *     as JSON and no "sources" entry may contain the build root.
 *   - Idempotent: a second run rewrites nothing.
 *   - Fails (exit 1) when the build root survives anywhere under lib/ after
 *     the pass, or when a source map breaks JSON validity.
 *
 * Run after tsc/tsdown:   node scripts/sanitize.mjs
 * (wired into "build" and "bundle" in package.json)
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PREFIX = root + '/'
const REPLACEMENT = ''

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    const st = statSync(p)
    if (st.isDirectory()) walk(p, out)
    else if (st.isFile()) out.push(p)
  }
  return out
}

const libFiles = walk(join(root, 'lib'))
const failures = []
let changed = 0

for (const file of libFiles) {
  const before = readFileSync(file, 'utf8')
  if (!before.includes(PREFIX)) continue
  const after = before.split(PREFIX).join(REPLACEMENT)
  if (file.endsWith('.map')) {
    // Source maps must remain valid JSON after the rewrite.
    let parsed
    try {
      parsed = JSON.parse(after)
    } catch (e) {
      failures.push(`${file}: not valid JSON after rewrite (${e.message})`)
      continue
    }
    const badSource = (parsed.sources ?? []).some(
      (s) => typeof s === 'string' && s.includes(root),
    )
    if (badSource) {
      failures.push(`${file}: a "sources" entry still contains the build root`)
      continue
    }
  }
  writeFileSync(file, after)
  changed++
  console.log(`sanitize: ${file.slice(root.length + 1)}  (${before.length} -> ${after.length} B)`)
}

// Final sweep: nothing under lib/ may still carry the absolute build root.
for (const file of libFiles) {
  if (readFileSync(file, 'utf8').includes(root)) {
    failures.push(`${file}: build root still present after pass`)
  }
}

if (failures.length > 0) {
  for (const f of failures) console.error(`sanitize: FAIL — ${f}`)
  process.exit(1)
}
console.log(`sanitize: OK — ${changed} file(s) rewritten, no absolute build root under lib/`)
