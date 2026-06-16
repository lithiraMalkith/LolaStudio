import type {
  Category,
  Customer,
  DashboardStats,
  Order,
  Product,
  CustomRole,
  SiteSettings,
  UserProfile,
} from '@/types'

export interface Message {
  id: string
  uid: string
  name: string
  email: string
  subject: string
  message: string
  status: 'unread' | 'read' | 'archived'
  createdAt: string
  updatedAt: string
}

async function fetchApi<T>(path: string, token: string, options: RequestInit = {}) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    ...options.headers,
  }

  const response = await fetch(path, { ...options, headers })
  const payload = await response.json()

  if (!response.ok || payload.success === false) {
    throw new Error(payload.error || `API fetch failed: ${response.statusText}`)
  }

  return payload.data as T
}

export async function fetchDashboardStats(token: string) {
  return fetchApi<DashboardStats>('/api/dashboard', token)
}

export async function fetchCustomers(token: string) {
  return fetchApi<Customer[]>('/api/customers', token)
}

export async function fetchProducts(token: string, params?: Record<string, string>) {
  const query = params
    ? '?' + new URLSearchParams(params).toString()
    : ''
  return fetchApi<Product[]>(`/api/products${query}`, token)
}

export async function fetchOrders(token: string, params?: Record<string, string>) {
  const query = params
    ? '?' + new URLSearchParams(params).toString()
    : ''
  return fetchApi<Order[]>(`/api/orders${query}`, token)
}

export async function fetchCategories(token: string) {
  return fetchApi<Category[]>('/api/categories', token)
}

export async function fetchUsers(token: string) {
  return fetchApi<UserProfile[]>('/api/users', token)
}

export async function fetchRoles(token: string) {
  return fetchApi<CustomRole[]>('/api/roles', token)
}

export async function fetchMessages(token: string) {
  return fetchApi<Message[]>('/api/messages', token)
}

export async function updateMessageStatus(id: string, status: 'unread' | 'read' | 'archived', token: string) {
  return fetchApi<Message>(`/api/messages/${id}`, token, {
    method: 'PUT',
    body: JSON.stringify({ status })
  })
}

export async function deleteMessage(id: string, token: string) {
  return fetchApi<void>(`/api/messages/${id}`, token, {
    method: 'DELETE'
  })
}

export async function fetchSettings(token: string) {
  return fetchApi<SiteSettings>('/api/settings', token)
}

export async function updateSettings(token: string, settings: SiteSettings) {
  return fetchApi<SiteSettings>('/api/settings', token, {
    method: 'PUT',
    body: JSON.stringify(settings),
  })
}

export async function fetchInventory(token: string) {
  return fetchApi<Product[]>('/api/inventory', token)
}

export async function updateInventoryStock(token: string, productId: string, newStockQty: number) {
  return fetchApi<{ stockQty: number; availabilityStatus: string }>(`/api/inventory/${productId}`, token, {
    method: 'PATCH',
    body: JSON.stringify({ stockQty: newStockQty }),
  })
}

// ========== Order Management Functions ==========

export async function fetchOrder(token: string, orderId: string) {
  return fetchApi<Order>(`/api/orders/${orderId}`, token)
}

export interface UpdateOrderStatusPayload {
  status: 'pending' | 'processing' | 'dispatched' | 'delivered' | 'cancelled'
  note?: string
  cancellationReason?: string
}

export async function updateOrderStatus(
  token: string,
  orderId: string,
  payload: UpdateOrderStatusPayload
) {
  return fetchApi<{ id: string; status: string; previousStatus: string; emailSent: boolean }>(
    `/api/orders/${orderId}`,
    token,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }
  )
}

export interface UpdateOrderDetailsPayload {
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  deliveryAddress?: string
  deliveryCity?: string
  deliveryPostCode?: string
  trackingNumber?: string
  estimatedDeliveryDate?: string
  notes?: string
}

export async function updateOrderDetails(
  token: string,
  orderId: string,
  payload: UpdateOrderDetailsPayload
) {
  return fetchApi<{
    id: string
    message: string
    updatedFields: string[]
  }>(`/api/orders/${orderId}`, token, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

// ========== Order Creation (Admin) ==========

export interface CreateOrderPayload {
  items: Array<{
    productId: string
    productName: string
    sku?: string
    price: number
    quantity: number
    image?: string
  }>
  customer: {
    name: string
    email: string
    phone: string
    uid?: string
  }
  deliveryAddress: {
    addressLine1: string
    addressLine2?: string
    city: string
    district?: string
    postalCode: string
  }
  notes?: string
  deliveryFee?: number
}

export async function createOrder(token: string, payload: CreateOrderPayload) {
  return fetchApi<Order>(`/api/orders`, token, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
