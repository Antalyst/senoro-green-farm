# System Overview — NFWM
Read this first. It explains how the whole system works in short, simple English.
Brand name in UI: **Negros Farmers Weekend Market (NFWM)**. Repo name: `senoro-green-farm`.

---

## 1. What the system is

An online farm market (multi-seller e-commerce).
- **Buyers** buy farm products from many shops in one order.
- **Sellers** (farmers/shops) list products and confirm orders.
- **Delivery riders** pick up ready orders and deliver them.
- **Admin** approves new sellers/riders and sees analytics.

Location context: Bago City, Negros, Philippines. Currency: PHP (₱). Flat delivery fee: **₱50** per order.

---

## 2. Tech stack

| Part | Tool |
|---|---|
| Frontend | Nuxt 4 + Vue 3, **SPA mode** (`ssr: false`), Tailwind CSS, `@nuxt/icon` |
| Backend | Nuxt server routes (Nitro) in `server/api/` |
| Database | Supabase Postgres, used through `@nuxtjs/supabase` (`serverSupabaseClient`) |
| Auth | **Custom** (NOT Supabase Auth): `users` table + bcrypt + HS256 JWT |
| Realtime | Supabase Realtime (chat only) |
| Images | Supabase Storage, public bucket `product-images` (migration 013): product photos, shop avatar/banner |
| Charts | Highcharts (`FarmChart.vue`) |
| Mobile | Capacitor 8 (Android/iOS) + Ionic Vue. App loads the hosted Vercel site |
| Hosting | Vercel |

---

## 3. Folder map

```
app/                     Frontend (srcDir)
  pages/                 Routes (file-based)
    index.vue            Buyer home / product feed (public)
    auth/                login, register
    buyer/               cart, checkout, categories, orders, product/[id], shop/[id], profile
    seller/              dashboard, inventory, orders, reviews, profile, settings
    delivery/            dashboard
    admin/               dashboard, approvals
  layouts/               buyer, seller, delivery, admin, auth, default (each role has its own nav + notification panel)
  middleware/auth.global.ts   Route guard (login + role check)
  composables/           Shared logic (see section 9)
  components/            UI parts (ProductCard, OrderChatDrawer, FarmChart, ...)
server/
  api/                   All backend endpoints (see section 8)
  utils/auth.ts          signToken / verifyToken / requireAuth
  utils/orderStatus.ts   Allowed status transitions
  utils/productResponse.ts  Normalizes product category name
  utils/chartMonths.ts   Last-6-months chart helpers
  utils/psgc.ts          Philippine address data (psgc.gitlab.io). Delivery province = Negros Occidental
supabase/                SQL migrations (run in order: migration.sql, 002 ... 008)
android/, ios/           Capacitor native projects
docs/                    Older audit docs
```

---

## 4. How to run

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build (.output/)
npm run deploy:android   # generate + cap sync + run on Android
```

Env vars (`.env`):
- `SUPABASE_URL`, `SUPABASE_KEY` (anon key) — required.
- `IMGBB_API_KEY` — no longer used (ImgBB banned the account; images now use Supabase Storage).
- `NUXT_JWT_SECRET` — **must set in production.** If missing, a public default secret is used.
- `API_BASE_URL` — base URL the mobile app calls.

---

## 5. Roles and access

| Role | Can register? | Needs admin approval? | Home route |
|---|---|---|---|
| buyer | yes | no (auto `approved`) | `/` |
| seller | yes | yes (`pending` first) | `/seller/dashboard` |
| delivery | yes | yes (`pending` first) | `/delivery/dashboard` |
| admin | **no** (seed only) | — | `/admin/dashboard` |

`users.approval_status`: `pending` | `approved` | `rejected`. Login is blocked (403) unless `approved`.

Seed accounts (from `supabase/migration.sql`): `admin@senoro.com`, `seller@senoro.com`, `buyer@senoro.com`, `delivery@senoro.com`.

---

## 6. Authentication flow

1. `POST /api/auth/login` checks email + bcrypt password + approval status.
2. Server signs a JWT (HS256, 7 days) with `{id, full_name, email, role}`.
3. Token is sent 2 ways:
   - `auth_token` httpOnly cookie (web).
   - `token` in JSON → saved in `localStorage.sgf_auth_token` (mobile).
4. Every protected endpoint calls `requireAuth(event)`: reads cookie, else `Authorization: Bearer <token>`.
5. Role check is done **inside each endpoint** (`if (user.role !== 'seller') 403`).
6. Frontend: `useAuth()` keeps the user in global state. `auth.global.ts` middleware:
   - Public routes: `/`, `/auth/login`, `/auth/register`, `/buyer/categories`, `/buyer/product/*`, `/buyer/shop/*`.
   - Other routes need login. A user who opens another role's prefix (e.g. buyer → `/seller/...`) is sent to their own dashboard.
7. Always use `useApiFetch()` for API calls. It adds the Bearer token and the mobile base URL.

---

## 7. Main business flow (order lifecycle)

```
Buyer: browse → add to cart → checkout
        │
        ▼
 pending ──seller accepts──▶ processing ──all sellers mark ready (+ print QR receipt)──▶ ready_for_pickup
                                                                   │ rider ACCEPTS (delivery_rider_id set, status unchanged)
                                                                   │ rider SCANS each shop's receipt QR
                                                                   ▼
            delivered ◀── rider SCANS buyer's QR ──  out_for_delivery
 (cancelled: only admin can set; no UI for it)
```

QR handoff (needs migration 012, `order_items.picked_up_at`):
- Codes are HMACs of the order (+ seller) with `NUXT_JWT_SECRET` (`server/utils/handoffCodes.ts`), so they cannot be forged.
- Pickup QR text: `NFWM:P:<orderId>:<sellerId>:<code>`, printed on each shop's receipt (`/seller/receipt/:id`).
- Delivery QR text: `NFWM:D:<orderId>:<code>`, shown to the buyer on `/buyer/orders/:id` only while `out_for_delivery`.
- Every QR also shows an 8-character code (`ABCD-2345`) the rider can type in if the camera fails.

Step details:
1. **Add to cart** (`/api/cart/add`): checks stock. `is_update=true` sets an exact quantity; otherwise it adds to the current quantity.
2. **Checkout** (`/api/cart/checkout`):
   - Buyer must have a shipping address (frontend guard: `useShippingAddressGuard`, backend also checks).
   - Total = sum(product price × qty) + ₱50. Prices come from the DB, not the client.
   - Creates 1 `orders` row + many `order_items` rows (each item stores its `seller_id`).
   - Lowers product stock, deletes the cart items.
   - Sends a notification to every seller in the order.
3. **Seller confirms** (`PATCH /api/orders/:id/status`):
   - `status: processing` → order becomes processing (buyer notified).
   - `status: ready_for_pickup` → marks only **this seller's** items `is_confirmed = true`. The order becomes `ready_for_pickup` only when **all** items from all sellers are confirmed. If not, it stays `processing`.
   - When ready: **all** delivery riders get a notification.
4. **Rider** (riders can no longer use `PATCH /status`; it returns 403):
   - `POST /api/delivery/orders/:id/accept`: claims an unclaimed ready order (one winner, conditional update). Buyer and sellers notified.
   - `POST /api/delivery/scan` at each shop: sets `picked_up_at` on that shop's items. When all shops are scanned → `out_for_delivery` (buyer notified).
   - `POST /api/delivery/scan` at the buyer: buyer's QR → `delivered` (buyer notified).
5. **Review**: buyer can post a 1–5 star review (`/api/products/review`). Seller can reply (`/api/seller/reviews/reply`).

Seller order list (`/api/seller/orders`) shows orders in `pending`/`processing`/`ready_for_pickup` that have this seller's items, with `seller_subtotal`, `seller_confirmed`, `seller_picked_up` and the rider.

---

## 8. API reference (server/api)

Legend: P = public, B = buyer, S = seller, D = delivery, A = admin, Any = any logged-in user.

**Auth**
| Method | Path | Who | Does |
|---|---|---|---|
| POST | /api/auth/register | P | Create user (no admin role) |
| POST | /api/auth/login | P | Login, returns token + cookie |
| GET | /api/auth/me | Any | Current user from token |
| POST | /api/auth/logout | P | Clears cookie |

**Products / shops**
| Method | Path | Who | Does |
|---|---|---|---|
| GET | /api/products | P | List with `average_rating`, `review_count`. Query: `search`, `category`, `category_id` |
| GET | /api/products/best-sellers?limit= | P | Top products by units sold (cancelled excluded), filled with newest if few sales. Adds `units_sold` |
| GET | /api/reviews/featured | P | Newest 4–5★ review with a comment, buyer name shortened ("Juan D."), or `{ review: null }` |
| GET | /api/products/:id | P | One product + seller + category |
| GET | /api/products/reviews?product_id= | P | Reviews of a product |
| GET | /api/seller/profile/:id | P | Shop page: seller, categories, products, avg rating |
| POST | /api/products/create | S | New product (needs own `category_id`) |
| PUT | /api/products/update/:id | S | Edit own product |
| DELETE | /api/products/delete/:id | S | Delete own product |
| POST | /api/products/upload | S | Upload image (JPG/PNG/WebP/GIF, max 5 MB) to Supabase Storage → returns public `url` |
| POST | /api/products/review | B | Post review |

**Cart / checkout / buyer**
| Method | Path | Who | Does |
|---|---|---|---|
| GET | /api/cart | B | Cart items |
| POST | /api/cart/add | B | Add / set quantity |
| DELETE | /api/cart/:id | B | Remove item |
| POST | /api/cart/checkout | B | Body: `cart_item_ids[]`, `address_id?` |
| GET | /api/buyer/orders | B | My orders |
| GET | /api/orders/:id | B | One of my orders |
| GET/POST | /api/buyer/addresses | B | List / add address |
| PUT/DELETE | /api/buyer/addresses/:id | B | Edit / delete address |
| PUT | /api/buyer/addresses/:id/default | B | Set default address |
| GET | /api/locations/cities | P | Cities/municipalities of Negros Occidental (from PSGC API, cached 1 day) |
| GET | /api/locations/barangays/:cityCode | P | Barangays of one city (PSGC code, must be in Negros Occidental; cached 1 day) |
| GET | /api/locations/reverse?lat=&lng= | Any | Map pin → address via OpenStreetMap Nominatim (max 1 req/s, cached 7 days) |

**Seller**
| Method | Path | Who | Does |
|---|---|---|---|
| GET | /api/seller/metrics | S | Revenue, order count, 6-month chart |
| GET | /api/seller/products | S | My products |
| GET | /api/seller/orders | S | Orders waiting for me |
| GET/POST | /api/seller/categories | S | My categories |
| PUT/DELETE | /api/seller/categories/:id | S | Edit / delete category |
| GET/PUT | /api/seller/profile | S | GET: full shop profile + pickup location (`location_supported: false` before migration 010). PUT: shop name |
| PUT | /api/seller/profile/location | S | Pickup pin + pickup address. Body: `latitude, longitude, shop_address` (503 before migration 010) |
| PUT | /api/seller/profile/media | S | Shop name, avatar, banner URLs |
| GET | /api/seller/reviews | S | Reviews on my products |
| PUT | /api/seller/reviews/reply | S | Reply to review |

**Orders / delivery / chat / notifications**
| Method | Path | Who | Does |
|---|---|---|---|
| PATCH | /api/orders/:id/status | S, D, A | Change status (rules in section 7) |
| GET | /api/orders | S, A | Legacy list (admin: all, seller: items) |
| GET | /api/delivery/orders | D | `pickup_queue` (ready, no rider yet) + `active_deliveries` (mine: accepted or on the way); `shops[].picked_up` |
| POST | /api/delivery/orders/:id/accept | D | Claim a ready job (409 if taken) |
| POST | /api/delivery/scan | D | Body `order_id` + `payload` (QR text) or `code`. Pickup scan or delivery scan, by order status |
| GET | /api/seller/orders/:id/receipt | S | Receipt data + signed pickup QR for this seller's package (after marking ready) |
| GET | /api/chat/:orderId/messages | buyer or rider of order | Chat history |
| POST | /api/chat/send | buyer or rider of order | Send message (only when status is `ready_for_pickup`/`out_for_delivery` AND a rider is assigned) |
| GET | /api/notifications | Any | My notifications + `unreadCount` |
| PATCH | /api/notifications/:id | Any | Mark read/unread |
| POST | /api/notifications/read-all | Any | Mark all read |

**Admin**
| Method | Path | Who | Does |
|---|---|---|---|
| GET | /api/admin/analytics | A | Users, orders, 6-month chart, role counts |
| GET | /api/admin/users | A | All users |
| GET | /api/admin/approvals | A | Pending sellers/riders |
| PATCH | /api/admin/users/:id/approval | A | Body: `approval_status: approved|rejected` |

Error format: Nuxt `createError` → `{ statusCode, statusMessage }`.

---

## 9. Frontend composables (app/composables)

| Name | Job |
|---|---|
| `useAuth` | User state, login, register, logout, `dashboardRoute(role)` |
| `useApiFetch` | `$fetch` with Bearer token + mobile base URL. **Use this for all API calls.** |
| `useProductActions` | Add to cart helpers |
| `useShippingAddressGuard` | Blocks checkout if buyer has no address |
| `useOrderTimeline` | Status → timeline steps/labels |
| `useOrderChat` | Chat history, send, realtime subscribe |
| `useLayoutChatDrawer` | Chat drawer state; `provide('triggerChatModal', ...)` for pages |
| `useNotificationEngine` | Notification list + unread count (global state) |
| `useFarmChartTheme` | Highcharts theme |

---

## 10. Database (Supabase Postgres)

| Table | Key columns |
|---|---|
| users | id, full_name, email (unique), password (bcrypt), role, approval_status, shop_name (unique), shop_avatar_url, shop_banner_url, shop_latitude, shop_longitude, shop_address (pickup pin, migration 010) |
| addresses | user_id, full_name, phone_number, city, barangay, detailed_address, is_default, latitude, longitude (map pin, migration 009). City/barangay are picked from the PSGC API (saved as names, e.g. "Bago City") |
| categories | seller_id, name (unique per seller) — each seller has own categories |
| products | seller_id, name, description, price, stock, category (text copy), category_id, image_url, unit_type (`pc,kg,g,bundle,serving`) |
| cart_items | buyer_id, product_id, quantity (unique buyer+product) |
| orders | buyer_id, address_id, delivery_rider_id, total_amount, status |
| order_items | order_id, product_id, seller_id, quantity, price (price at purchase), is_confirmed, picked_up_at (012), product_name + product_image_url (014: copied at checkout, so history survives product edits/deletes) |
| reviews | product_id, buyer_id, rating 1–5, comment, seller_reply |
| notifications | user_id, order_id, title, message, is_read |
| messages | order_id, sender_id, receiver_id, message_text |

Notes:
- One order can have items from many sellers. Seller ownership lives in `order_items.seller_id`.
- `products.category` is a text copy of the category name, kept in sync on create/update.
- RLS is **disabled** on most tables. All access control is in the server code.

---

## 11. Realtime chat

- Chat is only between **buyer and assigned rider** of one order.
- Client subscribes to Supabase channel `realtime-order-chat:<orderId>` (listens to `postgres_changes` INSERT on `messages` and a `broadcast` event `message`).
- Server `/api/chat/send` inserts the message, creates a notification for the receiver, and broadcasts on the same channel.
- Notifications are **not** realtime; layouts fetch them when the panel opens.

---

## 11b. Address map pin

- `app/components/address/LocationPicker.vue`: Leaflet map with OpenStreetMap tiles (free). Fixed center pin; the user drags the map. "Use my location" uses device GPS (`navigator.geolocation`).
- When the pin moves, `/api/locations/reverse` looks up the address. The address page then fills city, barangay and street automatically.
- Saved as `addresses.latitude/longitude`. If migration 009 is not applied, the address still saves without the pin (`coordinates_saved: false`).
- Riders: `DeliveryJobCard.vue` shows **Call** and **Navigate** (Google Maps directions link) when the address has a pin.
- Sellers pin their **pickup location** in Shop Settings (same picker). `/api/delivery/orders` adds each shop's pin to `shops[]`, and riders get a **Navigate** button per shop.

## 11c. Seller layout

- `app/layouts/seller.vue`: left sidebar (grouped links, shop card, Orders badge = orders not yet confirmed by this seller). On phones the sidebar is a slide-in drawer opened from the top bar. No bottom tab bar.

---

## 12. Mobile app (Capacitor)

- `capacitor.config.json` → `server.url` loads the hosted site inside the app.
- In the native app, `useApiFetch` uses `runtimeConfig.public.apiBaseUrl` as base URL and sends the Bearer token (cookies may not work in webview).
- `useAuth` falls back to `localStorage.sgf_auth_user` if `/api/auth/me` fails.

---

## 13. Test results (2026-10-16)

- `nuxt build`: **passed** (no build errors).
- API smoke test on local build, 37 checks: **37 passed, 0 failed**. The tests covered:
  - public product/shop endpoints
  - login/register validation (bad role, admin blocked, missing fields, wrong password)
  - 401 with no token or a bad token
  - 403 role checks for every role
  - 400 input validation and 404 for missing records
- Only read-only and validation tests were run. Checkout, status change and chat writes were **not** run, because `.env` points to the real database.
- Live DB at test time: 4 users, 0 products, 0 orders.

---

## 14. Known issues and risks (fix these)

1. **Broken mobile API URL (uncommitted change).** `nuxt.config.ts` `apiBaseUrl` and `capacitor.config.json` `server.url` were changed from `https://nfwm.vercel.app` to `https://Negros Farmers Weekend Market.vercel.app`. A URL cannot have spaces, so the mobile app cannot load. Revert to `https://nfwm.vercel.app`.
2. **Default JWT secret.** If `NUXT_JWT_SECRET` is not set, the secret is the public string in `nuxt.config.ts`. Anyone can then make an admin token. The local test proved this works. Set a strong secret in Vercel.
3. **Notifications break on mobile.** `useNotificationEngine` and the layouts use plain `$fetch`, not `useApiFetch`. On native this means no base URL and no Bearer token. Switch them to `useApiFetch`.
4. **RLS on `notifications` and `messages` (confirmed 2026-10-17).** Migrations 006/007 use `auth.uid()` policies, but the app does not use Supabase Auth, so the anon key gets error 42501 on insert and sees no rows. Fix: run `supabase/011_notifications_messages_rls_off.sql`, which turns RLS off like the other tables. No service key is used. Notifications are best effort (`notify()` in `server/utils/notify.ts`), so they never fail checkout or a status change.
5. **Checkout is not atomic.** Order, items, stock and cart are separate calls. If one fails in the middle, data is partly saved. Stock is not checked again at checkout, so overselling is possible.
6. **Reviews**: any buyer can review any product, with no check that they bought it and no limit on duplicate reviews.
7. **Admin status change** has no transition rules (admin can set any status). Nobody else can cancel an order.
8. `PUT /api/products/update/:id` writes the request body to the row directly (only `id`, `seller_id`, `created_at`, `categories` are removed).
9. `README.md` is the default Nuxt starter text.

---

## 15. Rules for AI agents editing this repo

- Use `useApiFetch()` for every frontend API call.
- Every new protected endpoint must call `requireAuth(event)` and check `user.role`.
- Check ownership in code (`.eq('seller_id', user.id)` etc.). Do not rely on RLS.
- Status changes go only through `PATCH /api/orders/:id/status`. Follow the rules in `server/utils/orderStatus.ts` and section 7.
- New DB changes: add a new numbered file in `supabase/` (next is `015_...sql`).
- Keep UI style: Tailwind with colors `farm-*` and `market-orange` (see `tailwind.config.ts`).
- Do not commit `.env`.
