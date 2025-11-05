# 🔥 FRONTEND .env.local FOR LOCALHOST TESTING

**Copy this to `.env.local` in your frontend root:**

```env
# ========================================
# LOCALHOST BACKEND (FOR TESTING)
# ========================================
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1

# ========================================
# PRODUCTION BACKEND (COMMENT OUT FOR NOW)
# ========================================
# NEXT_PUBLIC_API_URL=https://api.neurolov.ai/api/v1

# ========================================
# OTHER SETTINGS (Keep as is)
# ========================================
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
```

---

## 📋 **STEPS TO USE LOCALHOST:**

### **1. Create .env.local file:**
```bash
# In frontend root (c:\Users\nitis\swarmrepo)
# Create new file: .env.local
# Copy the content above
```

### **2. Restart Frontend:**
```bash
# Stop current dev server (Ctrl+C)
npm run dev
```

### **3. Verify it's using localhost:**
```bash
# Open browser console
# Check Network tab
# Should see requests to: http://localhost:3001/api/v1/...
```

---

## 🎯 **WHAT THIS DOES:**

### **Before (Production API):**
```
Frontend → https://api.neurolov.ai/api/v1/auth/reset-password/send-otp
Result: 404 (endpoint not deployed yet)
```

### **After (Localhost API):**
```
Frontend → http://localhost:3001/api/v1/auth/reset-password/send-otp
Result: 200 OK (your local backend has the endpoint!)
```

---

## ⚠️ **IMPORTANT: CORS SETUP**

Your **backend** needs to allow localhost:3000. Check if you have this in your backend:

**File:** `backend/src/server.ts` or `backend/src/app.ts`

```typescript
import cors from 'cors';

app.use(cors({
  origin: [
    'http://localhost:3000',        // ← Frontend dev server
    'https://swarmuii.vercel.app',  // ← Production frontend
  ],
  credentials: true,
}));
```

---

## 🧪 **TESTING CHECKLIST:**

### **1. Backend Running:**
```bash
# In backend folder
npm run dev

# Should see:
# Server running on http://localhost:3001
```

### **2. Frontend Running:**
```bash
# In frontend folder (c:\Users\nitis\swarmrepo)
npm run dev

# Should see:
# Ready on http://localhost:3000
```

### **3. Test Password Reset:**
```
1. Go to http://localhost:3000
2. Login
3. Go to Settings
4. Click "Reset Password"
5. Enter email
6. Click "Send OTP"
7. Should work! (no more 404)
```

### **4. Test User Rank:**
```
1. Go to http://localhost:3000
2. Login
3. Go to Global Statistics
4. Should show: "Your rank: #1" (not "N/A")
```

---

## 🔄 **SWITCHING BETWEEN LOCALHOST & PRODUCTION:**

### **For Local Testing:**
```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

### **For Production Testing:**
```env
# .env.local
NEXT_PUBLIC_API_URL=https://api.neurolov.ai/api/v1
```

### **Or Use Both (Conditional):**
```typescript
// src/lib/api/client.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
  (process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3001/api/v1'
    : 'https://api.neurolov.ai/api/v1'
  );
```

---

## 📝 **FULL .env.local TEMPLATE:**

```env
# ========================================
# API CONFIGURATION
# ========================================

# Use localhost for testing new backend features
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1

# Use production when backend is deployed
# NEXT_PUBLIC_API_URL=https://api.neurolov.ai/api/v1

# ========================================
# FRONTEND CONFIGURATION
# ========================================

# Local development
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000

# Production (comment out for local dev)
# NEXT_PUBLIC_FRONTEND_URL=https://swarmuii.vercel.app

# ========================================
# OPTIONAL: SUPABASE (if still using)
# ========================================

# NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key

# ========================================
# OPTIONAL: ANALYTICS
# ========================================

# NEXT_PUBLIC_GA_ID=your_google_analytics_id
```

---

## 🚀 **QUICK START:**

```bash
# 1. Create .env.local in frontend root
echo "NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1" > .env.local

# 2. Restart frontend
npm run dev

# 3. Test in browser
# Open http://localhost:3000
# Try password reset - should work now!
```

---

## ✅ **EXPECTED RESULTS:**

### **Password Reset:**
```
✅ Click "Send OTP" → 200 OK (not 404!)
✅ Email received with OTP
✅ Enter OTP → Verified
✅ Change password → Success
```

### **User Rank:**
```
✅ Shows "Your rank: #1" (not "N/A")
✅ Leaderboard displays correctly
✅ Global stats show your position
```

---

## 🎯 **AFTER TESTING:**

Once everything works on localhost:

1. **Push backend changes to GitHub**
2. **Deploy backend to production**
3. **Switch .env.local back to production URL**
4. **Test on production**
5. **Deploy frontend to Vercel**

---

**CREATE `.env.local` NOW AND RESTART FRONTEND - EVERYTHING WILL WORK!** 🚀
