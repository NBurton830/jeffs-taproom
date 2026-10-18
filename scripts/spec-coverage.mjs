#!/usr/bin/env node
// TEST-002: list P0/P1 requirement IDs in /specs that no Playwright test title references.
// Exit code 1 if any P0 is uncovered. Structural prefixes (ARCH, CMS, TEST) and _(manual)_ items are exempt.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const ID = /\b((?:[A-Z0-9]+-)+\d{3})\b/g
const EXEMPT_PREFIX = /^(ARCH|CMS|TEST|Q)-/

const required = new Map() // id -> { priority, file }
for (const file of readdirSync(join(root, 'specs')).filter((f) => f.endsWith('.md'))) {
  for (const line of readFileSync(join(root, 'specs', file), 'utf8').split('\n')) {
    // A requirement is defined where its ID is followed by a priority tag, e.g. "**ORD-001 (P0)**" or "## ARCH-001 Title (P0)".
    const def = line.match(/\b((?:[A-Z0-9]+-)+\d{3})\b[^|]*?\(P([012])\)/)
    if (!def) continue
    const [, id, p] = def
    if (p === '2' || EXEMPT_PREFIX.test(id) || /_\(manual/.test(line)) continue
    if (!required.has(id)) required.set(id, { priority: `P${p}`, file })
  }
}

const covered = new Set()
const testDir = join(root, 'tests')
for (const file of readdirSync(testDir).filter((f) => f.endsWith('.spec.ts'))) {
  const src = readFileSync(join(testDir, file), 'utf8')
  for (const m of src.matchAll(/\btest(?:\.\w+)?\(\s*(['"`])(.*?)\1/g)) {
    for (const id of m[2].matchAll(ID)) covered.add(id[1])
  }
}

const missing = [...required].filter(([id]) => !covered.has(id))
const p0 = missing.filter(([, r]) => r.priority === 'P0')
const total = required.size
console.log(`Spec coverage: ${total - missing.length}/${total} P0/P1 requirements have a test.`)
for (const [id, r] of missing) console.log(`  ${r.priority}  ${id.padEnd(16)} ${r.file}`)
process.exit(p0.length ? 1 : 0)
