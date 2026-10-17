# Storefront Redesign — Design Spec

> **Status (2026-10-17): implemented.** Components are in `app/components/storefront/`, the page is `app/pages/index.vue`, and the header/footer are in `app/layouts/buyer.vue`.
> Changes from this spec made during the build:
> - Product photos use `object-cover` (full-bleed), not `object-contain`. Sellers upload real photos, not cut-outs, and contain left large empty bands.
> - The shops section (promo grid + "More local shops" row) comes **before** the products section, like the reference. "Meet our farmers" is merged into it.
> - Category cards filter the home product grid (chips row) instead of linking to `/buyer/categories`. That page filters by fixed codes (`farm_vegetables`, …) that do not match seller-made category names, so it shows no products. **Follow-up: fix `/buyer/categories`.**

Goal: restyle the **buyer storefront** (home page, header, footer, product cards) to match the reference design: a clean, light e-commerce template with mint/green accents. The reference sells furniture; this spec turns it into a **farm market** (NFWM).

Read `SYSTEM_OVERVIEW.md` first for the system.

Scope:
- `app/pages/index.vue`: buyer home, full redesign.
- `app/layouts/buyer.vue`: new header and footer.
- `app/components/buyer/ProductCard.vue`: new card style.
- `app/pages/buyer/categories.vue` and `app/pages/buyer/shop/[id].vue`: use the new cards (no layout change).
- Out of scope: cart, checkout, orders, seller pages, the rider side.

---

## 1. Design style in short

| Item | Rule |
|---|---|
| Feel | Light, airy, lots of white space. Calm, not loud. |
| Color use | White page. Mint-green blocks behind hero and footer. Soft cream behind product images. One green for buttons and links. |
| Shapes | Small radius (4–8 px). Flat cards with a very light shadow or none. |
| Images | Product photo sits **centered on a cream square** (`object-contain`), never stretched. |
| Type | Clean sans-serif. Bold headings, regular body, small grey captions. |
| Buttons | Solid green, white text, small radius, medium size ("Go To Shop", "View all", "Shop now"). |
| Ratings | 5 small amber stars next to price. |
| Sections | Each section has a small grey label above a centered title (e.g. "01. Find your favourite" / "Shop By Categories"). |

The current home page is the opposite: dark green campaign hero, countdown, flash sale, heavy uppercase. **Remove it.**

---

## 2. Design tokens

Use the existing brand greens so the storefront still matches the seller and rider sides. Add 3 new tokens in `tailwind.config.ts` → `theme.extend.colors`:

```ts
'shop-mint':  '#E4F1EA', // hero block, footer, section backgrounds
'shop-cream': '#FBF4EC', // behind product and category images
'shop-ink':   '#1F2A24', // headings
```

| Role | Token | Hex |
|---|---|---|
| Primary button / links | `farm-leaf` (existing) | `#4E8B57` |
| Button hover | `farm-deep` (existing) | `#2F5D3A` |
| Mint background | `shop-mint` (new) | `#E4F1EA` |
| Image background | `shop-cream` (new) | `#FBF4EC` |
| Headings | `shop-ink` (new) | `#1F2A24` |
| Body text | `gray-600` | |
| Captions | `gray-400` | |
| Stars | `amber-400` | |
| Sale / discount | `market-orange` (existing) | `#E67E22` |

Type (Inter is already loaded):

| Use | Class |
|---|---|
| Hero title | `text-4xl md:text-5xl font-bold leading-tight text-shop-ink` |
| Section title | `text-2xl md:text-3xl font-semibold text-shop-ink text-center` |
| Section label | `text-xs text-gray-400 text-center` |
| Card title | `text-sm font-medium text-shop-ink` |
| Price | `text-sm font-semibold text-farm-leaf` |
| Old price | `text-xs text-gray-400 line-through` |

Other:
- Radius: cards `rounded-md`, buttons `rounded`, banners `rounded-lg`.
- Shadow: `shadow-sm` on hover only.
- Container: existing `max-w-page` (1200 px), side padding `px-4 md:px-8`.
- Section spacing: `py-12 md:py-16`.

---

## 3. Home page — section map

Top to bottom. "Data" names the real source in this system.

| # | Reference section | NFWM version | Data |
|---|---|---|---|
| 1 | Header (logo, menu, search, wishlist, cart) | Logo, menu, search, cart, bell, avatar | existing `buyer.vue` |
| 2 | Hero: title, text, "Go To Shop", big photo, slide numbers 01–04 | "Fresh from the farm, straight to your table" + market photo, 2–4 slides | static content + `/images/campaign/*` |
| 3 | Shop By Categories (carousel of cards) | Categories with product count | `GET /api/products` → group by `category` |
| 4 | Service strip (4 icons) | 4 real promises (see §4.4) | static |
| 5 | Promo grid (2 small + 1 large tile) | Featured shops / seasonal banners | `GET /api/products` → distinct sellers (`users.shop_banner_url`) |
| 6 | Top Product (left list) + Featured product (grid) + "View all" | "Best sellers" list + "Fresh today" grid | Best sellers: **new API** (§6). Fresh today: `GET /api/products` newest |
| 7 | Product row + 2 promo banners (left page) | Optional seasonal banners | static |
| 8 | Testimonial (quote + photo) | Real buyer review | **new API** (§6) from `reviews` |
| 9 | Our New Article (blog cards) | **Skip**, or replace with "Meet our farmers" (shop cards) | `GET /api/products` → sellers |
| 10 | Footer (logo, newsletter, link columns, social, payments) | Logo, link columns, contact, "Cash on delivery" | static |

---

## 4. Section specs

### 4.1 Header (`buyer.vue`)
- White bar, height 64 px, thin bottom border (`border-gray-100`), sticky.
- Left: logo + "NFWM".
- Center (desktop): `Home`, `Shop` (→ `/buyer/categories`), `Shops` (→ `#shops`), `My Orders`. Active link is green, others `gray-600`.
- Right: search icon (opens the search input), cart with count badge, bell with unread badge, avatar.
- No wishlist icon. The system has no wishlist.
- Mobile: logo + search + cart + bell. Keep the existing bottom tab bar.

### 4.2 Hero
- Desktop: 2 columns.
  - **Left 45%:** title, 2-line text, green button "Go To Shop" (→ `/buyer/categories`).
  - **Right 55%:** large photo, `rounded-lg`, height ~420 px.
- A `shop-mint` block sits behind the lower-left half of the hero (like the reference). Use an absolutely positioned div, `rounded-lg`, under the text column.
- Slide numbers `01 02 03 04` under the text: the active one is green with a short line after it. They switch slides every 6 s and are clickable. 2–4 slides is enough; each slide has `title`, `text`, `image`, `cta`.
- Mobile: photo on top (height 240 px), text under it, numbers centered.
- Example text:
  - Title: "Fresh from the farm, straight to your table"
  - Text: "Buy vegetables, fruits and local food from Negros farmers. Delivered in Bago City and nearby."

### 4.3 Shop By Categories
- Label "01. Find your favourite", title "Shop By Categories".
- Horizontal row of cards with left/right arrow buttons on desktop; swipe/scroll on mobile (`overflow-x-auto snap-x`).
- Card: 150×170 px, `shop-cream` background, image centered (80 px), name (`text-sm font-medium`), count (`text-xs text-gray-400`, "12 Products").
- Click → `/buyer/categories?category=<name>`.
- Data: categories are per seller in this system, so group `GET /api/products` results by `category` name (case-insensitive) and count them. Image: first product image in that category; fall back to the existing `categoryImages` map in `ProductCard.vue`.

### 4.4 Service strip
- 4 columns on desktop, 2×2 on mobile. Icon (outline, 28 px, green) + bold label + grey caption.
- Use **only true promises**. The reference's "Money return" and "Member discount" do not exist in this system.

| Icon (heroicons) | Label | Caption |
|---|---|---|
| `heroicons:truck` | Local delivery | ₱50 flat fee in our area |
| `heroicons:sparkles` | Farm fresh | Straight from local farmers |
| `heroicons:banknotes` | Cash on delivery | Pay when it arrives |
| `heroicons:chat-bubble-left-right` | Chat with rider | Message your rider live |

When the distance-based fee (see `docs/feature-requests-analysis.md`) is built, change the first caption.

### 4.5 Promo grid
- Desktop: grid of 3 tiles. Left column has 2 stacked tiles (each ~180 px tall); the right tile is large (~370 px).
- Each tile: background image (`object-cover`), text on top-left or top-right: small label, title, caption, optional "Shop now" link.
- NFWM content: featured shops. Use `shop_banner_url` (fall back to a category photo), title = `shop_name`, caption = "N products", link → `/buyer/shop/<id>`.
- Mobile: 1 column, each tile 180 px.

### 4.6 Best sellers + Fresh today
- Desktop: 2 columns, `grid-cols-[280px_1fr]`.
- **Left "Best sellers":** a cream panel with a vertical list of 3–4 rows. Each row: 64 px image on cream, name, price, stars, small outline "Add to cart" button.
- **Right "Fresh today":** title + caption + green "View all" button (→ `/buyer/categories`), then a 3-column grid (2 on mobile) of `ProductCard`.
- Mobile: the best-sellers list goes under the grid.

### 4.7 Product card (`ProductCard.vue`)
- Image box: `aspect-square`, `shop-cream` background, image `object-contain p-4`.
- On hover (desktop), show small round icon buttons on the image bottom: "Add to cart" and "View". Mobile: always show a small cart button.
- Under the image: name (1 line, truncate), then a row with price left and stars + review count right.
- Out of stock: grey overlay text "Sold out" and the cart button disabled.
- Keep the existing emits (`add-to-cart`, `buy-now`) so pages do not break.

### 4.8 Testimonial
- 2 columns: left = big quote (`text-lg`, centered, italic is optional), buyer name, product name; right = product photo on cream.
- Data: newest review with `rating >= 4` and a comment (**new API**, §6). Hide the section if there is none. **Never** show made-up quotes.

### 4.9 Meet our farmers (replaces "Our New Article")
- The system has no blog. Do not add fake articles.
- 2–3 cards in a row (carousel arrows on desktop): shop banner image, shop name, "N products", "Visit shop" button.

### 4.10 Footer (`buyer.vue`)
- Background `shop-mint`, `py-12`.
- 4–5 columns on desktop, stacked on mobile:
  1. Logo + 1-line about text ("Local farmers' market of Negros, online.")
  2. **Shop:** All products, Categories, Shops
  3. **Account:** My orders, Addresses, Cart
  4. **Sell with us:** Become a seller (→ `/auth/register`), Become a rider
  5. **Contact:** location (Bago City), email/phone if available
- Bottom row: "© 2026 NFWM", and on the right a "Cash on delivery" badge.
- **Do not** show Visa / Mastercard / PayPal icons. There is no online payment.
- **Do not** add a newsletter form unless an email list backend is added.
- On mobile, add bottom padding so the tab bar does not cover the footer.

---

## 5. Components to build

| Component | File | Props |
|---|---|---|
| `HeroSlider` | `app/components/storefront/HeroSlider.vue` | `slides: { title, text, image, ctaLabel, ctaTo }[]` |
| `SectionHeading` | `app/components/storefront/SectionHeading.vue` | `label?: string`, `title: string`, `align?: 'center' \| 'left'` |
| `CategoryCarousel` | `app/components/storefront/CategoryCarousel.vue` | `categories: { name, count, image }[]` |
| `ServiceStrip` | `app/components/storefront/ServiceStrip.vue` | none (static) |
| `PromoGrid` | `app/components/storefront/PromoGrid.vue` | `tiles: { title, caption, label?, image, to }[]` (first 3 used) |
| `BestSellerList` | `app/components/storefront/BestSellerList.vue` | `products: BuyerProduct[]` |
| `ReviewSpotlight` | `app/components/storefront/ReviewSpotlight.vue` | `review: { comment, rating, buyer_name, product_name, image }` |
| `ShopCard` | `app/components/storefront/ShopCard.vue` | `shop: { id, shop_name, banner, product_count }` |
| `StarRating` | `app/components/ui/StarRating.vue` | `value: number`, `count?: number` |
| `SiteFooter` | `app/components/storefront/SiteFooter.vue` | none |

All data loading stays in `index.vue`. Components only get props, so they are easy to reuse.

---

## 6. New API endpoints needed

| Endpoint | Returns | How |
|---|---|---|
| `GET /api/products/best-sellers?limit=4` | products ordered by units sold | Sum `order_items.quantity` per `product_id` (exclude `cancelled` orders), join product fields, same shape as `/api/products`. If there are no sales yet, return the newest products. Public. |
| `GET /api/reviews/featured` | one review: `comment, rating, created_at, buyer name, product id/name/image` | Newest `reviews` row with `rating >= 4` and a non-empty `comment`. Public. Return `{ review: null }` if none. |
| Ratings on product cards | `average_rating`, `review_count` per product | Add to `GET /api/products`: one extra query on `reviews` for the listed product ids, then merge. |

Everything else uses `GET /api/products`, which already returns name, price, stock, category, image and seller (`shop_name`, `shop_avatar_url`, `shop_banner_url`).

---

## 7. Do not copy from the reference

| Reference item | Why not |
|---|---|
| Wishlist heart icon | No wishlist feature |
| "Money return", "Member discount" | Not real policies here |
| Blog / "Our New Article" | No blog; use "Meet our farmers" |
| Newsletter form | No email list backend |
| Visa/Mastercard/PayPal icons | Cash on delivery only |
| Old prices with discounts | No sale price field in `products`. Show only when one is added |
| Furniture photos / text | Use farm photos and copy |

---

## 8. Responsive rules

| Width | Rules |
|---|---|
| < 640 px | 1 column. Hero image on top. Category row scrolls sideways. Product grid 2 columns. Footer stacked. Bottom tab bar visible. |
| 640–1023 px | Product grid 3 columns. Promo grid 2 columns. |
| ≥ 1024 px | Full layouts as described. Hover actions on cards. |

- Touch targets are at least 40×40 px.
- Images use `loading="lazy"` except the hero.
- Check that Capacitor (the Android app) shows the same page; it loads the hosted site.

---

## 9. Build order

1. Tokens in `tailwind.config.ts` + `SectionHeading`, `StarRating`.
2. New `ProductCard` style. Check the categories and shop pages still work.
3. Header + `SiteFooter` in `buyer.vue`.
4. Home: Hero → Categories → Service strip → Fresh today grid. (These use existing data only, so this is shippable.)
5. API: ratings in `/api/products`, `best-sellers`, `reviews/featured`.
6. Home: Best sellers, Promo grid, Testimonial, Meet our farmers.
7. Remove the old campaign hero, countdown, flash-sale strip and stats.

## 10. Done when

- [ ] Home matches the section order in §3 on desktop and mobile.
- [ ] No fake data: every number, review, shop and product comes from the database, or the section is hidden.
- [ ] Empty states work: no products, no reviews, no sales.
- [ ] Add to cart from the card works and the header cart count updates.
- [ ] No horizontal scroll at 360 px width.
- [ ] Old campaign hero/countdown/flash sale code is removed.
- [ ] `nuxt build` passes.
