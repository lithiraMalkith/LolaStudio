// ==========================================
// Lola Studio — Type Definitions
// ==========================================

// --- Auth & Roles ---
export type BuiltInRole = 'superadmin' | 'manager' | 'fulfillment' | 'support'

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  photoURL?: string
  role: BuiltInRole | string
  phone?: string
  createdAt: Date
  lastLoginAt?: Date
  isActive: boolean
}

export interface CustomRole {
  id: string
  name: string
  permissions: string[]
  createdBy: string
  createdAt: Date
  isCustom: true
}

// --- Products ---
export type VisibilityStatus = 'published' | 'draft'
export type AvailabilityStatus = 'in_stock' | 'out_of_stock' | 'low_stock'

export interface Product {
  cost: number | null | undefined
  id: string
  name: string
  description: string
  price: number
  dimensions?: string
  material?: string
  color?: string
  weight?: string
  stockQty: number
  images: string[]
  category: string
  subCategory: string
  availabilityStatus: AvailabilityStatus
  sku: string
  visibility: VisibilityStatus
  slug: string
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

// --- Categories ---
export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  subCategories: SubCategory[]
  order: number
  createdAt: Date
  updatedAt: Date
}

export interface SubCategory {
  id: string
  name: string
  slug: string
  description?: string
}

// --- Orders ---
export type OrderStatus = 'pending' | 'processing' | 'dispatched' | 'delivered' | 'cancelled'

export interface OrderItem {
  productId: string
  productName: string
  sku: string
  price: number
  quantity: number
  image?: string
}

export interface Order {
  id: string
  orderRef: string
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  total: number
  status: OrderStatus
  customer: CustomerInfo
  deliveryAddress: DeliveryAddress
  notes?: string
  cancellationReason?: string
  trackingNumber?: string
  estimatedDeliveryDate?: string
  statusHistory: StatusHistoryEntry[]
  createdAt: Date
  updatedAt: Date
}

export interface CustomerInfo {
  name: string
  email: string
  phone: string
  uid?: string
}

export interface DeliveryAddress {
  addressLine1: string
  addressLine2?: string
  city: string
  district: string
  postalCode: string
}

export interface StatusHistoryEntry {
  status: OrderStatus
  timestamp: Date
  updatedBy: string
  note?: string
}

// --- Customers ---
export type VerificationStatus = 'unverified' | 'verified' | 'suspended'

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  address?: DeliveryAddress
  orderCount: number
  totalSpent: number
  isRepeat: boolean
  firstOrderAt?: Date
  lastOrderAt?: Date
  createdAt: Date
  verificationStatus?: VerificationStatus
}

// --- Dashboard ---
export interface DashboardStats {
  ordersToday: number
  ordersThisWeek: number
  ordersThisMonth: number
  revenueToday: number
  revenueThisWeek: number
  revenueThisMonth: number
  pendingOrders: number
  lowStockProducts: number
  totalProducts: number
  totalCustomers: number
}

export interface ActivityEntry {
  id: string
  type: 'order' | 'product' | 'user' | 'system'
  message: string
  timestamp: Date
  userId?: string
}

// --- Settings ---
export interface SiteSettings {
  siteName: string
  siteDescription: string
  ownerEmail: string
  ownerPhone: string
  currency: string
  codEnabled: boolean
  deliveryZones: DeliveryZone[]
  socialLinks: {
    tiktok?: string
    instagram?: string
    facebook?: string
  }
  metaPixelId?: string
  tiktokPixelId?: string
}

export interface DeliveryZone {
  id: string
  name: string
  fee: number
  isActive: boolean
}

// --- API ---
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// --- Pagination ---
export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}
