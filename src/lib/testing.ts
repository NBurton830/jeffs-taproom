import 'server-only'
import type { Client, InStatement } from '@libsql/client'
import { DEFAULT_TEST_NOW, setClock } from './clock'
import { getPayloadClient } from './payload'
import { store } from './store'

// TEST-003 /api/test/reset. The first reset seeds through Payload (so hooks, hashing and
// defaults run); later resets restore a raw SQL snapshot of that state, which is much faster.

async function client(): Promise<Client> {
  const payload = await getPayloadClient()
  const c = (payload.db as unknown as { client?: Client }).client
  if (!c) throw new Error('Test reset requires the SQLite adapter')
  return c
}

async function tables(c: Client) {
  const res = await c.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' AND name <> 'payload_migrations'",
  )
  return res.rows.map((r) => String(r.name))
}

const q = (id: string) => `"${id.replace(/"/g, '""')}"`

async function wipe(c: Client) {
  const names = await tables(c)
  await c.execute('PRAGMA foreign_keys = OFF')
  const stmts: InStatement[] = names.map((n) => `DELETE FROM ${q(n)}`)
  const hasSeq = await c.execute("SELECT name FROM sqlite_master WHERE name='sqlite_sequence'")
  if (hasSeq.rows.length) stmts.push('DELETE FROM sqlite_sequence')
  await c.batch(stmts, 'write')
  await c.execute('PRAGMA foreign_keys = ON')
}

async function takeSnapshot(c: Client) {
  const names = await tables(c)
  const hasSeq = (await c.execute("SELECT name FROM sqlite_master WHERE name='sqlite_sequence'")).rows.length > 0
  if (hasSeq) names.push('sqlite_sequence')
  const snap = []
  for (const table of names) {
    const res = await c.execute(`SELECT * FROM ${q(table)}`)
    snap.push({ table, columns: res.columns, rows: res.rows.map((r) => res.columns.map((col) => r[col])) })
  }
  return snap
}

async function restore(c: Client, snap: NonNullable<ReturnType<typeof store>['snapshot']>) {
  await c.execute('PRAGMA foreign_keys = OFF')
  const stmts: InStatement[] = []
  for (const { table } of snap) stmts.push(`DELETE FROM ${q(table)}`)
  for (const { table, columns, rows } of snap) {
    if (!rows.length) continue
    const sql = `INSERT INTO ${q(table)} (${columns.map(q).join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`
    for (const row of rows) stmts.push({ sql, args: row as never })
  }
  await c.batch(stmts, 'write')
  await c.execute('PRAGMA foreign_keys = ON')
}

export async function resetForTests(nowIso?: string | null) {
  const s = store()
  s.outbox.length = 0
  setClock(nowIso || DEFAULT_TEST_NOW)

  const c = await client()
  if (s.snapshot) {
    await restore(c, s.snapshot)
    return
  }
  const payload = await getPayloadClient()
  const { seedMenu, seedSite, seedDemo, seedTestUsers } = await import('../seed')
  await wipe(c)
  await seedMenu(payload)
  await seedSite(payload, { notificationEmail: 'orders@jeffstaproom.test' })
  await seedDemo(payload)
  await seedTestUsers(payload)
  s.snapshot = await takeSnapshot(c)
}
