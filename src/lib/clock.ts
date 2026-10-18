import { store } from './store'

// TEST-004: all server-side time logic goes through now().
export function now(): Date {
  const o = store().clockOverride
  return o === null ? new Date() : new Date(o)
}

export function setClock(iso: string | null) {
  store().clockOverride = iso ? new Date(iso).getTime() : null
}

export const DEFAULT_TEST_NOW = '2026-11-06T17:00:00-05:00'
