---
name: firebase-admin-auth
description: Create a secure, invite-only backend admin panel using Firebase Authentication, Firestore, and Next.js. Use this skill when the user asks to build an admin panel, secure backend, or role-based access control system.
license: Complete terms in LICENSE.txt
---

This skill guides the creation of a secure, production-grade Firebase Authentication system tailored for internal admin panels or closed-loop applications. 

When building an admin panel, **open registration must be strictly disabled**. Google Login or Email Login should act purely as an authentication mechanism, not a registration mechanism.

The user provides requirements for an admin panel or role-based system. Implement the following architecture:

## Architecture Thinking

Before coding, understand the core security model of a closed-loop Firebase system:
- **Single Source of Truth**: The Firestore `users` collection dictates who has access and what their role is.
- **Custom Claims**: Firebase Auth custom claims (`token.role`) are used on the client-side and in security rules to enforce access.
- **The Sync Problem**: Manually updating a user's role in Firestore DOES NOT update their Firebase Custom Claims. Google Sign-In also does not automatically sync with Firestore.
- **The Solution**: An `/api/auth/sync` endpoint that bridges Firebase Auth and Firestore immediately upon login.

## Implementation Guidelines

Follow this exact pattern to build a robust admin authentication system:

### 1. The Sync API (`/api/auth/sync/route.ts`)
Create a Next.js API route that the frontend calls immediately after a user authenticates with Firebase client SDK.
- Receive the Firebase ID Token via `Authorization: Bearer <token>`.
- Verify the token using `firebase-admin`.
- Look up the user's UID in the Firestore `users` collection.
- **Security Rejection**: If the user does not exist in Firestore (i.e., they were not invited), immediately delete their stray Firebase Auth profile using `adminAuth.deleteUser(uid)` and return a `403 Forbidden` response.
- **Role Synchronization**: If the user exists, compare their Firestore `role` with their token's custom claims. If they differ, update the custom claims using `adminAuth.setCustomUserClaims(uid, { role: dbRole })`.

### 2. Frontend Auth Context (`auth-context.tsx`)
Build a React Context that wraps the application and handles the sync flow:
- **Use `onIdTokenChanged`**: Never use `onAuthStateChanged`. Use `onIdTokenChanged` so the frontend state automatically reacts to token refreshes when custom claims are updated.
- **The Login Flow**: 
  1. Call `signInWithPopup` (Google) or `signInWithEmailAndPassword`.
  2. Await the result and immediately get the token.
  3. POST the token to `/api/auth/sync`.
  4. If the sync succeeds and claims were updated, force a token refresh: `await result.user.getIdToken(true)`. This triggers `onIdTokenChanged` and logs the user in with their correct role.
  5. If the sync fails (403 Forbidden), immediately sign the user out `firebaseSignOut(auth)` and throw an error to display on the UI.

### 3. UI/UX Considerations
- **Terminology**: Use "Login with Google" instead of "Continue with Google" or "Sign Up with Google" to reinforce that this is a closed system.
- **Error Handling**: Gracefully handle the rejection error on the login page: *"Access denied. You must be invited by an administrator to access this system."*

### 4. Admin Management APIs
- Create APIs (`/api/users`) that allow Superadmins to invite new users.
- Inviting a user should: Create the Firebase Auth user, set their custom claims, create their Firestore document, and send a password reset link (invite link).

**CRITICAL**: Never rely solely on client-side logic for authorization. The `/api/auth/sync` is mandatory to ensure that manual database modifications are strictly enforced by Firebase Auth custom claims across the entire platform.
