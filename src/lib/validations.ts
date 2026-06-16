import { z } from 'zod'

// --- Product Validation ---
export const productSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters').max(120),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
  price: z.number().positive('Price must be positive'),
  dimensions: z.string().optional(),
  material: z.string().optional(),
  color: z.string().optional(),
  weight: z.string().optional(),
  stockQty: z.number().int().min(0, 'Stock cannot be negative'),
  category: z.string().min(1, 'Category is required'),
  subCategory: z.string().min(1, 'Sub-category is required'),
  visibility: z.enum(['published', 'draft']),
  sku: z.string().min(1, 'SKU is required'),
  images: z.array(z.string()).optional(),
  cost: z.number().min(0).optional(),
})

export type ProductFormData = z.infer<typeof productSchema>

// --- Order Validation ---
export const checkoutSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().regex(/^(?:\+94|0)\d{9}$/, 'Enter a valid Sri Lankan phone number'),
  addressLine1: z.string().min(5, 'Address is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  district: z.string().min(2, 'District is required'),
  postalCode: z.string().min(4, 'Postal code is required'),
  notes: z.string().max(500).optional(),
})

export type CheckoutFormData = z.infer<typeof checkoutSchema>

// --- Category Validation ---
export const categorySchema = z.object({
  name: z.string().min(2, 'Category name is required').max(60),
  description: z.string().max(200).optional(),
})

export type CategoryFormData = z.infer<typeof categorySchema>

export const subCategorySchema = z.object({
  name: z.string().min(2, 'Sub-category name is required').max(60),
  description: z.string().max(200).optional(),
})

// --- Role Validation ---
export const customRoleSchema = z.object({
  name: z.string().min(2, 'Role name is required').max(40),
  permissions: z.array(z.string()).min(1, 'Select at least one permission'),
})

export type CustomRoleFormData = z.infer<typeof customRoleSchema>

// --- User Invite Validation ---
export const userInviteSchema = z.object({
  email: z.string().email('Valid email is required'),
  displayName: z.string().min(2, 'Display name is required'),
  role: z.string().min(1, 'Role is required'),
})

export type UserInviteFormData = z.infer<typeof userInviteSchema>

// --- Settings Validation ---
export const deliveryZoneSchema = z.object({
  name: z.string().min(2, 'Zone name is required'),
  fee: z.number().min(0, 'Fee cannot be negative'),
  isActive: z.boolean(),
})

export const siteSettingsSchema = z.object({
  siteName: z.string().min(1),
  siteDescription: z.string().max(300),
  ownerEmail: z.string().email(),
  ownerPhone: z.string(),
  codEnabled: z.boolean(),
  socialLinks: z.object({
    tiktok: z.string().optional(),
    instagram: z.string().optional(),
    facebook: z.string().optional(),
  }),
  metaPixelId: z.string().optional(),
  tiktokPixelId: z.string().optional(),
})
