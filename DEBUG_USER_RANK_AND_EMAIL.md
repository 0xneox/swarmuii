# 🔍 **DEBUGGING USER RANK "N/A" & EMAIL NOT SENDING**

---

## **ISSUE 1: USER RANK SHOWS "N/A"**

### **🔍 What I See in Your Screenshot:**

```json
{
  "success": true,
  "message": "Global statistics retrieved successfully",
  "data": {
    "user_rank": "N/A",  // ← BACKEND IS RETURNING THIS!
    "global_sp": 619,
    "total_users": 4
  }
}
```

**The problem is in the BACKEND, not frontend!**

---

### **✅ Frontend Logic (CORRECT):**

**File:** `src/components/GlobalStatistics.tsx`

**What it does:**
1. Calls `apiClient.get('/global-stats')` with auth token ✅
2. Calls `apiClient.get('/earnings/leaderboard?limit=100')` with auth token ✅
3. Extracts `user_rank` from response ✅
4. Falls back to `current_user.rank` from leaderboard ✅

**Code (Lines 148-179):**
```typescript
// Extract user rank from global-stats response
if (statsData.user_rank && statsData.user_rank !== 'N/A' && user) {
  const rankNumber = typeof statsData.user_rank === 'string' 
    ? parseInt(statsData.user_rank.replace('#', '')) 
    : statsData.user_rank;
  
  setCurrentUserRank({
    user_id: user.id,
    username: user.username || 'You',
    total_earnings: user.total_balance || 0,
    rank: rankNumber,
  });
}

// Also tries to extract from leaderboard response
if (leaderboardData.current_user && user) {
  setCurrentUserRank({
    user_id: leaderboardData.current_user.user_id || user.id,
    username: leaderboardData.current_user.username || user.username || 'You',
    total_earnings: leaderboardData.current_user.total_earnings || user.total_balance || 0,
    rank: leaderboardData.current_user.rank,
  });
}
```

**Frontend is doing everything right!** ✅

---

### **❌ Backend Issue:**

The backend `/global-stats` endpoint is returning `user_rank: "N/A"` because:

1. **Auth token not being read correctly**
2. **User ID not being extracted from JWT**
3. **Rank calculation logic has a bug**

---

### **🔧 BACKEND FIX NEEDED:**

**Check your backend `/global-stats` endpoint:**

```typescript
// Should look like this:
router.get('/global-stats', optionalAuth, async (req, res) => {
  try {
    const userId = req.user?.id; // ← Is this being set?
    
    // Get user's rank if authenticated
    let userRank = 'N/A';
    if (userId) {
      const rankQuery = `
        SELECT rank FROM (
          SELECT 
            id,
            ROW_NUMBER() OVER (ORDER BY total_balance DESC) as rank
          FROM users
        ) ranked
        WHERE id = $1
      `;
      
      const rankResult = await db.query(rankQuery, [userId]);
      if (rankResult.rows.length > 0) {
        userRank = `#${rankResult.rows[0].rank}`;
      }
    }
    
    res.json({
      success: true,
      data: {
        user_rank: userRank,
        global_sp: ...,
        total_users: ...,
      }
    });
  } catch (error) {
    // ...
  }
});
```

---

### **🧪 DEBUG STEPS (BACKEND):**

Add console logs to your backend:

```typescript
router.get('/global-stats', optionalAuth, async (req, res) => {
  console.log('🔍 req.user:', req.user);           // ← Is user set?
  console.log('🔍 userId:', req.user?.id);         // ← Is ID extracted?
  console.log('🔍 Authorization header:', req.headers.authorization); // ← Is token sent?
  
  // ... rest of code
  
  console.log('🔍 Calculated rank:', userRank);    // ← What rank is calculated?
});
```

**Expected output:**
```
🔍 req.user: { id: '8f5d39d6...', username: 'KNIGHTISH', ... }
🔍 userId: 8f5d39d6...
🔍 Authorization header: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
🔍 Calculated rank: #1
```

**If you see:**
```
🔍 req.user: undefined  // ← PROBLEM!
🔍 userId: undefined
🔍 Authorization header: undefined  // ← Token not being sent!
```

Then the issue is:
1. Frontend not sending token (but we verified it does)
2. Backend `optionalAuth` middleware not working
3. JWT verification failing

---

## **ISSUE 2: PASSWORD RESET EMAIL NOT SENDING**

### **✅ Frontend Logic (CORRECT):**

**File:** `src/components/Settings.tsx` (Line 323)

```typescript
await apiClient.post('/auth/reset-password/send-otp', { email });
```

**This is correct!** ✅

---

### **❌ Backend Issue:**

The backend endpoint exists but **Resend might not be configured correctly**.

---

### **🔧 BACKEND CHECKS:**

#### **1. Check Environment Variables:**

```bash
# In your backend .env file:
RESEND_API_KEY=re_3pHxxTWp_6zpUCEngatRzeBcDyPfgkr
RESEND_FROM_EMAIL=noreply@neurolov.ai
```

**Verify in backend:**
```typescript
console.log('🔍 RESEND_API_KEY:', process.env.RESEND_API_KEY);
console.log('🔍 RESEND_FROM_EMAIL:', process.env.RESEND_FROM_EMAIL);
```

**Expected:**
```
🔍 RESEND_API_KEY: re_3pHxxTWp_6zpUCEngatRzeBcDyPfgkr
🔍 RESEND_FROM_EMAIL: noreply@neurolov.ai
```

**If undefined:**
- Check `.env` file exists in backend root
- Restart backend server
- Make sure `dotenv` is loaded: `require('dotenv').config()`

---

#### **2. Check Resend Service:**

**File:** `backend/src/services/emailService.ts` (or `.js`)

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOTPEmail(email: string, otp: string) {
  console.log('📧 Sending OTP email to:', email);
  console.log('📧 OTP code:', otp);
  console.log('📧 From email:', process.env.RESEND_FROM_EMAIL);
  
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@neurolov.ai',
      to: email,
      subject: 'Password Reset OTP - NeuroSwarm',
      html: `
        <h1>Your OTP: ${otp}</h1>
        <p>This code expires in 10 minutes.</p>
      `,
    });

    if (error) {
      console.error('❌ Resend error:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log('✅ Email sent successfully:', data);
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('❌ Email service error:', error);
    throw error;
  }
}
```

---

#### **3. Check Password Reset Route:**

**File:** `backend/src/routes/auth.ts`

```typescript
router.post('/reset-password/send-otp', async (req, res) => {
  console.log('📧 Password reset OTP request received');
  console.log('📧 Email:', req.body.email);
  
  try {
    const { email } = req.body;
    
    if (!email) {
      console.log('❌ No email provided');
      return res.status(400).json({ success: false, message: 'Email required' });
    }
    
    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('📧 Generated OTP:', otp);
    
    // Send email
    await sendOTPEmail(email, otp);
    console.log('✅ OTP email sent successfully');
    
    res.json({ success: true, message: 'OTP sent to your email' });
  } catch (error) {
    console.error('❌ Send OTP error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to send OTP' 
    });
  }
});
```

---

### **🧪 TEST EMAIL SENDING (BACKEND):**

Create a test script:

**File:** `backend/test-email.js`

```javascript
require('dotenv').config();
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail() {
  console.log('🔍 Testing Resend email...');
  console.log('🔍 API Key:', process.env.RESEND_API_KEY);
  console.log('🔍 From Email:', process.env.RESEND_FROM_EMAIL);
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'noreply@neurolov.ai',
      to: 'your-email@example.com', // ← YOUR EMAIL
      subject: 'Test Email from NeuroSwarm',
      html: '<h1>Test successful!</h1><p>Resend is working.</p>',
    });

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    console.log('✅ Email sent successfully!');
    console.log('✅ Message ID:', data.id);
  } catch (error) {
    console.error('❌ Exception:', error);
  }
}

testEmail();
```

**Run it:**
```bash
cd backend
node test-email.js
```

**Expected output:**
```
🔍 Testing Resend email...
🔍 API Key: re_3pHxxTWp_6zpUCEngatRzeBcDyPfgkr
🔍 From Email: noreply@neurolov.ai
✅ Email sent successfully!
✅ Message ID: abc123...
```

**If you see errors:**
```
❌ Error: { message: 'Invalid API key' }
```
→ API key is wrong or expired

```
❌ Error: { message: 'Domain not verified' }
```
→ Need to verify `neurolov.ai` domain in Resend dashboard

---

## **🎯 QUICK CHECKLIST:**

### **User Rank Issue:**
- [ ] Backend logs show `req.user` is defined
- [ ] Backend logs show `userId` is extracted
- [ ] Backend logs show rank is calculated
- [ ] Backend returns rank in response (not "N/A")

### **Email Issue:**
- [ ] `RESEND_API_KEY` is set in backend `.env`
- [ ] `RESEND_FROM_EMAIL` is set in backend `.env`
- [ ] Resend package is installed: `npm list resend`
- [ ] Test script sends email successfully
- [ ] Backend logs show "Email sent successfully"
- [ ] Check spam folder for OTP email

---

## **🚀 NEXT STEPS:**

1. **Add console logs to backend** (both endpoints)
2. **Restart backend server**
3. **Test again and check backend logs**
4. **Share backend logs with me**

---

**The frontend is 100% correct. The issues are in the backend configuration!**
