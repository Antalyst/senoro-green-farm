<template>
  <div class="mx-auto w-full max-w-page space-y-5 py-6 md:space-y-6 md:py-8">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p class="text-sm text-gray-500">{{ products.length }} {{ products.length === 1 ? 'product' : 'products' }} in your shop</p>
      <button type="button" class="ui-btn-accent w-full sm:w-auto" @click="openAddModal">
        <Icon name="heroicons:plus" class="h-4 w-4" />
        Add product
      </button>
    </div>

    <div class="flex flex-col gap-2 sm:flex-row">
      <input
        v-model="searchQuery"
        type="search"
        placeholder="Search products"
        aria-label="Search products"
        class="ui-input sm:flex-1"
      >
      <select v-model="categoryFilter" aria-label="Filter by category" class="ui-input sm:w-56">
        <option value="All">All categories</option>
        <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
      </select>
    </div>

    <div class="ui-card">
      <p v-if="pending" class="py-16 text-center text-sm text-gray-400">Loading…</p>

      <div v-else-if="!filteredProducts.length" class="py-16 text-center">
        <p class="text-sm font-medium text-shop-ink">{{ products.length ? 'No products match' : 'No products yet' }}</p>
        <p class="mt-1 text-xs text-gray-400">{{ products.length ? 'Try another search or category.' : 'Add your first product to start selling.' }}</p>
      </div>

      <ul v-else class="divide-y divide-farm-leaf/10">
        <li v-for="product in filteredProducts" :key="product.id" class="flex gap-3 p-3 md:gap-4 md:p-4">
          <div class="h-16 w-16 flex-shrink-0 overflow-hidden rounded bg-shop-cream">
            <img v-if="product.image_url" :src="product.image_url" :alt="product.name" loading="lazy" class="h-full w-full object-cover">
            <div v-else class="flex h-full w-full items-center justify-center">
              <Icon name="heroicons:photo" class="h-6 w-6 text-gray-300" />
            </div>
          </div>

          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium text-farm-deep">{{ product.name }}</p>
            <p class="truncate text-xs text-gray-400">{{ product.category || 'Uncategorized' }}</p>
            <div class="mt-1.5 flex flex-wrap items-center gap-2">
              <span class="text-sm tabular-nums">
                <span class="font-semibold text-farm-leaf">₱{{ formatPrice(product.price) }}</span>
                <span class="text-gray-400"> / {{ product.unit_type || 'pc' }}</span>
              </span>
              <span :class="stockClass(product.stock)">{{ product.stock === 0 ? 'Sold out' : `${product.stock} in stock` }}</span>
            </div>
          </div>

          <div class="flex flex-shrink-0 flex-col gap-2 sm:flex-row sm:items-start">
            <button type="button" class="ui-icon-btn" title="Edit" :aria-label="`Edit ${product.name}`" @click="openEditModal(product)">
              <Icon name="heroicons:pencil-square" class="h-4 w-4" />
            </button>
            <button type="button" class="ui-icon-btn hover:text-red-600" title="Delete" :aria-label="`Delete ${product.name}`" @click="confirmDelete(product)">
              <Icon name="heroicons:trash" class="h-4 w-4" />
            </button>
          </div>
        </li>
      </ul>
    </div>

    <UiSheet
      :open="showModal"
      :title="isEditing ? 'Edit product' : 'New product'"
      @close="showModal = false"
    >
      <form id="product-form" class="space-y-4" @submit.prevent="saveProduct">
        <div>
          <label for="p-name" class="ui-label">Name</label>
          <input id="p-name" v-model="form.name" type="text" required placeholder="e.g. Organic pechay" class="ui-input">
        </div>

        <div>
          <label for="p-category" class="ui-label">Shop category</label>
          <select id="p-category" v-model="form.category_id" required class="ui-input">
            <option disabled value="">Select a category</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
          <p v-if="!categories.length" class="mt-1.5 text-xs text-red-600">
            Add a shop category on the Dashboard before publishing products.
          </p>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label for="p-price" class="ui-label">Price (₱)</label>
            <input id="p-price" v-model.number="form.price" type="number" inputmode="decimal" step="0.01" min="0.01" required class="ui-input">
          </div>
          <div>
            <label for="p-unit" class="ui-label">Per</label>
            <select id="p-unit" v-model="form.unit_type" class="ui-input">
              <option value="pc">pc</option>
              <option value="kg">kg</option>
              <option value="bundle">bundle</option>
              <option value="serving">serving</option>
            </select>
          </div>
        </div>

        <div>
          <label for="p-stock" class="ui-label">Stock</label>
          <input id="p-stock" v-model.number="form.stock" type="number" inputmode="numeric" min="0" required class="ui-input">
        </div>

        <div>
          <p class="ui-label">Photo</p>
          <div class="flex items-center gap-3">
            <div class="h-16 w-16 flex-shrink-0 overflow-hidden rounded bg-shop-cream">
              <img v-if="form.image_url" :src="form.image_url" alt="Preview" class="h-full w-full object-cover">
              <div v-else class="flex h-full w-full items-center justify-center">
                <Icon name="heroicons:photo" class="h-6 w-6 text-gray-300" />
              </div>
            </div>
            <label class="ui-btn-outline cursor-pointer">
              {{ uploadingImage ? 'Uploading…' : form.image_url ? 'Change photo' : 'Choose photo' }}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                class="sr-only"
                :disabled="uploadingImage"
                @change="onImageSelected"
              >
            </label>
          </div>
        </div>

        <div>
          <label for="p-desc" class="ui-label">Description</label>
          <textarea id="p-desc" v-model="form.description" rows="3" placeholder="Quality, size, where it's from" class="ui-input resize-none" />
        </div>
      </form>

      <template #footer>
        <button
          type="submit"
          form="product-form"
          :disabled="saving || uploadingImage || !categories.length"
          class="ui-btn w-full"
        >
          {{ saving ? 'Saving…' : isEditing ? 'Save changes' : 'Publish' }}
        </button>
      </template>
    </UiSheet>

    <BuyerToast :show="toast.show" :message="toast.message" :type="toast.type" @close="toast.show = false" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'seller' })

interface SellerCategory {
  id: string
  name: string
}

interface SellerProduct {
  id: string
  name: string
  description?: string | null
  price: string | number
  stock: number
  category: string
  category_id?: string | null
  image_url?: string | null
  unit_type?: string
}

const api = useApiFetch()

const searchQuery = ref('')
const categoryFilter = ref('All')

const { data: productsData, pending, refresh } = await useAsyncData(
  'seller:inventory',
  () => api<{ products: SellerProduct[] }>('/api/seller/products'),
  { server: false },
)

const { data: categoriesData, refresh: refreshCategories } = await useAsyncData(
  'seller:inventory-categories',
  () => api<{ categories: SellerCategory[] }>('/api/seller/categories'),
  { server: false },
)

const products = computed(() => productsData.value?.products ?? [])
const categories = computed(() => categoriesData.value?.categories ?? [])

const filteredProducts = computed(() => {
  let list = products.value

  if (categoryFilter.value !== 'All') {
    list = list.filter(product => product.category_id === categoryFilter.value)
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    list = list.filter(product => product.name.toLowerCase().includes(q))
  }

  return list
})

const showModal = ref(false)
const isEditing = ref(false)
const saving = ref(false)
const uploadingImage = ref(false)
const editId = ref<string | null>(null)

const form = ref({
  name: '',
  description: '',
  price: 0,
  stock: 0,
  category_id: '',
  image_url: '' as string | null,
  unit_type: 'pc',
})

const toast = ref({
  show: false,
  message: '',
  type: 'success' as 'success' | 'error',
})

function formatPrice(price: string | number) {
  return parseFloat(String(price ?? 0)).toFixed(2)
}

function stockClass(stock: number) {
  if (stock === 0) return 'ui-pill ui-pill-red'
  if (stock < 10) return 'ui-pill ui-pill-orange'
  return 'ui-pill ui-pill-green'
}

function triggerToast(message: string, type: 'success' | 'error' = 'success') {
  toast.value.message = message
  toast.value.type = type
  toast.value.show = true
  setTimeout(() => {
    toast.value.show = false
  }, 4000)
}

async function openAddModal() {
  await refreshCategories()
  isEditing.value = false
  editId.value = null
  form.value = {
    name: '',
    description: '',
    price: 0,
    stock: 0,
    category_id: categories.value[0]?.id ?? '',
    image_url: null,
    unit_type: 'pc',
  }
  showModal.value = true
}

async function onImageSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  uploadingImage.value = true
  try {
    const reader = new FileReader()
    const base64Promise = new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
    reader.readAsDataURL(file)
    const base64Data = await base64Promise

    const result = await api<{ url: string }>('/api/products/upload', {
      method: 'POST',
      body: {
        image: base64Data,
        filename: file.name,
      },
    })
    form.value.image_url = result.url
    triggerToast('Photo uploaded.')
  }
  catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    triggerToast(e.data?.statusMessage || 'Photo upload failed', 'error')
  }
  finally {
    uploadingImage.value = false
    input.value = ''
  }
}

function openEditModal(product: SellerProduct) {
  isEditing.value = true
  editId.value = product.id
  form.value = {
    name: product.name,
    description: product.description || '',
    price: parseFloat(String(product.price)),
    stock: parseInt(String(product.stock)),
    category_id: product.category_id ?? '',
    image_url: product.image_url ?? null,
    unit_type: product.unit_type ?? 'pc',
  }
  showModal.value = true
}

async function saveProduct() {
  saving.value = true
  try {
    if (isEditing.value && editId.value) {
      await api(`/api/products/update/${editId.value}`, {
        method: 'PUT',
        body: form.value,
      })
      triggerToast('Product updated.')
    }
    else {
      await api('/api/products/create', {
        method: 'POST',
        body: form.value,
      })
      triggerToast('Product published.')
    }
    showModal.value = false
    await refresh()
  }
  catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    triggerToast(e.data?.statusMessage || 'Failed to save product', 'error')
  }
  finally {
    saving.value = false
  }
}

async function confirmDelete(product: SellerProduct) {
  const confirmed = confirm(`Delete "${product.name}"?`)
  if (!confirmed) return

  try {
    await api(`/api/products/delete/${product.id}`, { method: 'DELETE' })
    triggerToast('Product deleted.')
    await refresh()
  }
  catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    triggerToast(e.data?.statusMessage || 'Failed to delete product', 'error')
  }
}

useHead({ title: 'Inventory — NFWM Seller' })
</script>
