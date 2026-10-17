# Feature Requests — Analysis and Build Plan

Read `SYSTEM_OVERVIEW.md` first. This file covers 4 new feature requests: what to build, which files change, the order to build them in, and the risks.

Note: the original request list said 5 items, but only 4 were extracted. Check the original message for a missing item.

---

## 0. Summary

| # | Feature | Fit | Effort | Build order |
|---|---|---|---|---|
| 4 | Admin notification on new seller/rider | Good, small | ~0.5 day | 1st |
| 3 | Clickable notifications | Good, partly exists | ~1 day | 2nd (with #4) |
| 1 | Lower delivery fee for nearby buyers | Good if zone-based | ~2 days | 3rd |
| 2 | Seller products "paid separately" | **Unclear — confirm meaning first** | 2–5 days | Last |

**Do these fixes first** (from SYSTEM_OVERVIEW section 14):
- **#3 Notifications use `$fetch`.** Switch to `useApiFetch`, or mobile users won't see any of the new notification features.
- **#4 RLS may block notification inserts.** Check the live DB. If inserts fail, every new notification feature fails too.
- **#1 Broken mobile URL.** Revert it to `https://nfwm.vercel.app`.

---

## 1. Shared groundwork: a notify helper

Today, every endpoint that sends a notification repeats the same `supabase.from('notifications').insert(...)` block. There are 6+ copies in `checkout.post.ts`, `orders/[id]/status.patch.ts` and `chat/send.post.ts`. Features 3 and 4 add more.

Create `server/utils/notify.ts`:

```ts
// One insert for many users. Never throws: a failed notification must not fail the main action.
export async function notify(supabase, userIds: string[], n: {
  title: string
  message: string
  type: 'order' | 'chat' | 'approval'
  link?: string | null      // in-app route to open on click
  order_id?: string | null
}) { ... insert rows ...; log error, do not throw }

export async function notifyRole(supabase, role: string, n) { ... select ids by role, then notify() }
```

Why "never throws": `checkout.post.ts` throws 500 after the order is already saved if the seller notification fails. The buyer sees an error but the order exists. With the helper, that bug goes away.

---

## 2. Feature 4 — Admin notification when a seller or rider registers

**Current:** `POST /api/auth/register` saves sellers and riders as `approval_status = 'pending'`. Admin only finds them by opening `/admin/approvals`.

**Change:**
- `server/api/auth/register.post.ts`: after a pending user is inserted, call
  `notifyRole(supabase, 'admin', { type: 'approval', title: 'New seller waiting for approval', message: '<name> (<email>) registered as seller.', link: '/admin/approvals' })`.
  Use the same call for `delivery` with the text "rider".
- `app/layouts/admin.vue`: add a bell icon + notification panel (the admin layout has none today). Use the shared component from feature 3.
- Optional: badge on the "Approvals" nav item using `GET /api/admin/approvals` count.

**Not useful:** notifying the seller when they are approved. They cannot log in while pending, so they would never see it in-app. If needed later, use email or SMS (out of scope).

**DB:** none (uses the `type`/`link` columns from feature 3).

**Test:** register a seller → admin bell shows 1 unread → click → opens `/admin/approvals`.

---

## 3. Feature 3 — Clickable notifications

**Current:**
- `notifications` columns: `user_id, order_id, title, message, is_read`. No link.
- Buyer and delivery layouts have `handleNotificationAction()`. It only opens the chat drawer, and it detects chat by checking `title.includes('Message')`. This is fragile.
- Seller layout: no click action. Admin layout: no panel.
- The same panel code is copied in 3 layouts.

**DB — migration `supabase/015_notification_links.sql`:**
```sql
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'order'
    CHECK (type IN ('order', 'chat', 'approval')),
  ADD COLUMN IF NOT EXISTS link TEXT;
UPDATE public.notifications SET type = 'chat' WHERE title ILIKE '%message%';
```
Use one `link` column (a route path). It is simpler than separate `action_type` + `action_target` columns.

**Link per notification (set on the server when inserting):**

| Event | Receiver | type | link |
|---|---|---|---|
| New order (checkout) | seller | order | `/seller/orders` |
| Order accepted / on the way / delivered / cancelled | buyer | order | `/buyer/orders/<orderId>` |
| Ready for pickup | riders | order | `/delivery/dashboard` |
| New chat message | buyer or rider | chat | null (opens chat drawer by `order_id`) |
| New seller/rider registered | admin | approval | `/admin/approvals` |

**Frontend:**
- New component `app/components/ui/NotificationPanel.vue`. Move the panel markup out of `buyer.vue`, `seller.vue` and `delivery.vue`, and use it in all 4 layouts.
- `useNotificationEngine.ts`:
  - Switch `$fetch` → `useApiFetch()` (fixes mobile).
  - Move `markSingleAsRead` here.
  - Add `openNotification(n)`:
    1. mark as read
    2. if `type === 'chat'` and `order_id` exists → call the injected `triggerChatModal`
    3. else if `link` exists → `navigateTo(link)` and close the panel
    4. else (old rows) → fall back by role: buyer → `/buyer/orders/<order_id>`, seller → `/seller/orders`, delivery → `/delivery/dashboard`
- Keep the "Dismiss" button (`@click.stop`).

**API:** `GET /api/notifications` already returns `*`, so the new columns come through automatically. No new endpoint is needed.

**Risks:**
- The seller orders page only lists `pending`/`processing` orders. A link to an order that is already ready does not show it. This is acceptable: link to the list, not to one order.
- Old notifications have no `link`. The fallback in step 4 covers them.

**Test:** one notification of each type, on web and on the Android app.

---

## 4. Feature 1 — Lower delivery fee for nearby buyers

**Current:**
- The fee is a fixed ₱50 in **two** places: `server/api/cart/checkout.post.ts` (`deliveryFee = 50`) and `app/pages/buyer/checkout.vue` (line ~148 text, line ~305 const).
- Orders do not store the fee. Only `total_amount` is saved.
- Addresses have `city` + `barangay`, picked from fixed lists in `app/utils/phLocations.ts` (6 cities, ~60 barangays). There are no GPS coordinates.
- Riders pick up the whole order as one package at the market in Bago City. Sellers have no location fields.

**Key point:** the rider travels **market → buyer**, so distance should be measured from the **market**, not from each seller. Confirm this with the requester: are all sellers at one weekend market, or do riders visit each farm?

### Option A (recommended): fee by zone (city/barangay)
- Uses data the system already has. No maps, no GPS, no new library.
- Admin sets the price per zone. This is easy to explain to buyers ("Bago Poblacion: ₱30").

**DB — `supabase/016_delivery_zones.sql`:**
```sql
CREATE TABLE public.delivery_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city TEXT NOT NULL,
  barangay TEXT,              -- NULL = whole city default
  fee NUMERIC(10,2) NOT NULL CHECK (fee >= 0),
  UNIQUE (city, barangay)
);
ALTER TABLE public.delivery_zones DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 50;
```
Lookup rule: exact barangay row → else city row → else default ₱50.

**Server:**
- New `server/utils/deliveryFee.ts` with `getDeliveryFee(supabase, address)`. It is the single source of the fee.
- `checkout.post.ts`: replace `const deliveryFee = 50` with the helper, and save `delivery_fee` on the order.
- New `GET /api/cart/delivery-fee?address_id=` (buyer). The checkout page uses it to show the fee before placing the order.
- Admin: `GET/POST/PUT/DELETE /api/admin/delivery-zones` + a simple table page `app/pages/admin/delivery-zones.vue`.

**Frontend:**
- `checkout.vue`: remove the hardcoded 50. Fetch the fee whenever the selected address changes.
- Order detail pages: show `delivery_fee` from the order.

### Option B: real distance (GPS)
**Update:** addresses now have a map pin (`latitude`/`longitude`, migration 009), so the data for this option already exists for buyers who pinned their address.
- Add `latitude, longitude` to `addresses` and a market location in config.
- Calculate distance with the Haversine formula (no library needed).
- Fee tiers, e.g. `<2 km`, `2–5 km`, `>5 km`.
- Needs a map pin picker in the address form (Leaflet + OpenStreetMap, free). Existing addresses have no coordinates.
- Rural buyers may drop the pin in the wrong place. About 2x the work of Option A.

You can upgrade from A to B later: the `getDeliveryFee` helper is the only place that changes.

**Risks:**
- The frontend and backend fee must come from the same helper. Never trust a fee sent by the client.
- Old orders: the migration default keeps them at ₱50, which matches what was charged.
- Cities outside the zone list still get the default fee.

**Test:** a buyer in each zone sees the right fee at checkout. The saved order has the same `delivery_fee` and `total_amount`. Changing the address updates the fee.

---

## 5. Feature 2 — Seller products "paid separately"

**Blocker: the meaning is unclear.** The translation "allow sellers to add products that are charged/paid separately" fits 3 different features. Confirm with the requester (check the original Tagalog) before building.

**Important fact:** the system has **no online payment**. Checkout only creates an order. In practice it is cash on delivery. Any "paid separately" feature that needs real online payment also needs a payment gateway (e.g. PayMongo or GCash). That is a large separate project.

### Meaning A: each shop's items become a separate order/payment
- Buyer checks out once, but the system makes **one order per seller**, each with its own total.
- Change: `checkout.post.ts` groups cart items by `seller_id` and creates N orders. Add `checkout_group_id` to `orders` so the buyer sees them together.
- Effect: the multi-seller confirm logic (`is_confirmed`, waiting for all sellers) becomes simpler, because each order has one seller. Riders get more, smaller jobs.
- Open question: is the delivery fee charged per order? If yes, buyers pay more. That conflicts with feature 1's goal.
- Effort: ~3 days. Touches checkout, seller orders, delivery queue, buyer order list.

### Meaning B: sellers pay the platform to list products
- Example: the first N products are free, and each extra product (or a monthly plan) costs a fee.
- Change: add `listing_fee_paid`/`is_active` on `products` or a `seller_payments` table. `products/create` checks the quota. Admin marks payments as received (manual, no gateway).
- Effort: ~2 days with manual payment confirmation.

### Meaning C: add-on products sold with a main product
- Example: a sauce or packaging with an item, charged as an extra line.
- Change: `parent_product_id` on `products` + add-on picker on the product page.
- Effort: ~3 days. The least likely meaning.

**Recommendation:** ask the requester which one they mean. If it is A, build it **before** feature 1, because it changes how the delivery fee is applied.

---

## 6. Files touched (all features)

| File | F1 | F2 | F3 | F4 |
|---|---|---|---|---|
| `supabase/015_notification_links.sql` (new) | | | ✓ | ✓ |
| `supabase/016_delivery_zones.sql` (new) | ✓ | | | |
| `server/utils/notify.ts` (new) | | | ✓ | ✓ |
| `server/utils/deliveryFee.ts` (new) | ✓ | | | |
| `server/api/cart/checkout.post.ts` | ✓ | ✓ | ✓ | |
| `server/api/orders/[id]/status.patch.ts` | | | ✓ | |
| `server/api/chat/send.post.ts` | | | ✓ | |
| `server/api/auth/register.post.ts` | | | | ✓ |
| `server/api/cart/delivery-fee.get.ts` (new) | ✓ | | | |
| `server/api/admin/delivery-zones*` (new) | ✓ | | | |
| `app/composables/useNotificationEngine.ts` | | | ✓ | |
| `app/components/ui/NotificationPanel.vue` (new) | | | ✓ | ✓ |
| `app/layouts/buyer.vue`, `seller.vue`, `delivery.vue`, `admin.vue` | | | ✓ | ✓ |
| `app/pages/buyer/checkout.vue` | ✓ | ✓ | | |
| `app/pages/admin/delivery-zones.vue` (new) | ✓ | | | |

---

## 7. Testing notes

- `.env` points at the real Supabase DB. Use a separate Supabase project (or branch) for testing writes like checkout and notifications.
- Run the migrations in number order. Each migration must be safe to run twice (`IF NOT EXISTS`).
- Test every notification change on the Android app too, not only the browser.
