# 🔐 Lola Studio Auth Setup Guide

## Quick Start

### Step 1: Create Test Users
Go to **http://localhost:3000/setup** and create test admin users. This page allows you to:
- Create users with different roles
- Quick presets (Super Admin, Manager, etc.)
- View all created users

### Step 2: Login
Go to **http://localhost:3000/login** and use the credentials you created.

### Step 3 (Optional): Enable Google OAuth
Configure Google Sign-In in Firebase Console (see below).

---

## 🐛 Troubleshooting

### Issue 1: "User not found" error
**Problem:** You get this when trying to login with email/password.

**Cause:** No user exists in Firebase Auth with that email.

**Fix:** 
1. Go to http://localhost:3000/setup
2. Click a "Quick Setup" button (e.g., "Super Admin")
3. Click "Create User"
4. Go to /login and use those credentials

---

### Issue 2: Google OAuth gives 400 error
**Problem:** Clicking "Continue with Google" shows popup error or 400 bad request.

**Cause:** Firebase Console doesn't have the correct OAuth redirect URI configured.

**Fix:**

1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your **Lola Studio** project
3. Go to **Authentication** → **Sign-in method**
4. Click on **Google** provider
5. Make sure it's **Enabled** (toggle is ON)
6. You should see **"Web SDK configuration"** — this is auto-filled
7. Under that, look for **"Authorized JavaScript origins"** and **"Authorized redirect URIs"**

**For Local Development:**
Add these origins:
- `http://localhost:3000`
- `http://localhost:3001`

**For Production:**
Add your domain:
- `https://yourdomain.com`
- `https://www.yourdomain.com`

**Save and wait 5-10 minutes for changes to propagate.**

---

### Issue 3: "Popup blocked" error
**Problem:** Google popup doesn't appear when clicking the button.

**Cause:** Your browser has popup blocking enabled for localhost.

**Fix:**
1. Check browser address bar for popup blocker icon
2. Click it and allow popups for `localhost:3000`
3. Try again

---

### Issue 4: "Google Sign-In not configured" error
**Problem:** You get this error even though Google is enabled.

**Cause:** Firebase credentials in `.env.local` are wrong or incomplete.

**Fix:**
1. Go to Firebase Console → Project Settings (gear icon, top-left)
2. Click **"Service Accounts"** tab
3. Click **"Generate new private key"**
4. A JSON file downloads
5. Copy the values to `.env.local`:
   ```
   FIREBASE_PROJECT_ID=xxx
   FIREBASE_CLIENT_EMAIL=xxx@iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
   ```
6. Restart your dev server: `npm run dev`

---

### Issue 5: "Network error" or "Failed to connect"
**Problem:** Can't login at all, network errors.

**Cause:** 
- Firebase credentials are missing or wrong
- Dev server isn't running
- Internet connection issue

**Fix:**
1. Make sure `.env.local` has all Firebase keys (see above)
2. Check `.env.local` has no typos
3. Restart: `npm run dev`
4. Try `npm install` to ensure dependencies are installed

---

## 📝 User Roles & Permissions

### Built-in Roles

| Role | Permissions | Best For |
|------|-------------|----------|
| **superadmin** | Everything | Full system access |
| **manager** | Products, Orders, Dashboard, Inventory, Categories | Managers |
| **fulfillment** | Orders, Customers | Warehouse staff |
| **support** | Read-only Orders & Customers | Support team |

### What Each Can Do

**Super Admin:**
- Everything
- Manage users & roles
- Configure site settings
- Change other user roles

**Manager:**
- View & edit products
- View & update orders
- View customers
- Manage inventory & categories
- See dashboard

**Fulfillment:**
- View & update orders only
- View customers
- See order details

**Support:**
- View orders (read-only)
- View customers (read-only)

---

## 🔑 Firebase Authentication Methods

### Email & Password
- User enters email + password
- Firebase verifies credentials
- Works offline after initial login (token cached)

### Google OAuth
- User clicks "Continue with Google"
- Redirected to Google login page
- Google confirms identity
- Redirected back to app with token
- Requires Google Sign-In enabled in Firebase Console

---

## 🚀 How It Works Under the Hood

### Login Flow

```
1. User enters credentials at /login
   ↓
2. Clicks "Sign In" or "Continue with Google"
   ↓
3. Firebase Auth verifies user
   ↓
4. ID token created with role in custom claims
   ↓
5. Auth context detects login
   ↓
6. Redirects to /admin (if admin role)
   ↓
7. Admin sidebar shows modules user can access
```

### API Protection

```
1. User makes API request (e.g., GET /api/orders)
   ↓
2. Request includes Authorization header with ID token
   ↓
3. Server verifies token with Firebase Admin SDK
   ↓
4. Checks if role has required permission
   ↓
5. If OK: Process request
   If NOT: Return 403 Forbidden
```

---

## 🛠️ Setup & Configuration

### Environment Variables (.env.local)

**Required:**
```env
# Firebase Client (public, safe for browser)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Firebase Admin (server-side only, NEVER expose)
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

**Optional:**
```env
RESEND_API_KEY=...           # For email notifications
NEXT_PUBLIC_META_PIXEL_ID=... # Facebook Pixel
NEXT_PUBLIC_TIKTOK_PIXEL_ID=...# TikTok Pixel
```

### Get Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click your project
3. Click ⚙️ **Settings** (top-left)
4. Click **"Project settings"** tab
5. Scroll to **"Your apps"**
6. If no app listed, click **"Add app"** → **Web** → Register
7. Copy the config object
8. For Admin SDK: Click **"Service Accounts"** tab → **"Generate new private key"**

---

## 📄 Test User Examples

### Super Admin (All Permissions)
```
Email: admin@lolastudio.com
Password: AdminPassword123!
Role: superadmin
```

### Manager (Products, Orders, etc.)
```
Email: manager@lolastudio.com
Password: ManagerPassword123!
Role: manager
```

### Fulfillment Staff (Orders Only)
```
Email: fulfillment@lolastudio.com
Password: FulfillmentPassword123!
Role: fulfillment
```

### Support Staff (Read-Only)
```
Email: support@lolastudio.com
Password: SupportPassword123!
Role: support
```

---

## 🔒 Security Best Practices

### Development
- ✅ Test users with weak passwords OK
- ✅ Store test creds in password manager
- ✅ /setup endpoint useful for team setup
- ✅ Local Firebase emulator can replace cloud

### Production
- ❌ DELETE /setup endpoint before deploying!
- ❌ Never store passwords in code
- ❌ Never expose Firebase Admin credentials
- ✅ Use strong passwords (Firebase enforces minimum)
- ✅ Enable two-factor authentication for super admins
- ✅ Monitor user login activity
- ✅ Rotate service account keys regularly

---

## 🧪 Testing Auth Flows

### Test Email Login
1. Create test user at /setup
2. Go to /login
3. Enter email & password
4. Should redirect to /admin

### Test Google Login
1. Make sure Google Sign-In enabled in Firebase
2. Make sure redirect URI configured
3. Go to /login
4. Click "Continue with Google"
5. Login with your Google account
6. Should redirect to /admin

### Test Permission Enforcement
1. Create "fulfillment" user
2. Login as fulfillment
3. Try accessing /admin/products
4. Should NOT see Products in sidebar
5. Try accessing /api/products directly
6. Should get 403 Forbidden

---

## 📞 Common Questions

### Q: Can I use the same Google account for multiple roles?
**A:** Yes! Firebase Auth uses the email. You can assign different roles to the same email via Firebase Console or the setup page. Sign out and sign back in to see new role.

### Q: What if I forgot a user's password?
**A:** Go to Firebase Console → Authentication → Users → Click user → Reset password. Firebase sends email link.

### Q: How do I give a user a different role?
**A:** Create a new user with the desired role, OR:
1. Go to Firebase Console → Authentication → Users
2. Click the user
3. There's no direct role editor (since roles are in custom claims)
4. Use `/api/admin/setup` to update, or:
   ```bash
   firebase auth:set-custom-claims user@email.com --role=manager
   ```

### Q: Can I delete users?
**A:** Yes:
1. Firebase Console → Authentication → Users
2. Hover over user → Delete button
3. Or use `/setup` page to view/manage users

---

## 🚀 Next Steps

1. ✅ Create test users at http://localhost:3000/setup
2. ✅ Login at http://localhost:3000/login
3. ✅ Explore /admin dashboard
4. ✅ Try different user roles
5. ✅ Enable Google OAuth (optional)
6. ✅ Delete /setup before production

---

## 📚 More Resources

- [Firebase Auth Docs](https://firebase.google.com/docs/auth)
- [Google Sign-In Integration](https://firebase.google.com/docs/auth/web/google-signin)
- [Firebase Console](https://console.firebase.google.com/)
- [Next.js App Router](https://nextjs.org/docs/app)

---

**Last Updated:** 2026-06-12  
**For:** Lola Studio Admin Panel  
**Questions?** Check error messages at /login for hints!
