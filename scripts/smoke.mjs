/**
 * Build-artifact smoke: the browser bundle is a closure factory the DSH
 * module loader executes, so a fresh shell only needs to grep it — no
 * browser, no host. Fails (exit 1) when lib/client.js is missing, too
 * small, loses the loader factory, loses this package's stamped id, or
 * regains the retired upstream name.
 */
import { readFileSync, statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const file = resolve(root, 'lib/client.js')
const NEW_NAME = 'dsh-client-ui-audio-player'
const OLD_NAME = '@deepseek-ai/dsh-client-ui-audio-player'

const failures = []
let size = 0
try {
  size = statSync(file).size
} catch {
  console.error(`smoke: ${file} is missing — run "pnpm run build" first`)
  process.exit(1)
}
const code = readFileSync(file, 'utf8')
const factoryCount = code.split('window.__ModuleLoader__.load(').length - 1
const newCount = code.split(NEW_NAME).length - 1
const oldCount = code.split(OLD_NAME).length - 1

console.log(`smoke: ${file}`)
console.log(`  size=${size} B  __ModuleLoader__.load=×${factoryCount}  "${NEW_NAME}"=×${newCount}  "${OLD_NAME}"=×${oldCount}`)
if (size < 2048) failures.push(`bundle is ${size} B, expected > 2 KB`)
if (factoryCount < 1) failures.push('the window.__ModuleLoader__.load( factory is missing')
if (newCount < 1) failures.push(`the stamped id "${NEW_NAME}" is missing`)
if (oldCount > 0) failures.push(`the retired name "${OLD_NAME}" is present ${oldCount}×`)
if (failures.length > 0) {
  for (const failure of failures) console.error(`smoke: FAIL — ${failure}`)
  process.exit(1)
}
console.log('smoke: OK')
