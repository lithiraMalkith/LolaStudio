# Lola Studio Admin Panel — Implementation Guide

## Quick Start

### Prerequisites
- Node.js 18+
- Firebase project configured
- Environment variables set up

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Admin panel available at: http://localhost:3000/admin
```

### Environment Variables
Create `.env.local`:
```env
# Firebase Client SDK
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxx

# Firebase Admin SDK (server-side only)
FIREBASE_PROJECT_ID=xxx
FIREBASE_CLIENT_EMAIL=xxx@iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

---

## Authentication & Authorization

### Login Flow

1. **User navigates to `/login`**
   - Can sign in with email+password or Google OAuth
   - Firebase Auth handles credential verification

2. **After successful login:**
   - Firebase ID token issued with custom `role` claim
   - Token stored in browser (Firebase SDK handles automatically)
   - User redirected based on role:
     - **Admin role** → `/admin`
     - **User role** (or no role) → `/` (storefront)

3. **Permission checking:**
   - Auth context (`auth-context.tsx`) resolves role → permissions
   - Sidebar filters nav items by user permissions
   - API routes enforce permissions server-side

### Role & Permission System

#### Built-in Roles (Fixed)
```
superadmin      → ALL permissions
manager         → Products, Orders, Dashboard, Inventory, Categories
fulfillment     → Orders, Customers
support         → Read-only Orders & Customers
```

#### Custom Roles (Super Admin Only)
Super admin can create custom roles with any combination of permissions:

```javascript
// Master Permission Registry
{
  'dashboard:read'
  'products:read', 'products:write', 'products:delete'
  'orders:read', 'orders:write'
  'customers:read', 'customers:write'
  'inventory:read', 'inventory:write'
  'categories:read', 'categories:write', 'categories:delete'
  'roles:read', 'roles:write', 'roles:delete'     // superadmin only
  'users:read', 'users:write'                      // superadmin only
  'settings:read', 'settings:write'                // superadmin only
}
```

### Admin Sidebar
Modules visible only to users with the required permission:
- **Dashboard** (dashboard:read)
- **Products** (products:read)
- **Orders** (orders:read)
- **Customers** (customers:read)
- **Inventory** (inventory:read)
- **Categories** (categories:read)
- **Roles** (roles:read) — superadmin only
- **Users** (users:read) — superadmin only
- **Settings** (settings:read) — superadmin only

---

## Admin Modules

### 1. Dashboard
**Location:** `/admin`
**Permission:** `dashboard:read`

Features:
- Real-time stats (orders, revenue, customers)
- GSAP counter animations
- Activity feed (recent orders, product updates)
- Quick action links
- Revenue summary with charts

**Data fetched from:**
- GET `/api/dashboard` — aggregated stats

### 2. Products
**Location:** `/admin/products`
**Permissions:** `products:read` (view), `products:write` (create/edit), `products:delete` (delete)

Features:
- Searchable product table with filters
- SKU, price, stock quantity, visibility status
- Create/Edit/Delete products
- Publish/Draft toggle
- Stock status indicators (In Stock / Low Stock / Out of Stock)

**Available APIs:**
- GET `/api/products` — list (with category, visibility filters)
- POST `/api/products` — create new product
- GET `/api/products/[id]` — get single product
- PUT `/api/products/[id]` — update product
- DELETE `/api/products/[id]` — delete product

**Product fields:**
- name, description, SKU
- price (LKR)
- category, subCategory
- stockQty, dimensions, material, color, weight
- images[], visibility (published/draft)
- availabilityStatus (computed from stockQty)

### 3. Orders
**Location:** `/admin/orders`
**Permissions:** `orders:read` (view), `orders:write` (update status)

Features:
- Order listing with search (by order ID, customer name/phone)
- Status filtering (pending, processing, dispatched, delivered, cancelled)
- View order details and items
- Update order status with status history tracking
- Status workflow validation

**Available APIs:**
- GET `/api/orders` — list (with status filter)
- GET `/api/orders/[id]` — order details
- PATCH `/api/orders/[id]` — update status with notes
- POST `/api/orders` — create order (checkout)

**Order lifecycle:**
```
pending → processing → dispatched → delivered
  ↓         ↓            ↓
    ← cancelled (any stage)
```

**Status history:** Each status change recorded with timestamp, updated by user, optional notes

### 4. Customers
**Location:** `/admin/customers`
**Permission:** `customers:read` (view), `customers:write` (edit)

Features:
- Customer directory (name, email, phone, address)
- Repeat customer indicator ⭐
- Order count & total spent
- Search by name/phone/email
- Customer status (new/repeat)

**Available APIs:**
- GET `/api/customers` — list with pagination & search
- GET `/api/customers/[id]` — customer profile & order history
- PUT `/api/customers/[id]` — update customer info

**Auto-tracked:** First/last order dates, total spend, repeat customer flag

### 5. Inventory & Categories
**Location:** `/admin/inventory` & `/admin/categories`
**Permissions:** `inventory:read/write`, `categories:read/write/delete`

**Inventory Features:**
- Low stock report (< 3 units)
- Quick stock updates
- Auto availability status updates

**Available APIs:**
- GET `/api/inventory` — low stock products
- PATCH `/api/inventory/[productId]` — update stock qty

**Categories Features:**
- View category hierarchy (category → subCategories)
- Create/Edit/Delete categories
- Reorder categories
- Manage subcategories per category

**Available APIs:**
- GET `/api/categories` — list all
- POST `/api/categories` — create
- PUT `/api/categories/[id]` — update
- DELETE `/api/categories/[id]` — delete

### 6. Roles & Users (Super Admin Only)
**Location:** `/admin/roles` & `/admin/users`
**Permission:** `roles:read/write/delete`, `users:read/write`

**Roles Management:**
- View built-in roles (superadmin, manager, fulfillment, support)
- Create custom roles with permission checkboxes
- Edit custom role permissions
- Delete custom roles
- Permission groups UI (Dashboard, Products, Orders, etc.)

**Available APIs:**
- GET `/api/roles` — list custom roles
- POST `/api/roles` — create custom role
- PUT `/api/roles/[id]` — update role permissions
- DELETE `/api/roles/[id]` — delete role

**Users Management:**
- View all admin users (email, role, created date)
- Invite new users (email + role assignment)
- Change user roles
- Revoke access (deactivate)
- Password management (Firebase handles)

**Available APIs:**
- GET `/api/users` — list users
- POST `/api/users` — invite new user
- PUT `/api/users/[uid]` — update role
- DELETE `/api/users/[uid]` — deactivate user

### 7. Settings (Super Admin Only)
**Location:** `/admin/settings`
**Permission:** `settings:read`, `settings:write`

Features:
- Site configuration (name, description, owner contact)
- Delivery zones & COD fees
- Social media links
- Meta Pixel ID & TikTok Pixel ID
- Email notification preferences

**Available APIs:**
- GET `/api/settings` — current config
- PUT `/api/settings` — update config

---

## Component Architecture

### Key Components

#### `Modal` (`src/components/modal.tsx`)
Reusable modal component with header, content, and action buttons.

```jsx
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Edit Product"
  actions={
    <>
      <Button onClick={handleCancel}>Cancel</Button>
      <Button onClick={handleSave}>Save</Button>
    </>
  }
>
  {/* Content */}
</Modal>
```

#### `Button` (`src/components/button.tsx`)
Styled button with variants: primary, secondary, danger, ghost

```jsx
<Button variant="danger" size="sm" isLoading={loading}>
  Delete
</Button>
```

### Pages Structure
Each admin page follows this pattern:

```
1. Auth check (useAuth hook)
2. GSAP entrance animations
3. Fetch data (useEffect + API call)
4. Render header, filters, table
5. Modal for create/edit
6. Toast notifications for feedback
```

---

## API Routes & Auth

### Authentication Middleware
Every API route uses `withAuth` wrapper:

```typescript
export async function GET(req: NextRequest) {
  return withAuth(req, async (authedReq) => {
    // authedReq.user contains decoded Firebase ID token
    // Access: authedReq.user.uid, authedReq.user.email, authedReq.user.role
  }, 'permission:required')
}
```

### Permission Checking
Authorization happens in two places:

1. **Client-side (UI only):**
   - Hide nav items user can't access
   - `useAuth().hasPermission('permission:name')`

2. **Server-side (enforced):**
   - Every API route checks permission
   - Missing/invalid token → 401 Unauthorized
   - Insufficient permission → 403 Forbidden

### Error Responses
```javascript
// Unauthorized
{ success: false, error: 'Unauthorized — no token provided' } // 401

// Forbidden
{ success: false, error: 'Forbidden — insufficient permissions' } // 403

// Validation error
{ success: false, error: 'Validation failed', details: {...} } // 400

// Server error
{ success: false, error: 'Failed to fetch products' } // 500
```

---

## Firestore Database Schema

```
/users/{uid}
  ├── email: string
  ├── displayName: string
  ├── role: string (superadmin|manager|fulfillment|support|customRoleId)
  ├── phone: string
  ├── isActive: boolean
  ├── createdAt: timestamp
  └── lastLoginAt: timestamp

/products/{id}
  ├── name: string
  ├── description: string
  ├── price: number (LKR)
  ├── stockQty: number
  ├── availabilityStatus: string (in_stock|out_of_stock|low_stock)
  ├── category: string
  ├── subCategory: string
  ├── sku: string (unique)
  ├── images: string[] (Firebase Storage URLs)
  ├── visibility: string (published|draft)
  ├── color: string, material: string, dimensions: string, weight: string
  ├── slug: string
  ├── createdAt: timestamp
  ├── updatedAt: timestamp
  └── createdBy: uid

/orders/{id}
  ├── orderRef: string (unique human-readable ID)
  ├── items: OrderItem[]
  ├── status: string (pending|processing|dispatched|delivered|cancelled)
  ├── customer: { name, email, phone, uid? }
  ├── deliveryAddress: { addressLine1, addressLine2?, city, district, postalCode }
  ├── subtotal: number
  ├── deliveryFee: number
  ├── total: number
  ├── statusHistory: StatusHistoryEntry[]
  ├── notes: string
  ├── cancellationReason: string
  ├── createdAt: timestamp
  ├── updatedAt: timestamp
  └── createdBy: uid (customer)

/categories/{id}
  ├── name: string
  ├── slug: string
  ├── description: string
  ├── subCategories: SubCategory[]
  ├── order: number
  ├── createdAt: timestamp
  └── updatedAt: timestamp

/customers/{id}
  ├── name: string
  ├── email: string
  ├── phone: string
  ├── address: DeliveryAddress
  ├── orderCount: number
  ├── totalSpent: number
  ├── isRepeat: boolean
  ├── firstOrderAt: timestamp
  ├── lastOrderAt: timestamp
  └── createdAt: timestamp

/roles/{id}
  ├── name: string (custom role name)
  ├── permissions: string[]
  ├── createdBy: uid
  ├── createdAt: timestamp
  ├── isCustom: true
  └── (built-in roles are computed, not in DB)

/settings/site
  ├── siteName: string
  ├── siteDescription: string
  ├── ownerEmail: string
  ├── ownerPhone: string
  ├── currency: string
  ├── codEnabled: boolean
  ├── deliveryZones: DeliveryZone[]
  ├── socialLinks: { tiktok?, instagram?, facebook? }
  ├── metaPixelId: string
  └── tiktokPixelId: string
```

---

## Styling & Design

### Color Tokens (Tailwind)
All brand colors defined in `tailwind.config.ts`:

```
brand-bg:       #0D0D0D  (dark background)
brand-surface:  #161616  (cards, panels)
brand-border:   #2A2A2A  (dividers)
brand-gold:     #C9A84C  (primary accent)
brand-muted:    #6B6B6B  (secondary text)
brand-text:     #F0EDE8  (primary text)
brand-danger:   #E05252  (errors)
brand-success:  #4CAF7D  (success)
```

### GSAP Animations
Registered globally in `src/lib/gsap-config.ts`. Used in components via `useGSAP()` hook:

```jsx
useGSAP(() => {
  // Page entrance
  gsap.from(containerRef.current, { opacity: 0, y: 20, duration: 0.5 })
  
  // Staggered rows
  gsap.from('.table-row', { opacity: 0, y: 10, stagger: 0.05 })
  
  // Counter animations
  gsap.to('.counter', {
    innerText: targetValue,
    snap: { innerText: 1 },
    duration: 1.2,
  })
}, { dependencies: [data] })
```

---

## Development Workflow

### Adding a New Admin Page

1. **Create page file:** `/admin/[module]/page.tsx`
2. **Add permission to sidebar:** Update `SIDEBAR_ITEMS` in `layout.tsx`
3. **Create API routes** if needed: `/api/[module]/route.ts`
4. **Add permission checks** to API routes with `withAuth(req, handler, 'module:read')`
5. **Use `useAuth()` hook** for client-side permission checks
6. **Add GSAP animations** for entrance effects
7. **Use `Button` & `Modal` components** for consistency
8. **Add toast notifications** for user feedback

### Example: New Feature Checklist

```
[ ] Permission added to PERMISSIONS constant
[ ] Built-in role permissions updated (if needed)
[ ] API route created with auth middleware
[ ] Admin page created with UI
[ ] GSAP animations added
[ ] Toast notifications for feedback
[ ] Error handling implemented
[ ] Permission checks on client & server
```

---

## Common Tasks

### Updating Order Status
```typescript
const response = await fetch(`/api/orders/${orderId}`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    status: 'dispatched',
    note: 'Handed to courier'
  })
})
```

### Updating Product Stock
```typescript
const response = await fetch(`/api/inventory/${productId}`, {
  method: 'PATCH',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({ newStockQty: 10 })
})
```

### Creating Custom Role
```typescript
const response = await fetch('/api/roles', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({
    name: 'Photography Editor',
    permissions: ['products:read', 'products:write']
  })
})
```

---

## Performance & Optimization

### Current Optimizations
- ✅ Firestore collection pagination (limit queries)
- ✅ Client-side search/filtering where possible
- ✅ GSAP animations use `ease: 'power2.out'` (performant)
- ✅ Images lazy-loaded with `next/image`
- ✅ ISR on product pages (cache strategy)

### Future Optimizations
- [ ] Implement real-time listeners for live updates (Firestore onSnapshot)
- [ ] Add caching layer for read-heavy operations
- [ ] Implement virtual scrolling for large tables
- [ ] Optimize Firestore queries with composite indexes
- [ ] Add service worker for offline support

---

## Troubleshooting

### "Unauthorized — invalid token"
- Check Firebase credentials in `.env.local`
- Ensure token refresh: `await user.getIdToken(true)`
- Check token expiry: tokens expire after 1 hour

### "Forbidden — insufficient permissions"
- User's role doesn't have required permission
- Check `BUILT_IN_ROLE_PERMISSIONS` or custom role doc in Firestore
- Super admin can change user roles at `/admin/users`

### "Failed to fetch [module]"
- Check API route exists at `/api/[module]/route.ts`
- Verify auth middleware is present
- Check browser console for network errors
- Inspect Network tab to see request/response

### GSAP animations not running
- Ensure `@gsap/react` is installed
- Check `gsap-config.ts` registers plugins
- Verify `useGSAP()` has `dependencies` array
- Look for console errors (plugins not loaded)

---

## Next Steps & Roadmap

### Phase 2
- [ ] Email notifications (Resend integration)
- [ ] Product image uploads (Firebase Storage)
- [ ] Order PDF generation
- [ ] WhatsApp order notifications
- [ ] Customer CRM module (tags, segments)

### Phase 3
- [ ] Real-time dashboard updates (Firestore listeners)
- [ ] Bulk order operations
- [ ] CSV/Excel data export
- [ ] Advanced analytics
- [ ] Audit logging

### Phase 4
- [ ] Mobile app admin (React Native)
- [ ] Payment gateway integration
- [ ] Subscription management
- [ ] International shipping zones
- [ ] Multi-language support

---

## Support & Resources

- **Firebase Docs:** https://firebase.google.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **GSAP Docs:** https://greensock.com/docs
- **Tailwind Docs:** https://tailwindcss.com/docs

---

**Last Updated:** 2026-06-12
**Status:** Production-ready with demo data
**Maintained by:** Lithira Gunasekara / Pixzora Lab
