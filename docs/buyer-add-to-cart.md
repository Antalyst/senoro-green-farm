# Buyer Add to Cart Functionality

## Overview
The Add to Cart feature allows buyers to add products from the marketplace to their shopping cart for later checkout. This document covers the technical implementation, API endpoints, JWT token handling, and best practices for the buyer-side add to cart functionality in Senoro Green Farm.

## Architecture

### Frontend Components
The add to cart functionality is implemented across multiple buyer pages:

1. **Dashboard** (`app/pages/buyer/dashboard.vue`)
2. **Categories** (`app/pages/buyer/categories.vue`)
3. **Product Detail** (`app/pages/buyer/product/[id].vue`)
4. **Cart** (`app/pages/buyer/cart.vue`)

### Backend API
- **POST** `/api/cart/add` - Add or update item in cart
- **GET** `/api/cart` - Fetch user's cart items
- **DELETE** `/api/cart/{id}` - Remove item from cart
- **POST** `/api/cart/checkout` - Checkout selected items

## JWT Token Handling

### Critical Mobile WebView Rule
Capacitor mobile webviews drop `HttpOnly` cookies. Every frontend API call MUST explicitly inject the custom JWT token from `localStorage` into the `Authorization: Bearer <token>` header.

### Token Storage
- **Storage Key:** `sgf_auth_token`
- **Location:** `localStorage`
- **Managed by:** `useAuth()` composable (`app/composables/useAuth.ts`)

### Token Injection
The `useApiFetch()` composable automatically handles JWT token injection:

```typescript
// app/composables/useApiFetch.ts
export function useApiFetch() {
  const config = useRuntimeConfig()
  
  // Detect if we are running in a native Capacitor webview
  const isCapacitor = import.meta.client && typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform()
  
  // If native, force the Vercel base URL. Otherwise, use relative paths for web.
  const baseURL = isCapacitor ? config.public.apiBaseUrl : ''

  // Return a customized fetch instance
  return $fetch.create({
    baseURL: baseURL as string,
    onRequest({ options }) {
      if (import.meta.client) {
        const token = localStorage.getItem('sgf_auth_token')
        if (token) {
          const headers = new Headers(options.headers)
          headers.set('Authorization', `Bearer ${token}`)
          options.headers = headers
        }
      }
    }
  })
}
```

### Backend Token Verification
The backend `requireAuth()` utility handles token verification from both cookies and Authorization header:

```typescript
// server/utils/auth.ts
export function requireAuth(event: Parameters<typeof getCookie>[0]): UserPayload {
  let token = getCookie(event, 'auth_token')

  if (!token) {
    const authHeader = getHeader(event, 'authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    }
  }

  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  const user = verifyToken(token)
  return user
}
```

## Frontend Implementation

### Add to Cart Function
The `addToCart()` function is implemented consistently across all buyer pages:

```typescript
async function addToCart(product: any, quantity = 1) {
  if (!product || product.stock === 0) return
  try {
    await api('/api/cart/add', {
      method: 'POST',
      body: {
        product_id: product.id,
        quantity: quantity
      }
    })
    triggerToast(`Added ${quantity} unit(s) of ${product.name} to cart.`)
    
    // Refresh header cart count
    try {
      if (refreshCartCount && typeof refreshCartCount === 'function') {
        refreshCartCount()
      }
    } catch (refreshErr) {
      console.error('Failed to refresh cart count:', refreshErr)
    }
  } catch (err: any) {
    console.error('Add to cart error:', err)
    triggerToast(err.data?.statusMessage || 'Failed to add item to cart', 'error')
  }
}
```

### Key Defensive Checks
1. **Product Validation:** Check if product exists and has stock
2. **Type Checking:** Verify `refreshCartCount` is a function before calling
3. **Error Logging:** Console errors for debugging
4. **User Feedback:** Toast notifications for success/error states

### Product Detail Page Specifics
On the product detail page, the quantity selector allows users to choose quantity before adding:

```typescript
// Quantity selector
const qty = ref(1)

async function addToCart() {
  if (!product?.value || product.value.stock === 0) return
  try {
    const quantity = qty?.value ?? 1
    await api('/api/cart/add', {
      method: 'POST',
      body: {
        product_id: product.value.id,
        quantity: quantity
      }
    })
    triggerToast(`Added ${quantity} unit(s) of ${product.value.name} to cart.`)
    // ... refresh cart count
  } catch (err: any) {
    console.error('Add to cart error:', err)
    triggerToast(err.data?.statusMessage || 'Failed to add item to cart', 'error')
  }
}
```

## Backend Implementation

### Add to Cart Endpoint
**File:** `server/api/cart/add.post.ts`

```typescript
export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const body = await readBody(event)
  const { product_id, quantity = 1, is_update = false } = body

  // Validate input
  if (!product_id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Product ID is required'
    })
  }

  // Fetch product details with stock validation
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, name, stock, price')
    .eq('id', product_id)
    .single()

  if (productError || !product) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Product not found'
    })
  }

  // Stock validation
  if (product.stock < quantity) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Insufficient stock'
    })
  }

  // Calculate final quantity
  let finalQuantity = quantity
  if (!is_update) {
    // If not an update, check existing cart item
    const { data: existingItem } = await supabase
      .from('cart_items')
      .select('quantity')
      .eq('buyer_id', user.id)
      .eq('product_id', product_id)
      .single()

    if (existingItem) {
      finalQuantity = existingItem.quantity + quantity
      if (finalQuantity > product.stock) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Insufficient stock for requested quantity'
        })
      }
    }
  }

  // Upsert cart item
  const { data, error } = await supabase
    .from('cart_items')
    .upsert(
      { buyer_id: user.id, product_id, quantity: finalQuantity },
      { onConflict: 'buyer_id, product_id' }
    )
    .select()
    .single()

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to add item to cart'
    })
  }

  return { success: true, cart_item: data }
})
```

### Get Cart Endpoint
**File:** `server/api/cart/index.get.ts`

```typescript
export default defineEventHandler(async (event) => {
  const user = requireAuth(event)

  const { data: cart_items, error } = await supabase
    .from('cart_items')
    .select(`
      id, quantity, created_at,
      products!inner(id, name, price, category, stock, image_url, users!seller_id(id, full_name))
    `)
    .eq('buyer_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch cart items'
    })
  }

  return { cart_items }
})
```

## Cart Page Implementation

### Shopee-Style Merchant Grouping
The cart page groups items by seller for a better shopping experience:

```typescript
// Safely extract cart items array
const cartItems = computed(() => {
  const data = cartData.value
  if (!data) return []
  // Handle both direct array and wrapped response
  if (Array.isArray(data)) return data
  if (data.cart_items && Array.isArray(data.cart_items)) return data.cart_items
  return []
})

// Shopee-style multi-merchant grouping logic with strict defensive guards
const groupedCart = computed(() => {
  const groups: Record<string, { sellerName: string; items: any[] }> = {}
  
  if (!Array.isArray(cartItems.value)) return groups

  cartItems.value.forEach((item) => {
    // Graceful fallbacks if nested properties are missing or undefined
    const product = item?.products
    const seller = product?.users
    const sellerId = seller?.id || 'unknown_seller'
    const sellerName = seller?.full_name || 'Independent Farmer'

    if (!groups[sellerId]) {
      groups[sellerId] = {
        sellerName,
        items: []
      }
    }
    groups[sellerId].items.push(item)
  })

  return groups
})
```

### Quantity Update
```typescript
async function updateQty(item: any, newQty: number) {
  if (newQty < 1) return
  try {
    await api('/api/cart/add', {
      method: 'POST',
      body: {
        product_id: item.products.id,
        quantity: newQty,
        is_update: true
      }
    })
    refresh()
  } catch (err: any) {
    triggerToast(err.data?.statusMessage || 'Failed to update quantity', 'error')
  }
}
```

### Delete Item
```typescript
async function deleteItem(item: any) {
  try {
    await api(`/api/cart/${item.id}`, {
      method: 'DELETE'
    })
    triggerToast('Removed item from cart.')
    checkedItemIds.value = checkedItemIds.value.filter(id => id !== item.id)
    refresh()
    if (refreshCartCount) refreshCartCount()
  } catch (err: any) {
    triggerToast(err.data?.statusMessage || 'Failed to remove item', 'error')
  }
}
```

## Error Handling

### Common Error Scenarios
1. **Unauthorized (401):** JWT token missing or invalid
2. **Product Not Found (404):** Product ID doesn't exist
3. **Insufficient Stock (400):** Requested quantity exceeds available stock
4. **Server Error (500):** Database or backend failure

### Frontend Error Handling
All API calls are wrapped in try-catch blocks with user-friendly toast notifications:

```typescript
try {
  await api('/api/cart/add', { /* ... */ })
  triggerToast('Success message', 'success')
} catch (err: any) {
  console.error('Error:', err)
  triggerToast(err.data?.statusMessage || 'Generic error message', 'error')
}
```

## Best Practices

### 1. Always Use useApiFetch
Never use raw `$fetch` or `useFetch` without the JWT token injection. Always use `useApiFetch()` for authenticated requests.

### 2. Defensive Property Access
Use optional chaining (`?.`) and null coalescing (`??`) for all reactive property access:

```typescript
// Good
if (!product?.value || product.value.stock === 0) return

// Bad
if (!product.value || product.value.stock === 0) return
```

### 3. Type Checking for Injects
Verify injected functions exist before calling:

```typescript
try {
  if (refreshCartCount && typeof refreshCartCount === 'function') {
    refreshCartCount()
  }
} catch (refreshErr) {
  console.error('Failed to refresh cart count:', refreshErr)
}
```

### 4. Array Type Checking
Always verify arrays before iteration:

```typescript
if (!Array.isArray(cartItems.value)) return groups
```

### 5. Console Error Logging
Log errors for debugging but provide user-friendly messages:

```typescript
console.error('Add to cart error:', err)
triggerToast('Failed to add item to cart', 'error')
```

## Database Schema

### cart_items Table
```sql
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES users(id) NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(buyer_id, product_id)
);
```

### Relationships
- `buyer_id` → `users.id` (the buyer who owns the cart item)
- `product_id` → `products.id` (the product in the cart)
- `products.seller_id` → `users.id` (the seller who owns the product)

## Testing Checklist

- [ ] Add to cart from dashboard
- [ ] Add to cart from categories page
- [ ] Add to cart from product detail page with custom quantity
- [ ] Update quantity in cart
- [ ] Delete item from cart
- [ ] Select multiple items for checkout
- [ ] Checkout selected items
- [ ] Verify JWT token is sent in Authorization header
- [ ] Test with insufficient stock
- [ ] Test with invalid product ID
- [ ] Test with expired JWT token
- [ ] Verify cart count updates in header
- [ ] Test on mobile webview (Capacitor)

## Troubleshooting

### "Cannot read properties of undefined (reading 'value')"
**Cause:** Accessing `.value` on undefined reactive reference
**Solution:** Use optional chaining: `ref?.value` instead of `ref.value`

### 401 Unauthorized
**Cause:** JWT token missing or invalid
**Solution:** Ensure user is logged in and token is stored in `localStorage` with key `sgf_auth_token`

### Cart items not displaying
**Cause:** Backend response structure mismatch
**Solution:** Verify `cartItems` computed handles both array and wrapped response structures

### Cart count not updating
**Cause:** `refreshCartCount` inject not working
**Solution:** Add type checking before calling the inject function

## Related Files

- `app/composables/useApiFetch.ts` - JWT token injection
- `app/composables/useAuth.ts` - Authentication state management
- `server/utils/auth.ts` - Backend JWT verification
- `server/api/cart/add.post.ts` - Add to cart endpoint
- `server/api/cart/index.get.ts` - Get cart endpoint
- `server/api/cart/[id].delete.ts` - Delete cart item endpoint
- `app/pages/buyer/dashboard.vue` - Dashboard with add to cart
- `app/pages/buyer/categories.vue` - Categories with add to cart
- `app/pages/buyer/product/[id].vue` - Product detail with add to cart
- `app/pages/buyer/cart.vue` - Cart page with quantity management
