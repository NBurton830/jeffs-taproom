import { notFound, redirect } from 'next/navigation'
import { getStaff } from '@/lib/auth'
import { formatCents } from '@/lib/money'
import { findOrderByNumber, toTicket } from '@/lib/orders'
import { formatTime } from '@/lib/time'
import { PrintButton } from '@/components/kds/PrintButton'

export const metadata = { title: 'Ticket' }

// KDS-016: 80 mm thermal-printer friendly
export default async function TicketPage({ params }: { params: Promise<{ number: string }> }) {
  if (!(await getStaff())) redirect('/kitchen/login')
  const order = await findOrderByNumber(Number((await params).number))
  if (!order) notFound()
  const t = toTicket(order)
  return (
    <main className="mx-auto bg-white p-3 font-mono text-[13px] text-black" style={{ width: '80mm' }}>
      <p className="text-center text-lg font-bold">JEFF&apos;S TAPROOM</p>
      <p className="text-center text-2xl font-bold">#{t.number}</p>
      <p>
        {t.customerName} · {t.phone}
      </p>
      <p className="font-bold">
        {t.pickupMode === 'asap' ? 'ASAP' : 'Scheduled'} · {formatTime(t.promisedAt)}
      </p>
      <hr className="my-2 border-dashed border-black" />
      {t.lines.map((l, i) => (
        <div key={i} className="mb-1">
          <p className="font-bold">
            {l.quantity} × {l.itemName}
            {l.variantLabel ? ` (${l.variantLabel})` : ''}
          </p>
          {l.modifiers.map((m) => (
            <p key={m.label} className="pl-3">
              - {m.label}
            </p>
          ))}
          {l.notes && <p className="pl-3">** {l.notes}</p>}
        </div>
      ))}
      {t.orderNotes && <p className="mt-2">NOTE: {t.orderNotes}</p>}
      <hr className="my-2 border-dashed border-black" />
      <p className="font-bold">{t.paymentMethod === 'cash' ? `CASH — collect ${formatCents(t.totalCents)}` : `CARD at pickup — ${formatCents(t.totalCents)}`}</p>
      <PrintButton />
    </main>
  )
}
