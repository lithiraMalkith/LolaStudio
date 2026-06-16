import { adminDb, adminAuth } from '@/lib/firebase-admin'
import { BUILT_IN_ROLE_PERMISSIONS } from '@/lib/permissions'
import type { UserProfile, CustomRole } from '@/types'

/**
 * Get user profile with resolved permissions from Firestore
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const doc = await adminDb.collection('users').doc(uid).get()
    return (doc.data() as UserProfile) || null
  } catch {
    return null
  }
}

/**
 * Create a new user with role assignment
 */
export async function createUserWithRole(
  email: string,
  password: string,
  displayName: string,
  role: string
): Promise<{ uid: string; email: string }> {
  const userRecord = await adminAuth.createUser({
    email,
    password,
    displayName,
  })

  // Set custom claims
  await adminAuth.setCustomUserClaims(userRecord.uid, { role })

  // Save profile to Firestore
  const profile: UserProfile = {
    uid: userRecord.uid,
    email,
    displayName,
    role,
    createdAt: new Date(),
    isActive: true,
  }

  await adminDb.collection('users').doc(userRecord.uid).set(profile)

  return { uid: userRecord.uid, email }
}

/**
 * Update user role and custom claims
 */
export async function updateUserRole(uid: string, role: string): Promise<void> {
  await adminAuth.setCustomUserClaims(uid, { role })
  await adminDb.collection('users').doc(uid).update({ role, updatedAt: new Date() })
}

/**
 * Get all users with their profiles
 */
export async function getAllUsers(): Promise<UserProfile[]> {
  const snapshot = await adminDb.collection('users').get()
  return snapshot.docs.map((doc) => doc.data() as UserProfile)
}

/**
 * Create custom role
 */
export async function createCustomRole(
  name: string,
  permissions: string[],
  createdBy: string
): Promise<CustomRole> {
  const role: CustomRole = {
    id: Math.random().toString(36).substr(2, 9),
    name,
    permissions,
    createdBy,
    createdAt: new Date(),
    isCustom: true,
  }

  await adminDb.collection('roles').doc(role.id).set(role)
  return role
}

/**
 * Get custom role by ID
 */
export async function getCustomRole(roleId: string): Promise<CustomRole | null> {
  const doc = await adminDb.collection('roles').doc(roleId).get()
  return (doc.data() as CustomRole) || null
}

/**
 * Get all custom roles
 */
export async function getAllCustomRoles(): Promise<CustomRole[]> {
  const snapshot = await adminDb.collection('roles').where('isCustom', '==', true).get()
  return snapshot.docs.map((doc) => doc.data() as CustomRole)
}

/**
 * Delete custom role
 */
export async function deleteCustomRole(roleId: string): Promise<void> {
  await adminDb.collection('roles').doc(roleId).delete()
}
