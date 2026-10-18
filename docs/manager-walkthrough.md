# Jeff's Taproom — website demo walkthrough

Site: **https://<your-project>.vercel.app**
Admin: **https://<your-project>.vercel.app/admin** (your manager login)

Anything marked **"(sample)"** is placeholder content for this demo. The menu, prices and hours are the real ones;
hours are still a placeholder until we confirm them.

## 1. What customers see (5 min, try it on your phone)

1. **Home**: open/closed status, today's specials, fan favourites, upcoming events, map. On a phone the
   bottom bar has **Call · Directions · Order**.
2. **Menu**: the full printed menu as real text. Try searching "crab" or tapping the **Spicy** filter.
3. **Specials, Events, On Tap, Burger Challenge, Private Events, Visit**: one tap each from the top menu.
4. **Install it like an app:** in Safari tap Share → *Add to Home Screen*.

## 2. Place a test order (3 min)

1. **Order Pickup** → tap **Add** on Bone-In Wings → choose 16 wings, two sauces, a dressing → **Add to order**.
2. Open the cart (top right) → **Checkout**.
3. Pick **ASAP** or a later time, enter a name and phone, choose **cash (save 3%)** or **card at pickup**, add a tip.
4. **Place order**. Keep this page open: it updates by itself as the kitchen works the order.

## 3. The kitchen screen (`/kitchen`, sign in with your manager login)

Put this on a tablet at the pass or behind the bar.

- New orders appear in **New** with a chime. **Accept** → **Mark ready** → **Picked up**.
  The customer's page updates at each step.
- **+5 min / +10 min** pushes the pickup time back and the customer sees the new time.
- **Cancel order** asks for a reason, which is shown to the customer.
- **Pause online ordering** when slammed (15/30/60 min, or until you switch it back).
- **86 items**: switch off anything you've run out of. It immediately shows "Sold out today" on the site.
- **Print ticket** opens a receipt-printer-sized ticket.

## 4. Running the site day to day (`/admin`)

| To… | Go to |
|---|---|
| Change a price or description | **Menu → Items** → pick the item → edit **Variants** (prices are in cents: 1295 = $12.95) → Save |
| Mark everything available at opening | **Menu → Items** → **Mark all available** |
| Set today's crab price | **Menu → Items → Crab-Balls** → enter the price on each size |
| Add an event or special | **What's On → Events / Specials** → Create New |
| Update the tap list | **What's On → Taps** (On tap / Coming soon / Kicked) |
| Holiday hours or a closure | **Site → Hours → Exceptions** (date, closed or special hours) |
| Site-wide banner ("Closed Thanksgiving") | **Site → Settings → Announcement** |
| Add a Hall of Fame winner | **Burger Challenge → Hall of Fame** → tick **Approved** to show it |
| Party and catering requests | **Inquiries** |
| See all orders | **Orders** |

## Questions we need answered before launch

1. Exact bar and kitchen hours, and holiday closures.
2. Which POS do you use (Toast, Square, Clover)? Should online orders go into it?
3. Do you want customers to prepay online by card, or keep pay-at-pickup?
4. Is the 3% cash discount and the $3 soda still on the printed menu?
5. Logo files, real photos, Facebook/Instagram links and the domain name.
6. Who should have logins (managers, kitchen)?
