// ==========================================
// Lola Studio — Permission & Role System
// ==========================================

// Master Permission Registry
export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_READ: 'dashboard:read',

  // Products
  PRODUCTS_READ: 'products:read',
  PRODUCTS_WRITE: 'products:write',
  PRODUCTS_DELETE: 'products:delete',

  // Orders
  ORDERS_READ: 'orders:read',
  ORDERS_WRITE: 'orders:write',
  ORDERS_CREATE: 'orders:create',

  // Customers
  CUSTOMERS_READ: 'customers:read',
  CUSTOMERS_WRITE: 'customers:write',

  // Inventory
  INVENTORY_READ: 'inventory:read',
  INVENTORY_WRITE: 'inventory:write',

  // Categories
  CATEGORIES_READ: 'categories:read',
  CATEGORIES_WRITE: 'categories:write',
  CATEGORIES_DELETE: 'categories:delete',

  // Messages
  MESSAGES_READ: 'messages:read',
  MESSAGES_WRITE: 'messages:write',
  MESSAGES_DELETE: 'messages:delete',

  // Roles — superadmin only
  ROLES_READ: 'roles:read',
  ROLES_WRITE: 'roles:write',
  ROLES_DELETE: 'roles:delete',

  // Users — superadmin only
  USERS_READ: 'users:read',
  USERS_WRITE: 'users:write',

  // Settings — superadmin only
  SETTINGS_READ: 'settings:read',
  SETTINGS_WRITE: 'settings:write',
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

// All permissions as a flat array (for UI dropdowns / role editor)
export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS)

// Permission display names for admin UI
export const PERMISSION_LABELS: Record<Permission, string> = {
  'dashboard:read': 'View Dashboard',
  'products:read': 'View Products',
  'products:write': 'Create/Edit Products',
  'products:delete': 'Delete Products',
  'orders:read': 'View Orders',
  'orders:write': 'Update Order Status',
  'orders:create': 'Create Orders',
  'customers:read': 'View Customers',
  'customers:write': 'Edit Customers',
  'inventory:read': 'View Inventory',
  'inventory:write': 'Update Stock',
  'categories:read': 'View Categories',
  'categories:write': 'Create/Edit Categories',
  'categories:delete': 'Delete Categories',
  'roles:read': 'View Roles',
  'roles:write': 'Create/Edit Roles',
  'roles:delete': 'Delete Roles',
  'users:read': 'View Users',
  'users:write': 'Manage Users',
  'settings:read': 'View Settings',
  'settings:write': 'Edit Settings',
  'messages:read': 'View Messages',
  'messages:write': 'Reply/Update Messages',
  'messages:delete': 'Delete Messages',
}

// Group permissions by module (for role editor UI)
export const PERMISSION_GROUPS: Record<string, Permission[]> = {
  Dashboard: [PERMISSIONS.DASHBOARD_READ],
  Products: [PERMISSIONS.PRODUCTS_READ, PERMISSIONS.PRODUCTS_WRITE, PERMISSIONS.PRODUCTS_DELETE],
  Orders: [PERMISSIONS.ORDERS_READ, PERMISSIONS.ORDERS_WRITE, PERMISSIONS.ORDERS_CREATE],
  Customers: [PERMISSIONS.CUSTOMERS_READ, PERMISSIONS.CUSTOMERS_WRITE],
  Inventory: [PERMISSIONS.INVENTORY_READ, PERMISSIONS.INVENTORY_WRITE],
  Categories: [PERMISSIONS.CATEGORIES_READ, PERMISSIONS.CATEGORIES_WRITE, PERMISSIONS.CATEGORIES_DELETE],
  Roles: [PERMISSIONS.ROLES_READ, PERMISSIONS.ROLES_WRITE, PERMISSIONS.ROLES_DELETE],
  Users: [PERMISSIONS.USERS_READ, PERMISSIONS.USERS_WRITE],
  Settings: [PERMISSIONS.SETTINGS_READ, PERMISSIONS.SETTINGS_WRITE],
  Messages: [PERMISSIONS.MESSAGES_READ, PERMISSIONS.MESSAGES_WRITE, PERMISSIONS.MESSAGES_DELETE],
}

// Built-in Role Permissions (fixed — cannot be edited)
export const BUILT_IN_ROLE_PERMISSIONS: Record<string, Permission[]> = {
  superadmin: ALL_PERMISSIONS, // bypasses checks entirely, but listed for completeness
  manager: [
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.PRODUCTS_READ,
    PERMISSIONS.PRODUCTS_WRITE,
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.ORDERS_WRITE,
    PERMISSIONS.CUSTOMERS_READ,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.INVENTORY_WRITE,
    PERMISSIONS.CATEGORIES_READ,
    PERMISSIONS.MESSAGES_READ,
    PERMISSIONS.MESSAGES_WRITE,
    PERMISSIONS.MESSAGES_DELETE,
  ],
  fulfillment: [
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.ORDERS_WRITE,
    PERMISSIONS.CUSTOMERS_READ,
  ],
  support: [
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.CUSTOMERS_READ,
    PERMISSIONS.MESSAGES_READ,
    PERMISSIONS.MESSAGES_WRITE,
  ],
}

export const BUILT_IN_ROLE_LABELS: Record<string, string> = {
  superadmin: 'Super Admin',
  manager: 'Manager',
  fulfillment: 'Fulfillment Staff',
  support: 'Support Staff',
}

export function isBuiltInRole(role: string): boolean {
  return role in BUILT_IN_ROLE_PERMISSIONS
}
