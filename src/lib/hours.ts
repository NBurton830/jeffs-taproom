import type { HoursData, OrderingStatus, SettingsData } from './types'
import { addDays, dayOf, formatTime, fromZoned, hhmmToMinutes, shortDay, ymdKey, zoned, type Ymd } from './time'

// VIS-010, VIS-011, CHK-011..014, ORD-040

export type Window = { start: Date; end: Date }

export function scheduleFor(hours: HoursData, ymd: Ymd): { open: string; close: string; note?: string | null } | null {
  const weekly = hours.weekly.find((w) => w.day === dayOf(ymd))
  const ex = hours.exceptions?.find((e) => e.date === ymdKey(ymd))
  if (ex) {
    if (ex.closed) return null
    const open = ex.open || weekly?.open
    const close = ex.close || weekly?.close
    return open && close ? { open, close, note: ex.note } : null
  }
  if (!weekly || weekly.closed) return null
  return { open: weekly.open, close: weekly.close }
}

export function windowFor(hours: HoursData, ymd: Ymd): Window | null {
  const s = scheduleFor(hours, ymd)
  if (!s) return null
  const open = hhmmToMinutes(s.open)
  let close = hhmmToMinutes(s.close)
  if (close <= open) close += 24 * 60 // closes after midnight
  return { start: fromZoned(ymd, open), end: fromZoned(ymd, close) }
}

export function currentWindow(hours: HoursData, now: Date): Window | null {
  const today = zoned(now)
  for (const ymd of [addDays(today, -1), today]) {
    const w = windowFor(hours, ymd)
    if (w && now >= w.start && now < w.end) return w
  }
  return null
}

export function nextOpening(hours: HoursData, after: Date): Date | null {
  const today = zoned(after)
  for (let i = -1; i < 15; i++) {
    const w = windowFor(hours, addDays(today, i))
    if (w && w.start > after) return w.start
  }
  return null
}

export type OpenStatus =
  | { state: 'open' | 'closing_soon'; closesAt: Date }
  | { state: 'closed'; opensAt: Date | null }

export function getOpenStatus(hours: HoursData, now: Date): OpenStatus {
  const cur = currentWindow(hours, now)
  if (cur) {
    const left = (cur.end.getTime() - now.getTime()) / 60000
    return { state: left <= 60 ? 'closing_soon' : 'open', closesAt: cur.end }
  }
  return { state: 'closed', opensAt: nextOpening(hours, now) }
}

export function openStatusText(status: OpenStatus, now: Date) {
  if (status.state !== 'closed') {
    return `${status.state === 'open' ? 'Open now' : 'Closing soon'} · until ${formatTime(status.closesAt)}`
  }
  if (!status.opensAt) return 'Closed'
  const sameDay = ymdKey(zoned(status.opensAt)) === ymdKey(zoned(now))
  return `Closed · opens ${sameDay ? '' : `${shortDay(status.opensAt)} `}${formatTime(status.opensAt)}`
}

/** "11:00 AM – 10:00 PM" or "Closed" for a calendar day. */
export function dayHoursText(hours: HoursData, ymd: Ymd) {
  const w = windowFor(hours, ymd)
  return w ? `${formatTime(w.start)} – ${formatTime(w.end)}` : 'Closed'
}

const ceilTo = (t: number, minutes: number) => Math.ceil(t / (minutes * 60000)) * minutes * 60000

export function getOrderingStatus(hours: HoursData, settings: SettingsData, now: Date): OrderingStatus {
  const base = { asapAt: null, slots: [] as string[], opensAt: null }
  if (!settings.onlineOrderingEnabled) {
    return { ...base, state: 'disabled', message: `Online ordering is currently unavailable. Call ${settings.phone}.` }
  }
  if (settings.orderingPausedUntil && now < new Date(settings.orderingPausedUntil)) {
    return { ...base, state: 'paused', message: settings.pauseMessage }
  }
  const lead = settings.prepLeadMinutes * 60000
  const closedMessage = (after: Date) => {
    const next = nextOpening(hours, after)
    return next ? `Online ordering is closed. We open ${shortDay(next)} at ${formatTime(next)}.` : 'Online ordering is closed.'
  }

  let win = currentWindow(hours, now)
  let state: 'open' | 'before_open' = 'open'
  if (!win) {
    const today = windowFor(hours, zoned(now))
    if (today && now < today.start) {
      win = today
      state = 'before_open'
    }
  }
  if (!win) return { ...base, state: 'closed', message: closedMessage(now) }

  const first = ceilTo(Math.max(now.getTime(), win.start.getTime()) + lead, settings.slotIntervalMinutes)
  const last = win.end.getTime() - settings.lastOrderMinutesBeforeClose * 60000
  const slots: string[] = []
  for (let t = first; t <= last; t += settings.slotIntervalMinutes * 60000) slots.push(new Date(t).toISOString())
  if (!slots.length) return { ...base, state: 'closed', message: closedMessage(win.end) }

  if (state === 'before_open') {
    return {
      state,
      message: `Online ordering opens at ${formatTime(win.start)} — schedule for later today`,
      asapAt: null,
      slots,
      opensAt: win.start.toISOString(),
    }
  }
  const asap = ceilTo(now.getTime() + lead, 5)
  return {
    state,
    message: `Pickup · Ready in about ${settings.prepLeadMinutes} min`,
    asapAt: new Date(asap).toISOString(),
    slots,
    opensAt: null,
  }
}

export const canCheckout = (s: OrderingStatus) => s.state === 'open' || s.state === 'before_open'
