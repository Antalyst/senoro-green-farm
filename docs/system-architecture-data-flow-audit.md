# System Architecture & Data Flow Audit

## 1. High-Level System Overview

Senoro Green Farm is a marketplace/e-commerce application for farm products. The system supports four operational roles:

- `buyer`: browses products, manages cart, shipping addresses, orders, and reviews.
- `seller`: manages products, inventory, seller orders, metrics, and review replies.
- `delivery`: views assigned/out-for-delivery orders and updates delivery status.
- `admin`: views users, analytics, and global order data.

Core technologies:

- **Nuxt.js 4 / Vue 3**: client application and Nitro server API routes.
- **Node.js / Nitro server routes**: backend endpoints under `server/api`.
- **Supabase Postgres**: application database accessed through `@nuxtjs/supabase`.
- **Custom JWT authentication**: app-managed users table, bcrypt password hashes, HS256 JWTs, and an `auth_token` cookie / bearer-token fallback.
- **Capacitor / Ionic**: native mobile packaging, with a bearer-token flow for native webview requests.
- **ImgBB**: external image hosting for product uploads.

Primary backend structure:

```text
server/
  api/
    admin/
    auth/
    buyer/
    cart/
    delivery/
    orders/
    products/
    seller/
  utils/
    auth.ts
    chartMonths.ts
    orderStatus.ts

supabase/
  migration.sql
  002_addresses_logistics_analytics.sql
```

Runtime configuration is centralized in `nuxt.config.ts`:

```text
runtimeConfig:
  jwtSecret
  supabaseServiceKey
  imgbbApiKey
  public.supabaseUrl
  public.supabaseKey
  public.apiBaseUrl
```

Important architectural note: although `@nuxtjs/supabase` is installed, this project does **not** use Supabase Auth as the application login system. Authentication is implemented with a custom `public.users` table and locally signed JWTs.

## 2. Authentication Flow Audit

### Auth Components

```text
server/utils/auth.ts
  signToken(payload)
  verifyToken(token)
  requireAuth(event)

server/api/auth/login.post.ts
server/api/auth/register.post.ts
server/api/auth/me.get.ts
server/api/auth/logout.post.ts

app/composables/useAuth.ts
app/composables/useApiFetch.ts
app/middleware/auth.global.ts
```

### Login Flow

```text
Client login form
  -> useAuth().login(email, password)
  -> POST /api/auth/login
  -> Supabase query: public.users where email = normalized email
  -> bcrypt.compareSync(password, user.password)
  -> signToken({ id, full_name, email, role })
  -> setCookie('auth_token', token, httpOnly, sameSite=lax, maxAge=7 days)
  -> response returns { success, token, user }
  -> client stores:
       auth user in localStorage key: sgf_auth_user
       JWT in localStorage key: sgf_auth_token
```

Token generation:

```text
Algorithm: HS256
Secret: runtimeConfig.jwtSecret
Issued at: iat = current unix timestamp
Expiration: exp = iat + 7 days
Payload:
  id
  full_name
  email
  role
```

Cookie storage:

```text
Cookie name: auth_token
httpOnly: true
path: /
maxAge: 604800 seconds
sameSite: lax
secure: not enabled in current code
```

Local/native storage:

```text
localStorage:
  sgf_auth_user  -> serialized user object
  sgf_auth_token -> JWT returned by login/register
```

### Register Flow

```text
Client registration form
  -> useAuth().register(full_name, email, password, role)
  -> POST /api/auth/register
  -> validate role in [admin, seller, buyer, delivery]
  -> check public.users for duplicate email
  -> bcrypt.hashSync(password, 10)
  -> insert into public.users
  -> signToken(new user payload)
  -> set auth_token cookie
  -> response returns { success, token, user }
  -> client persists user + token in localStorage
```

Revision concern: public registration currently allows creating any role, including `admin`. That is acceptable for prototypes but unsafe for production.

### Authenticated API Request Flow

Web browser, same-origin:

```text
Client $fetch('/api/...') with relative URL
  -> browser sends auth_token cookie automatically
  -> requireAuth(event)
  -> getCookie(event, 'auth_token')
  -> verifyToken(token)
  -> endpoint role/ownership checks
```

Capacitor/native fallback:

```text
useApiFetch()
  -> detects window.Capacitor?.isNativePlatform()
  -> baseURL = runtimeConfig.public.apiBaseUrl
  -> reads sgf_auth_token from localStorage
  -> sets Authorization: Bearer <token>
  -> requireAuth(event)
  -> if no cookie, reads Authorization header
  -> verifyToken(token)
```

Current `apiBaseUrl` default:

```text
https://nfwm.vercel.app
```

### Session Hydration Flow

```text
Global route middleware
  -> if auth not initialized, call useAuth().fetchUser()
  -> GET /api/auth/me
  -> requireAuth(event)
  -> returns { user }
  -> if request fails, restore sgf_auth_user from localStorage
  -> route guard checks login state and role prefix
```

Potential issue: if `/api/auth/me` fails because the token is expired or rejected, the client falls back to the stored user object. This can make the UI appear logged in even when the server will reject protected requests.

### Logout Flow

```text
Client logout
  -> POST /api/auth/logout
  -> deleteCookie('auth_token')
  -> client clears user state
  -> client removes sgf_auth_user
  -> client removes sgf_auth_token
```

### Session Failure Points

- `jwtSecret` has a development fallback: `senoro-dev-secret-change-in-prod`. Any environment missing `NUXT_JWT_SECRET` will issue predictable tokens.
- The cookie is `sameSite=lax` and `secure` is not enabled. Cross-site domain moves and production HTTPS behavior can break cookie transmission or weaken cookie handling.
- For native requests, the JWT is stored in `localStorage`, which is accessible to client-side JavaScript.
- `/api/auth/me` fallback to `sgf_auth_user` can create stale authenticated UI state after token expiration.
- Custom JWT payload includes role and profile fields. If a user's role changes in the database, existing tokens keep the old role until expiration.
- There is no token revocation table or server-side session store. Logout only deletes the current client cookie/token.
- API calls rely on `requireAuth()` plus endpoint-level role checks. Any new endpoint that forgets `requireAuth()` becomes publicly callable.
- Login/register set cookies but do not set CORS headers. If the frontend and API are split across domains, credentials require explicit CORS support and `$fetch` credentials configuration.

## 3. Database Schema & Relationships

Schema source:

```text
supabase/migration.sql
supabase/002_addresses_logistics_analytics.sql
```

### Primary Entities

#### users

Application-managed user accounts.

```sql
public.users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text unique not null,
  password text not null,
  role text not null check (role in ('admin', 'seller', 'buyer', 'delivery')),
  created_at timestamptz not null default now()
)
```

Relationships:

- `users.id -> products.seller_id`
- `users.id -> cart_items.buyer_id`
- `users.id -> reviews.buyer_id`
- `users.id -> orders.buyer_id`
- `users.id -> orders.delivery_rider_id`
- `users.id -> order_items.seller_id`
- `users.id -> addresses.user_id`

#### products

Seller-owned marketplace catalog items.

```sql
public.products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references public.users(id) on delete cascade,
  name text not null,
  description text,
  price numeric(10,2) not null,
  stock integer not null default 0,
  category text not null,
  image_url text,
  created_at timestamptz not null default now()
)
```

Relationships:

- A seller owns many products.
- Products can appear in cart items, order items, and reviews.
- Product deletion cascades cart items and reviews, while `order_items.product_id` is set to null.

#### addresses

Buyer shipping addresses.

```sql
public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  full_name text not null,
  phone_number text not null,
  city text not null,
  barangay text not null,
  detailed_address text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
)
```

Relationships:

- A buyer has many addresses.
- `orders.address_id` points to a selected shipping address.
- Address deletion sets `orders.address_id` to null.

#### cart_items

Buyer cart rows, unique per buyer/product.

```sql
public.cart_items (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid references public.users(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  quantity integer not null default 1,
  created_at timestamptz not null default now(),
  unique(buyer_id, product_id)
)
```

Relationships:

- A buyer has many cart items.
- A product can be in many buyers' carts.

#### orders

Buyer order header and delivery lifecycle state.

```sql
public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid references public.users(id) on delete set null,
  address_id uuid references public.addresses(id) on delete set null,
  delivery_rider_id uuid references public.users(id) on delete set null,
  total_amount numeric(10,2) not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
)
```

Allowed statuses:

```text
pending
processing
ready_for_pickup
out_for_delivery
delivered
cancelled
```

Relationships:

- A buyer has many orders.
- A delivery rider can be assigned to many orders.
- An order has many order items.
- An order may reference one address.

#### order_items

Order line items with seller attribution.

```sql
public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  seller_id uuid references public.users(id) on delete set null,
  quantity integer not null,
  price numeric(10,2) not null,
  created_at timestamptz not null default now()
)
```

Relationships:

- An order has many order items.
- Seller dashboards are built by filtering `order_items.seller_id`.
- Product and seller references are nullable after deletion, preserving order history partially.

#### reviews

Buyer product reviews and seller replies.

```sql
public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  buyer_id uuid references public.users(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  seller_reply text default null,
  created_at timestamptz not null default now()
)
```

Relationships:

- A buyer can create reviews for products.
- A seller can reply to reviews on their own products.

### Relationship Diagram

```text
users
  ├─< products.seller_id
  │    ├─< cart_items.product_id
  │    ├─< reviews.product_id
  │    └─< order_items.product_id
  ├─< cart_items.buyer_id
  ├─< reviews.buyer_id
  ├─< addresses.user_id
  │    └─< orders.address_id
  ├─< orders.buyer_id
  ├─< orders.delivery_rider_id
  └─< order_items.seller_id

orders
  └─< order_items.order_id
```

### Checkout Data Flow

```text
POST /api/cart/checkout
  -> require buyer auth
  -> load selected cart_items with product data
  -> verify every cart_item belongs to current buyer
  -> resolve explicit address_id or default buyer address
  -> calculate total_amount from current product prices
  -> insert orders row with status 'pending'
  -> insert order_items rows
  -> update each product stock
  -> delete checked out cart_items
  -> return order_id and total_amount
```

Data integrity concern: this flow is not wrapped in a database transaction or RPC, so partial failure can leave inconsistent records.

### Row Level Security Status

The migrations explicitly disable RLS on all primary tables:

```sql
alter table public.users disable row level security;
alter table public.addresses disable row level security;
alter table public.products disable row level security;
alter table public.cart_items disable row level security;
alter table public.reviews disable row level security;
alter table public.orders disable row level security;
alter table public.order_items disable row level security;
```

The current security model depends on API route authorization and not on database-enforced policies.

## 4. API Route Map

Nuxt/Nitro route files map to `/api/...` endpoints.

```text
server/api/
  admin/
    analytics.get.ts
      GET /api/admin/analytics
      Admin-only aggregate metrics: user counts, order totals, revenue/month charts.

    users.get.ts
      GET /api/admin/users
      Admin-only user list.

  auth/
    login.post.ts
      POST /api/auth/login
      Validates email/password, signs JWT, sets auth_token cookie, returns user and token.

    logout.post.ts
      POST /api/auth/logout
      Clears auth_token cookie.

    me.get.ts
      GET /api/auth/me
      Validates current cookie or bearer token and returns authenticated user payload.

    register.post.ts
      POST /api/auth/register
      Creates user with selected role, signs JWT, sets auth_token cookie, returns user and token.

  buyer/
    addresses.get.ts
      GET /api/buyer/addresses
      Buyer-only list of the current buyer's addresses.

    addresses.post.ts
      POST /api/buyer/addresses
      Buyer-only create address; manages default address state.

    addresses/[id].put.ts
      PUT /api/buyer/addresses/:id
      Buyer-only update owned address.

    addresses/[id].delete.ts
      DELETE /api/buyer/addresses/:id
      Buyer-only delete owned address; may promote another default.

    addresses/[id]/default.put.ts
      PUT /api/buyer/addresses/:id/default
      Buyer-only set owned address as default.

    orders.get.ts
      GET /api/buyer/orders
      Buyer-only list of current buyer's orders.

    orders/[id].get.ts
      GET /api/buyer/orders/:id
      Buyer-only order detail scoped to current buyer.

  cart/
    index.get.ts
      GET /api/cart
      Buyer-only current cart with product and seller data.

    add.post.ts
      POST /api/cart/add
      Buyer-only add/update cart item with stock checks.

    checkout.post.ts
      POST /api/cart/checkout
      Buyer-only create order from selected cart items and shipping address.

    [id].delete.ts
      DELETE /api/cart/:id
      Buyer-only remove owned cart item.

  delivery/
    orders.get.ts
      GET /api/delivery/orders
      Delivery-only orders ready for pickup/out for delivery, scoped by assignment where applicable.

  orders/
    index.get.ts
      GET /api/orders
      Admin global orders or seller orders derived from seller order_items.

    [id].get.ts
      GET /api/orders/:id
      Buyer-only order detail scoped to current buyer.

    [id]/status.patch.ts
      PATCH /api/orders/:id/status
      Seller/delivery/admin order status update with transition validation.

  products/
    index.get.ts
      GET /api/products
      Public product catalog with seller summary.

    [id].get.ts
      GET /api/products/:id
      Public product detail with seller profile summary.

    create.post.ts
      POST /api/products/create
      Seller-only create product.

    update/[id].put.ts
      PUT /api/products/update/:id
      Seller-only update owned product.

    delete/[id].delete.ts
      DELETE /api/products/delete/:id
      Seller-only delete owned product.

    upload.post.ts
      POST /api/products/upload
      Seller-only image upload to ImgBB.

    reviews.get.ts
      GET /api/products/reviews
      Public product reviews by product_id query parameter.

    review.post.ts
      POST /api/products/review
      Buyer-only create product review.

  seller/
    metrics.get.ts
      GET /api/seller/metrics
      Seller-only dashboard metrics from order_items.

    orders.get.ts
      GET /api/seller/orders
      Seller-only orders that contain current seller's order_items.

    products.get.ts
      GET /api/seller/products
      Seller-only products owned by current seller.

    profile/[id].get.ts
      GET /api/seller/profile/:id
      Public seller profile with products/review summary.

    reviews/index.get.ts
      GET /api/seller/reviews
      Seller-only reviews for current seller's products.

    reviews/reply.put.ts
      PUT /api/seller/reviews/reply
      Seller-only reply to a review for an owned product.
```

### Public vs Protected Endpoints

Public endpoints observed:

```text
GET /api/products
GET /api/products/:id
GET /api/products/reviews
GET /api/seller/profile/:id
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout
```

Protected endpoints call `requireAuth(event)` and then perform role checks.

Role-protected areas:

```text
admin:
  /api/admin/*

buyer:
  /api/buyer/*
  /api/cart/*
  /api/products/review
  /api/orders/:id   (current implementation is buyer-only)

seller:
  /api/seller/metrics
  /api/seller/orders
  /api/seller/products
  /api/seller/reviews/*
  /api/products/create
  /api/products/update/:id
  /api/products/delete/:id
  /api/products/upload

delivery:
  /api/delivery/orders
  /api/orders/:id/status for delivery transitions

admin/seller:
  /api/orders

admin/seller/delivery:
  /api/orders/:id/status
```

## 5. Security & CORS Configuration

### Current Security Configuration

No explicit application-level CORS, CSP, HSTS, or general security headers were found in `nuxt.config.ts`.

Current relevant config:

```ts
export default defineNuxtConfig({
  ssr: false,
  runtimeConfig: {
    jwtSecret: process.env.NUXT_JWT_SECRET || 'senoro-dev-secret-change-in-prod',
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || '',
    imgbbApiKey: process.env.IMGBB_API_KEY || '',
    public: {
      supabaseUrl: process.env.SUPABASE_URL || '',
      supabaseKey: process.env.SUPABASE_KEY || '',
      apiBaseUrl: process.env.API_BASE_URL || 'https://nfwm.vercel.app',
    },
  },
  supabase: {
    redirect: false,
    redirectOptions: {
      login: '/auth/login',
      callback: '/auth/login',
      exclude: ['/*'],
    },
  },
})
```

Cookie options:

```text
httpOnly: true
sameSite: lax
secure: not enabled
path: /
maxAge: 7 days
```

### CORS and Domain Migration Risks

Risk scenario: frontend and API move to different domains.

```text
Frontend: https://app.example.com
API:      https://api.example.com
```

Likely failures:

- Browser will not send `auth_token` unless client fetch uses credentials and server CORS allows credentials.
- Server must return a concrete `Access-Control-Allow-Origin`, not `*`, when credentials are used.
- Server must include `Access-Control-Allow-Credentials: true`.
- Preflight requests must allow `Authorization`, `Content-Type`, and relevant HTTP methods.
- `sameSite=lax` may block cookie use for cross-site embedded or non-top-level flows.
- Cross-site cookies require `sameSite=none; secure=true`.
- `secure` should be enabled in production over HTTPS.

Risk scenario: Capacitor/native app calls Vercel API.

```text
Capacitor webview
  -> baseURL = API_BASE_URL or default https://nfwm.vercel.app
  -> Authorization: Bearer <localStorage token>
```

Likely failures:

- If `API_BASE_URL` points to an old deployment, native clients authenticate against the wrong backend.
- If `NUXT_JWT_SECRET` differs between deployments, tokens generated by one API will be rejected by another as `Invalid or expired session`.
- If the server does not allow `Authorization` in CORS preflight, native/web cross-origin requests can fail before reaching route logic.

Risk scenario: Supabase environment changes.

```text
serverSupabaseClient(event)
  -> depends on Supabase module configuration/env
  -> queries public.users/products/orders directly
```

Likely failures:

- Missing or mismatched `SUPABASE_URL` / `SUPABASE_KEY` can make login appear as invalid credentials because the users query fails or returns no row.
- Running migrations in a different order can remove expected columns like `orders.address_id` or `delivery_rider_id`.
- Disabled RLS means API bugs have broad data impact; enabling RLS later without policies can break every route.

### Invalid Credentials Failure Points

Common code-level causes:

```text
POST /api/auth/login
  -> lowercases and trims email
  -> .single() public.users lookup
  -> bcrypt.compareSync()
  -> returns 401 "Invalid email or password" for missing user or password mismatch
```

Potential migration causes:

- Database connected to a different Supabase project with no matching seeded users.
- User passwords imported without bcrypt hashes.
- `public.users.email` contains unexpected whitespace/case from legacy data.
- Supabase key lacks access after enabling RLS.
- `users` table renamed, moved schema, or replaced by Supabase Auth without updating routes.

### CORS Blocked Failure Points

Current code uses:

```text
web: relative /api routes
native: absolute API_BASE_URL with Authorization header
```

A CORS blocked error is likely after domain migration if:

- API and frontend origins differ.
- Nitro route rules do not define CORS headers.
- Preflight does not allow `Authorization`.
- Client fetch sends cookies but server does not allow credentials.
- Cookie settings remain `sameSite=lax` for a cross-site credential flow.

### Production Security Gaps

- RLS is disabled on all application tables.
- Public registration allows `admin`.
- No rate limiting on login/register/upload/review endpoints.
- No password policy beyond required presence.
- JWT revocation is not supported.
- Default JWT secret exists.
- `secure` cookie flag is not enabled.
- No CSRF protection on cookie-authenticated mutation routes.
- No explicit CORS allowlist.
- No explicit security headers such as CSP, HSTS, X-Frame-Options, Referrer-Policy, or Permissions-Policy.
- Product image upload depends on an external host and accepts base64 JSON or multipart images up to 10 MB, but does not perform image content scanning.

## 6. Revision Impact Analysis

### Top 3 Risks

#### 1. Authentication and domain migration can break sessions

The app uses two auth transport modes:

```text
web browser:
  auth_token httpOnly cookie

Capacitor/native:
  localStorage sgf_auth_token
  Authorization: Bearer <token>
```

This works while web requests are same-origin and native points at the correct API. A domain split, Vercel project change, or secret mismatch can create immediate failures:

- cookie not sent,
- preflight blocked,
- bearer token rejected,
- `/api/auth/me` returns 401,
- UI falls back to stale `sgf_auth_user`.

Revision recommendation:

```text
Before domain migration:
  - define a single canonical API origin per environment
  - set NUXT_JWT_SECRET consistently across deployments
  - add Nitro CORS allowlist for exact frontend/native origins
  - enable secure cookies in production
  - decide whether web auth should be cookie-only or bearer-token based
  - remove stale-user fallback or mark it as offline-only with server validation before protected actions
```

#### 2. Database integrity depends on non-transactional multi-step API flows

Checkout and order state changes involve multiple independent database writes.

Checkout sequence:

```text
insert orders
insert order_items
update products.stock
delete cart_items
```

Failure between these steps can produce:

- order without order items,
- order items without stock adjustment,
- stock adjusted while cart remains,
- partial stock updates across products,
- duplicate checkout attempts under concurrent requests.

Revision recommendation:

```text
Move checkout into a Supabase/Postgres RPC transaction:
  - lock selected cart/product rows
  - verify ownership and stock
  - create order and order_items
  - decrement stock atomically
  - clear cart rows
  - return created order
```

Also consider database constraints:

```text
products.stock >= 0
cart_items.quantity > 0
order_items.quantity > 0
orders.total_amount >= 0
```

#### 3. Authorization model is route-level only and will be fragile during expansion

The database has RLS disabled, so every protection boundary lives in route code. Current routes generally call `requireAuth()` and enforce roles, but the pattern is manual.

Risk examples:

```text
new endpoint without requireAuth()
  -> public data mutation risk

new seller query without seller_id filter
  -> cross-seller data exposure

role renamed or expanded
  -> middleware, SQL constraints, route guards, and API checks all need coordinated updates

enabling RLS later
  -> existing routes may fail unless policies match serverSupabaseClient behavior
```

Revision recommendation:

```text
Introduce shared authorization helpers:
  requireRole(event, ['seller'])
  requireBuyerOwner(...)
  requireSellerProductOwner(...)
  requireAdmin(...)

Then add database-side RLS policies or service-role-only server access deliberately.
```

### Secondary Revision Risks

- `server/api/auth/register.post.ts` allows self-selecting `admin`, `seller`, and `delivery` roles.
- Existing JWTs do not re-check the current database user role or account status.
- `app/middleware/auth.global.ts` route permissions are client-side only and should not be treated as security.
- `server/api/orders/[id].get.ts` and `server/api/buyer/orders/[id].get.ts` overlap in responsibility.
- Product upload requires `IMGBB_API_KEY`; deployments without it will return 503 for sellers.
- `SUPABASE_SERVICE_KEY` exists in runtime config but the audited routes use `serverSupabaseClient(event)`, not an explicit service-role client.
- Migrations are partly destructive: `migration.sql` drops existing tables when re-run.

## Recommended Revision Checklist

```text
Authentication:
  [ ] Remove development JWT secret fallback in production.
  [ ] Set secure cookie options by environment.
  [ ] Add token/session invalidation strategy.
  [ ] Prevent public admin registration.
  [ ] Revalidate user role/status against database for sensitive operations.

CORS and deployment:
  [ ] Define production/staging API origins.
  [ ] Add explicit CORS route rules or middleware.
  [ ] Allow Authorization and Content-Type headers.
  [ ] Allow credentials only for trusted origins.
  [ ] Verify API_BASE_URL for Capacitor builds.

Database:
  [ ] Convert checkout to an atomic database transaction/RPC.
  [ ] Add quantity, stock, and amount constraints.
  [ ] Decide RLS strategy before production.
  [ ] Replace destructive migration with versioned forward migrations.

Backend architecture:
  [ ] Centralize role and ownership authorization helpers.
  [ ] Add tests for auth, checkout, status transitions, and role boundaries.
  [ ] Consolidate duplicate order-detail routes.
  [ ] Add rate limiting for auth and upload endpoints.
```

## Source Files Reviewed

```text
nuxt.config.ts
package.json
server/utils/auth.ts
server/utils/orderStatus.ts
server/api/**/*
app/composables/useAuth.ts
app/composables/useApiFetch.ts
app/middleware/auth.global.ts
supabase/migration.sql
supabase/002_addresses_logistics_analytics.sql
```
