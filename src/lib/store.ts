// Process-wide state. Next.js may bundle a module once per route, so module-level variables
// are not shared between routes. Everything that must be shared lives on globalThis.
type Store = {
  clockOverride: number | null
  outbox: { to: string; subject: string; text: string }[]
  subscribers: Set<(event: string, data: unknown) => void>
  snapshot: { table: string; columns: string[]; rows: unknown[][] }[] | null
}

const g = globalThis as unknown as { __jt?: Store }

export function store(): Store {
  g.__jt ??= {
    clockOverride: null,
    outbox: [],
    subscribers: new Set(),
    snapshot: null,
  }
  return g.__jt
}
