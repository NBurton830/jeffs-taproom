import 'server-only'
import { store } from './store'

// ARCH-005: kitchen SSE fan-out
export function publish(event: 'order.created' | 'order.updated' | 'settings.updated', data: unknown) {
  for (const fn of store().subscribers) {
    try {
      fn(event, data)
    } catch {
      /* subscriber gone */
    }
  }
}

export function subscribe(fn: (event: string, data: unknown) => void) {
  store().subscribers.add(fn)
  return () => store().subscribers.delete(fn)
}
