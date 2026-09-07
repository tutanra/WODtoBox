#!/usr/bin/env node
/**
 * Fails if docs/contrato.json drifts from the source that must keep it true.
 * Run: npm run check:compat
 */
import { readFileSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const contractPath = join(root, 'docs/contrato.json')

function fail(message) {
  console.error(`check-compat: ${message}`)
  process.exitCode = 1
}

function read(rel) {
  const path = join(root, rel)
  if (!existsSync(path)) {
    fail(`missing file ${rel}`)
    return ''
  }
  return readFileSync(path, 'utf8')
}

const contract = JSON.parse(readFileSync(contractPath, 'utf8'))

if (contract.schemaVersion !== 2) {
  fail(`unsupported schemaVersion ${contract.schemaVersion} (docs/compatibilidad.md)`)
}

const timerSrc = read('src/types/timer.ts')
const kindsMatch = timerSrc.match(/export const TIMER_KINDS = \[([\s\S]*?)\] as const/)
if (!kindsMatch) {
  fail('TIMER_KINDS not found in src/types/timer.ts')
} else {
  const found = [...kindsMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1])
  const expected = contract.timerKinds
  if (JSON.stringify(found) !== JSON.stringify(expected)) {
    fail(`TIMER_KINDS is [${found.join(', ')}] but contrato.json has [${expected.join(', ')}]`)
  }
}

for (const kind of contract.timerKinds) {
  if (!timerSrc.includes(`'${kind}'`)) fail(`kind '${kind}' missing in src/types/timer.ts`)
}

for (const id of contract.templateIds) {
  const inPower = read('src/data/powerClean100.ts').includes(id)
  const inKipping = read('src/data/kippingMuscleUp.ts').includes(id)
  const inTemplates = read('src/data/templates.ts').includes(id) || inPower || inKipping
  if (!inTemplates) fail(`template id '${id}' not found in data builders`)
}

const heroSrc = read('src/data/heroWods.ts')
for (const id of contract.heroWodIds ?? []) {
  if (!heroSrc.includes(id)) fail(`hero wod id '${id}' not found in src/data/heroWods.ts`)
}

const storageValues = [
  ...Object.values(contract.storage.localStorage),
  ...Object.values(contract.storage.sessionStorage),
]
for (const key of storageValues) {
  const libs = [
    'src/lib/wods.ts',
    'src/lib/programs.ts',
    'src/lib/sessions.ts',
    'src/lib/runSession.ts',
    'src/lib/history.ts',
    'src/lib/rms.ts',
    'src/lib/sync.ts',
  ]
    .map(read)
    .join('\n')
  if (!libs.includes(`'${key}'`) && !libs.includes(`"${key}"`)) {
    fail(`storage key ${key} not found in src/lib persistence files`)
  }
}

if (!read('capacitor.config.ts').includes(contract.applicationId)) {
  fail(`applicationId ${contract.applicationId} missing in capacitor.config.ts`)
}

for (const anchor of contract.anchors) {
  const text = read(anchor.file)
  if (!text.includes(anchor.contains)) {
    fail(`anchor ${anchor.id}: '${anchor.contains}' not in ${anchor.file}`)
  }
}

if (process.exitCode) {
  console.error('Contract broken. See docs/compatibilidad.md — do not ship until migrated.')
  process.exit(process.exitCode)
}

console.log(`check-compat: ok (schemaVersion ${contract.schemaVersion}, ${contract.anchors.length} anchors)`)
