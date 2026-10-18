import { subscribe } from '@/lib/bus'
import { requireStaff } from '@/lib/kitchenApi'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
// Serverless hosts cut long requests; EventSource reconnects and the board also polls every 5 s.
export const maxDuration = 60

// ARCH-005: Server-Sent Events for the kitchen display.
export async function GET(req: Request) {
  const user = await requireStaff(req)
  if (user instanceof Response) return user
  const enc = new TextEncoder()
  let cleanup = () => {}
  const stream = new ReadableStream({
    start(controller) {
      const send = (chunk: string) => {
        try {
          controller.enqueue(enc.encode(chunk))
        } catch {
          cleanup()
        }
      }
      send(': connected\nretry: 3000\n\n')
      const unsubscribe = subscribe((event, data) => send(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
      const heartbeat = setInterval(() => send(': ping\n\n'), 15_000)
      cleanup = () => {
        clearInterval(heartbeat)
        unsubscribe()
      }
      req.signal.addEventListener('abort', () => {
        cleanup()
        try {
          controller.close()
        } catch {}
      })
    },
    cancel() {
      cleanup()
    },
  })
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
