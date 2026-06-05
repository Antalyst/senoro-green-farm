<template>
  <PageContainer class="space-y-12 py-8 md:py-12">
    <header class="border-b border-farm-light pb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      <div>
        <p class="text-[10px] font-medium tracking-[0.2em] uppercase text-farm-dark/45 mb-2">
          Catalog
        </p>
        <h1 class="text-2xl md:text-3xl font-light text-farm-dark tracking-tight">
          Inventory
        </h1>
        <p class="text-sm text-farm-dark/50 mt-2">Manage listings and stock levels</p>
      </div>
      <button
        type="button"
        class="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-farm-deep text-farm-deep text-xs font-medium tracking-[0.12em] uppercase hover:bg-farm-deep hover:text-white transition-colors"
        @click="openAddModal"
      >
        <Icon name="heroicons:plus" class="w-4 h-4 stroke-[1.5]" />
        Add product
      </button>
    </header>

    <section class="flex flex-col sm:flex-row gap-3 border border-farm-light p-4">
      <div class="flex-1 flex items-center border border-farm-light bg-farm-light/30 px-3 py-2 gap-2 min-w-0">
        <Icon name="heroicons:magnifying-glass" class="w-4 h-4 text-farm-dark/35 flex-shrink-0" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search products..."
          class="bg-transparent text-sm text-farm-dark placeholder:text-farm-dark/35 flex-1 outline-none min-w-0"
        >
      </div>
      <select
        v-model="categoryFilter"
        class="text-xs border border-farm-light px-3 py-2 text-farm-dark/70 outline-none bg-white font-medium tracking-wide uppercase"
      >
        <option value="All">All categories</option>
        <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
      </select>
    </section>

    <section class="border border-farm-light">
      <div v-if="pending" class="p-12 text-center text-xs text-farm-dark/40">
        <Icon name="heroicons:arrow-path" class="w-6 h-6 text-farm-leaf animate-spin mx-auto mb-2" />
        Loading inventory...
      </div>

      <div v-else-if="!filteredProducts.length" class="p-12 text-center">
        <p class="text-sm font-medium text-farm-dark">No products yet</p>
        <p class="text-xs text-farm-dark/45 mt-1">Add your first listing to start selling.</p>
      </div>

      <div v-else class="divide-y divide-farm-light">
        <article
          v-for="product in filteredProducts"
          :key="product.id"
          class="p-5 flex gap-4 hover:bg-farm-light/20 transition-colors"
        >
          <div class="w-14 h-14 border border-farm-light flex-shrink-0 flex items-center justify-center bg-farm-light/40">
            <Icon name="heroicons:tag" class="w-6 h-6 text-farm-leaf stroke-[1.5]" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2">
              <h3 class="text-sm font-medium text-farm-dark truncate">{{ product.name }}</h3>
              <span class="text-[10px] font-bold tracking-wider uppercase flex-shrink-0 px-1.5 py-0.5 border text-farm-leaf border-farm-leaf/30 bg-farm-leaf/5">
                {{ product.category || 'Uncategorized' }}
              </span>
            </div>
            <p class="text-xs text-farm-dark/45 line-clamp-1 mt-0.5">
              {{ product.description || 'No description' }}
            </p>
            <div class="flex items-center gap-6 mt-3 text-sm">
              <div>
                <span class="text-[10px] uppercase tracking-wider text-farm-dark/40">Price</span>
                <p class="text-farm-deep font-medium tabular-nums">
                  PHP {{ formatPrice(product.price) }} <span class="text-xs text-farm-dark/50 lowercase">/ {{ product.unit_type || 'pc' }}</span>
                </p>
              </div>
              <div>
                <span class="text-[10px] uppercase tracking-wider text-farm-dark/40">Stock</span>
                <p
                  class="font-medium tabular-nums"
                  :class="product.stock === 0 ? 'text-red-600' : 'text-farm-dark'"
                >
                  {{ product.stock }}
                </p>
              </div>
            </div>
          </div>
          <div class="flex flex-col gap-1 flex-shrink-0">
            <button
              type="button"
              class="p-2 border border-farm-light text-farm-dark/50 hover:text-farm-deep hover:border-farm-deep transition-colors"
              title="Edit"
              @click="openEditModal(product)"
            >
              <Icon name="heroicons:pencil-square" class="w-4 h-4 stroke-[1.5]" />
            </button>
            <button
              type="button"
              class="p-2 border border-farm-light text-farm-dark/50 hover:text-red-600 hover:border-red-200 transition-colors"
              title="Delete"
              @click="confirmDelete(product)"
            >
              <Icon name="heroicons:trash" class="w-4 h-4 stroke-[1.5]" />
            </button>
          </div>
        </article>
      </div>
    </section>

    <Transition name="modal-fade">
      <div v-if="showModal" class="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-farm-dark/40" @click="showModal = false" />
        <div class="modal-panel bg-white border border-farm-light w-full max-w-md relative z-10 flex flex-col max-h-[90vh]">
          <div class="px-5 py-4 border-b border-farm-light flex justify-between items-center">
            <div>
              <h3 class="text-sm font-medium text-farm-dark tracking-tight">
                {{ isEditing ? 'Edit product' : 'New product' }}
              </h3>
              <p class="text-xs text-farm-dark/45 mt-0.5">Listing details</p>
            </div>
            <button type="button" class="p-1 text-farm-dark/50 hover:text-farm-dark" @click="showModal = false">
              <Icon name="heroicons:x-mark" class="w-5 h-5" />
            </button>
          </div>
          <form class="p-5 space-y-4 overflow-y-auto flex-1" @submit.prevent="saveProduct">
            <div class="space-y-1">
              <label class="text-[10px] font-medium tracking-[0.16em] uppercase text-farm-dark/45">Name</label>
              <input
                v-model="form.name"
                type="text"
                required
                placeholder="e.g. Organic Pechay"
                class="w-full border border-farm-light px-3 py-2.5 text-sm outline-none focus:border-farm-deep"
              >
            </div>
            <div class="space-y-1">
              <label class="text-[10px] font-medium tracking-[0.16em] uppercase text-farm-dark/45">Shop category</label>
              <select
                v-model="form.category_id"
                required
                class="w-full border border-farm-light px-3 py-2.5 text-sm outline-none focus:border-farm-deep bg-white"
              >
                <option disabled value="">Select a shop category</option>
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
              </select>
              <p v-if="!categories.length" class="text-[10px] text-red-600">
                Add a shop category on the Seller Dashboard before publishing products.
              </p>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="text-[10px] font-medium tracking-[0.16em] uppercase text-farm-dark/45">Price (PHP)</label>
                <div class="flex items-center">
                  <input
                    v-model.number="form.price"
                    type="number"
                    step="0.01"
                    required
                    min="0.01"
                    class="w-full border border-farm-light border-r-0 px-3 py-2.5 text-sm outline-none focus:border-farm-deep"
                  >
                  <select
                    v-model="form.unit_type"
                    class="border border-farm-light px-2 py-2.5 text-sm outline-none focus:border-farm-deep bg-farm-light/20 text-farm-dark/70"
                  >
                    <option value="pc">/ pc</option>
                    <option value="kg">/ kg</option>
                    <option value="bundle">/ bundle</option>
                    <option value="serving">/ serving</option>
                  </select>
                </div>
              </div>
              <div class="space-y-1">
                <label class="text-[10px] font-medium tracking-[0.16em] uppercase text-farm-dark/45">Stock</label>
                <input
                  v-model.number="form.stock"
                  type="number"
                  required
                  min="0"
                  class="w-full border border-farm-light px-3 py-2.5 text-sm outline-none focus:border-farm-deep"
                >
              </div>
            </div>
            <div class="space-y-1">
              <label class="text-[10px] font-medium tracking-[0.16em] uppercase text-farm-dark/45">Product image</label>
              <div class="border border-farm-light p-3 flex items-center gap-3">
                <div v-if="form.image_url" class="w-14 h-14 border border-farm-light overflow-hidden flex-shrink-0">
                  <img :src="form.image_url" alt="Preview" class="w-full h-full object-cover">
                </div>
                <input
                  type="file"
                  accept="image/*"
                  class="text-xs text-farm-dark/60"
                  @change="onImageSelected"
                >
              </div>
              <p v-if="uploadingImage" class="text-[10px] text-farm-leaf">Uploading image...</p>
            </div>
            <div class="space-y-1">
              <label class="text-[10px] font-medium tracking-[0.16em] uppercase text-farm-dark/45">Description</label>
              <textarea
                v-model="form.description"
                rows="3"
                placeholder="Quality, size, origin..."
                class="w-full border border-farm-light px-3 py-2.5 text-sm outline-none focus:border-farm-deep resize-none"
              />
            </div>
            <button
              type="submit"
              :disabled="saving || !categories.length"
              class="w-full bg-farm-deep text-white py-3 text-xs font-medium tracking-[0.12em] uppercase hover:bg-farm-leaf transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Icon v-if="saving" name="heroicons:arrow-path" class="w-4 h-4 animate-spin" />
              <span>{{ isEditing ? 'Save changes' : 'Publish' }}</span>
            </button>
          </form>
        </div>
      </div>
    </Transition>

    <Transition name="slide-up">
      <div
        v-if="toast.show"
        class="fixed bottom-24 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-page z-[60] px-4"
      >
        <div
          class="p-4 border flex items-center gap-3 text-sm font-medium"
          :class="toast.type === 'success' ? 'bg-farm-deep text-white border-farm-deep' : 'bg-red-600 text-white border-red-600'"
        >
          <Icon :name="toast.type === 'success' ? 'heroicons:check-circle' : 'heroicons:exclamation-circle'" class="w-5 h-5 flex-shrink-0" />
          <span class="flex-1">{{ toast.message }}</span>
          <button type="button" class="p-1 opacity-80 hover:opacity-100" @click="toast.show = false">
            <Icon name="heroicons:x-mark" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </Transition>
  </PageContainer>
</template>

<script setup lang="ts">
import PageContainer from '~/components/ui/PageContainer.vue'

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

const categories = computed(() => categoriesData.value?.categories ?? [])

const filteredProducts = computed(() => {
  let list = productsData.value?.products ?? []

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
    triggerToast('Image uploaded.')
  }
  catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    triggerToast(e.data?.statusMessage || 'Image upload failed', 'error')
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
      triggerToast('Product updated successfully.')
    }
    else {
      await api('/api/products/create', {
        method: 'POST',
        body: form.value,
      })
      triggerToast('Product listed successfully.')
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
  const confirmed = confirm(`Are you sure you want to delete "${product.name}"?`)
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

useHead({ title: 'Manage Inventory - Senoro Green Farm' })
</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
.modal-fade-enter-active .modal-panel,
.modal-fade-leave-active .modal-panel {
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.modal-fade-enter-from .modal-panel {
  transform: scale(0.95) translateY(10px);
}
.modal-fade-leave-to .modal-panel {
  transform: scale(0.95) translateY(10px);
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
