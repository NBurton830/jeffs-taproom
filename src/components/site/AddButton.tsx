'use client'

import type { MenuItem } from '@/lib/types'
import { useCart } from './CartProvider'

export function AddButton({ item, className = 'btn btn-primary' }: { item: MenuItem; className?: string }) {
  const cart = useCart()
  return (
    <button type="button" className={className} aria-label={`Add ${item.name}`} onClick={(e) => cart.openItem(item, { returnFocus: e.currentTarget })}>
      Add
    </button>
  )
}
