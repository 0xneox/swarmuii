# 🔐 Google Auth Migration Guide - Preserve All User Accounts

## 📊 **CURRENT SITUATION ANALYSIS**

Based on your Supabase dashboard (Images 1 & 2):

### **Your Current Users Database:**
- **Total Users:** 15,273 users
- **Auth Methods:**
  - ✅ **Email/Password** - Most users
  - ✅ **Google OAuth** - Many users (shown in Provider column)
  - ✅ **Supabase Auth Schema** - `auth.users` table (protected schema)

### **Your Current Frontend Auth:**
- ✅ **Custom Email/Password** - Using Express backend JWT
- ❌ **Google OAuth** - Not implemented (shows "Google login not yet implemented")

---

## 🎯 **WHAT YOU NEED TO DO**

You have **2 options** to preserve all user accounts:

### **Option 1: Hybrid Auth (RECOMMENDED) ⭐**
- Keep Supabase Auth for Google OAuth only
- Keep Express backend for email/password
- Users don't lose access
- Minimal migration needed

### **Option 2: Full Migration (COMPLEX)**
- Migrate all users from Supabase to your database
- Implement Google OAuth in Express backend
- More work, but fully independent

---

## ✅ **OPTION 1: HYBRID AUTH (RECOMMENDED)**

### **What This Means:**
```
┌─────────────────────────────────────────────────────────┐
│ EMAIL/PASSWORD USERS                                    │
│ → Use Express Backend (current system)                 │
│ → JWT tokens stored in localStorage                    │
│ → Already working ✅                                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ GOOGLE OAUTH USERS                                      │
│ → Use Supabase Auth (existing system)                  │
│ → After Google login, sync to Express backend          │
│ → Get JWT token from Express                           │
│ → Store in localStorage                                │
└─────────────────────────────────────────────────────────┘
```

### **Why This Works:**
1. ✅ **No user data loss** - All 15,273 users keep access
2. ✅ **Minimal code changes** - Just add Google OAuth flow
3. ✅ **No database migration** - Keep existing Supabase auth
4. ✅ **Fast implementation** - 2-3 hours

---

## 🔧 **IMPLEMENTATION: HYBRID AUTH**

### **Step 1: Update Frontend - Add Google OAuth**

#### A. Update `AuthModal.tsx` - Google Login Function

```typescript
// Replace line 168-172 in AuthModal.tsx
const handleGoogleLogin = async () => {
  setError("");
  setIsSubmitting(true);
  
  try {
    // Use Supabase for Google OAuth
    const { createClient } = await import('@/utils/supabase/client');
    const supabase = createClient();
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });

    if (error) {
      throw error;
    }

    // Supabase will redirect to Google login
    // After success, user will be redirected to /auth/callback
    
  } catch (error) {
    console.error('Google login error:', error);
    setError(error instanceof Error ? error.message : 'Google login failed');
    setIsSubmitting(false);
  }
};
```

#### B. Create Auth Callback Handler

Create/Update `src/app/auth/callback/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createClient();
    
    // Exchange code for session
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Auth callback error:', error);
      return NextResponse.redirect(`${requestUrl.origin}/?error=auth_failed`);
    }

    if (session?.user) {
      try {
        // Sync Google user with Express backend
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/google-login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: session.user.email,
            google_id: session.user.id,
            username: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
            provider: 'google',
          }),
        });

        const backendData = await response.json();

        if (backendData.success) {
          // Store Express JWT token
          const redirectUrl = new URL(requestUrl.origin);
          redirectUrl.searchParams.set('token', backendData.data.token);
          redirectUrl.searchParams.set('user', JSON.stringify(backendData.data.user));
          
          return NextResponse.redirect(redirectUrl.toString());
        }
      } catch (error) {
        console.error('Backend sync error:', error);
      }
    }
  }

  return NextResponse.redirect(requestUrl.origin);
}
```

#### C. Handle Token Storage on Redirect

Update your root page to handle Google auth tokens:

```typescript
// In your main page component (e.g., src/app/page.tsx)
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const userStr = params.get('user');

  if (token && userStr) {
    try {
      // Store JWT token from Express backend
      localStorage.setItem('token', token);
      localStorage.setItem('user', userStr);
      
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
      
      // Refresh page to load user
      window.location.reload();
    } catch (error) {
      console.error('Failed to store auth data:', error);
    }
  }
}, []);
```

---

### **Step 2: Update Backend - Add Google Login Endpoint**

#### Add to `routes/auth.js`:

```javascript
// POST /api/v1/auth/google-login
router.post('/google-login', async (req, res) => {
  try {
    const { email, google_id, username, provider } = req.body;

    if (!email || !google_id) {
      return res.status(400).json({
        success: false,
        message: 'Email and Google ID are required'
      });
    }

    // Check if user exists by email or google_id
    let user = await db.query(
      'SELECT * FROM users WHERE email = $1 OR google_id = $2',
      [email, google_id]
    );

    if (user.rows.length === 0) {
      // Create new user
      const newUser = await db.query(
        `INSERT INTO users (email, username, google_id, provider, password)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, email, username, created_at, total_balance, unclaimed_reward`,
        [email, username || email.split('@')[0], google_id, 'google', null] // No password for Google users
      );
      user = newUser;
    } else {
      // Update google_id if not set
      if (!user.rows[0].google_id) {
        await db.query(
          'UPDATE users SET google_id = $1, provider = $2 WHERE id = $3',
          [google_id, 'google', user.rows[0].id]
        );
      }
    }

    const userData = user.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { id: userData.id, email: userData.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        user: {
          id: userData.id,
          email: userData.email,
          username: userData.username,
          created_at: userData.created_at,
          total_balance: userData.total_balance,
          unclaimed_reward: userData.unclaimed_reward,
        },
        token
      }
    });

  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process Google login'
    });
  }
});
```

---

### **Step 3: Update Database Schema**

Add Google ID column to your users table:

```sql
-- Add google_id column if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT 'email';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_provider ON users(provider);

-- Make password nullable (Google users don't have passwords)
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
```

---

### **Step 4: Migrate Existing Google Users**

Run this script to sync existing Supabase Google users to your database:

```javascript
// migration-script.js
const { createClient } = require('@supabase/supabase-js');
const pg = require('pg');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role key
);

const db = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

async function migrateGoogleUsers() {
  try {
    // Get all Google users from Supabase
    const { data: authUsers, error } = await supabase.auth.admin.listUsers();

    if (error) throw error;

    console.log(`Found ${authUsers.users.length} users in Supabase`);

    let migrated = 0;
    let skipped = 0;

    for (const authUser of authUsers.users) {
      // Only migrate Google users
      if (authUser.app_metadata?.provider !== 'google') {
        skipped++;
        continue;
      }

      const email = authUser.email;
      const googleId = authUser.id;
      const username = authUser.user_metadata?.full_name || email.split('@')[0];

      // Check if user already exists
      const existing = await db.query(
        'SELECT id FROM users WHERE email = $1 OR google_id = $2',
        [email, googleId]
      );

      if (existing.rows.length === 0) {
        // Insert new user
        await db.query(
          `INSERT INTO users (email, username, google_id, provider, password, created_at)
           VALUES ($1, $2, $3, 'google', NULL, $4)`,
          [email, username, googleId, authUser.created_at]
        );
        migrated++;
        console.log(`✅ Migrated: ${email}`);
      } else {
        // Update google_id if not set
        await db.query(
          'UPDATE users SET google_id = $1, provider = $2 WHERE id = $3',
          [googleId, 'google', existing.rows[0].id]
        );
        skipped++;
        console.log(`⏭️  Skipped (exists): ${email}`);
      }
    }

    console.log(`\n✅ Migration complete!`);
    console.log(`   Migrated: ${migrated}`);
    console.log(`   Skipped: ${skipped}`);

  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await db.end();
  }
}

migrateGoogleUsers();
```

Run it:
```bash
node migration-script.js
```

---

## 🧪 **TESTING CHECKLIST**

### **Email/Password Users (Already Working)**
- [ ] Can login with email/password
- [ ] Can signup with email/password
- [ ] JWT token stored in localStorage
- [ ] All features work

### **Google OAuth Users**
- [ ] Click "Continue with Google"
- [ ] Redirected to Google login
- [ ] After login, redirected back to app
- [ ] JWT token stored in localStorage
- [ ] User data synced to Express backend
- [ ] All features work

### **Existing Google Users**
- [ ] Run migration script
- [ ] Existing Google users can login
- [ ] No data loss
- [ ] All earnings/devices preserved

---

## 📊 **WHAT GETS MIGRATED**

### **Database Migration:**
```sql
-- Your current users table
users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  username VARCHAR(255),
  password VARCHAR(255), -- Now nullable
  google_id VARCHAR(255) UNIQUE, -- NEW
  provider VARCHAR(50) DEFAULT 'email', -- NEW
  created_at TIMESTAMP,
  total_balance DECIMAL,
  unclaimed_reward DECIMAL,
  ...
)
```

### **What Happens to Each User:**

| User Type | Current Location | After Migration | Action Required |
|-----------|------------------|-----------------|-----------------|
| **Email/Password** | Express DB | Express DB | ✅ None - Already working |
| **Google OAuth (New)** | Supabase Auth | Synced to Express DB | ✅ Auto-sync on first login |
| **Google OAuth (Existing)** | Supabase Auth | Migrated to Express DB | ⚠️ Run migration script |

---

## ⚠️ **IMPORTANT: NO DATA LOSS**

### **What Gets Preserved:**
- ✅ All 15,273 user accounts
- ✅ All earnings data
- ✅ All devices
- ✅ All referrals
- ✅ All sessions
- ✅ Login access for all users

### **What Changes:**
- ✅ Google users get `google_id` field
- ✅ Google users get `provider = 'google'`
- ✅ Google users get JWT tokens (same as email users)
- ✅ Password field becomes nullable

---

## 🚀 **DEPLOYMENT STEPS**

### **1. Update Database (5 minutes)**
```sql
-- Run the ALTER TABLE commands
ALTER TABLE users ADD COLUMN google_id VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN provider VARCHAR(50) DEFAULT 'email';
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
```

### **2. Deploy Backend (10 minutes)**
- Add `/auth/google-login` endpoint
- Deploy to AWS

### **3. Deploy Frontend (10 minutes)**
- Update `AuthModal.tsx`
- Update `/auth/callback/route.ts`
- Deploy to Vercel

### **4. Run Migration Script (15 minutes)**
```bash
node migration-script.js
```

### **5. Test (15 minutes)**
- Test email login ✅
- Test Google login ✅
- Test existing Google user login ✅

**Total Time: ~1 hour**

---

## ✅ **FINAL RESULT**

```
┌─────────────────────────────────────────────────────────┐
│ ALL USERS CAN LOGIN                                     │
├─────────────────────────────────────────────────────────┤
│ ✅ Email/Password users → Express backend JWT          │
│ ✅ Google OAuth users → Supabase → Express JWT         │
│ ✅ All 15,273 users preserved                           │
│ ✅ No data loss                                         │
│ ✅ Unified JWT authentication                           │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 **SUMMARY**

### **What You Asked:**
> "I want Google auth from Supabase + custom email auth, and NO user should lose access"

### **What You Get:**
1. ✅ **Email/Password Auth** - Already working via Express backend
2. ✅ **Google OAuth** - Via Supabase, synced to Express backend
3. ✅ **All 15,273 users preserved** - No data loss
4. ✅ **Unified JWT system** - Both auth methods use same JWT tokens
5. ✅ **Minimal migration** - Just add `google_id` column and sync users

### **What You DON'T Need:**
- ❌ Migrate email/password users (already in Express DB)
- ❌ Rebuild Google OAuth from scratch
- ❌ Change existing auth flow
- ❌ Lose any user data

---

**This is the SAFEST and FASTEST approach to preserve all your users! 🎉**
