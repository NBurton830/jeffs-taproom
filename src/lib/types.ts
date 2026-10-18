import type { DayKey } from './time'

// Public menu JSON (CHK-055)
export type MenuOption = { label: string; priceDeltaCents: number; default: boolean }
export type MenuGroup = {
  key: string
  name: string
  minSelect: number
  maxSelect: number
  maxSelectByVariant: Record<string, number>
  options: MenuOption[]
}
export type MenuVariant = { label: string; priceCents: number | null; isMarketPrice: boolean }
export type MenuItem = {
  slug: string
  name: string
  description: string
  available: boolean
  onlineOrderable: boolean
  orderingNote: string
  tags: string[]
  variants: MenuVariant[]
  modifierGroups: MenuGroup[]
  image?: { url: string; alt: string; width: number; height: number } | null
}
export type MenuCategory = { slug: string; name: string; note: string; items: MenuItem[] }
export type PublicMenu = { categories: MenuCategory[] }

export type WeeklyRow = { day: DayKey; open: string; close: string; closed: boolean }
export type HoursException = { date: string; closed: boolean; open?: string | null; close?: string | null; note?: string | null }
export type HoursData = { weekly: WeeklyRow[]; exceptions: HoursException[] }

export type SettingsData = {
  onlineOrderingEnabled: boolean
  orderingPausedUntil: string | null
  pauseMessage: string
  prepLeadMinutes: number
  slotIntervalMinutes: number
  lastOrderMinutesBeforeClose: number
  cashDiscountPercent: number
  taxRatePercent: number
  tipPresetsPercent: number[]
  maxOnlineSubtotalCents: number
  orderNotificationEmail: string | null
  phone: string
  address: string
  geo: { lat: number; lng: number }
  socialLinks: { label: string; url: string }[]
  announcement: { enabled: boolean; text: string; link?: string | null }
}

export type OrderingState = 'open' | 'before_open' | 'closed' | 'paused' | 'disabled'
export type OrderingStatus = {
  state: OrderingState
  message: string
  asapAt: string | null
  slots: string[]
  /** for CHK-013: "ASAP available once we open at 11:00 AM" */
  opensAt: string | null
}

export type TipInput = { type: 'none' } | { type: 'percent'; value: number } | { type: 'amount'; cents: number }
export type PaymentMethod = 'cash' | 'card_at_pickup'
