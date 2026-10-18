'use client'

import { useEffect, useId } from 'react'
import { CartLines } from './CartLines'
import { useCart } from './CartProvider'
import { useModal } from './useModal'

export function CartDrawer() {
  const cart = useCart()
  const id = useId()
  const ref = useModal(cart.cartOpen, cart.closeCart)
  const { refreshStatus, cartOpen } = cart
  useEffect(() => {
    if (cartOpen) void refreshStatus()
  }, [cartOpen, refreshStatus])

  return (
    <dialog ref={ref} className="drawer" aria-labelledby={id} aria-modal="true">
      {cart.cartOpen && (
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-cream-dark px-5 py-3">
            <h2 id={id} className="text-2xl font-bold uppercase">
              Your order
            </h2>
            <button type="button" className="btn btn-ghost" onClick={cart.closeCart}>
              Close
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <CartLines inDrawer />
          </div>
        </div>
      )}
    </dialog>
  )
}

export function CartPanel() {
  const cart = useCart()
  return (
    <aside data-testid="cart-panel" aria-labelledby="cart-panel-title" className="card sticky top-36 hidden max-h-[calc(100vh-10rem)] overflow-y-auto lg:block">
      <h2 id="cart-panel-title" className="border-b border-cream-dark px-5 py-3 text-2xl font-bold uppercase">
        Your order
      </h2>
      {cart.ready && <CartLines />}
    </aside>
  )
}
