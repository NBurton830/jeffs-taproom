// Fresh SQLite database for every Playwright run, then `next start` (TEST-001).
import { rmSync, mkdirSync } from 'node:fs'
import { spawn } from 'node:child_process'

const file = (process.env.DATABASE_URI ?? 'file:./data/e2e.db').replace(/^file:/, '')
for (const suffix of ['', '-wal', '-shm', '-journal']) rmSync(file + suffix, { force: true })
mkdirSync('data', { recursive: true })

const child = spawn('pnpm', ['exec', 'next', 'start', '-p', process.env.PORT ?? '3100'], { stdio: 'inherit', env: process.env })
const stop = () => child.kill('SIGTERM')
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
child.on('exit', (code) => process.exit(code ?? 0))
