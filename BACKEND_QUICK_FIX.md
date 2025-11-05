# 🚨 URGENT BACKEND FIX - Password Reset & Leaderboard

## ❌ **CURRENT ERRORS**

```
POST /api/v1/auth/reset-password/send-otp → 404 Not Found
GET /api/v1/leaderboard → Not showing user rank
```

---

## ✅ **BACKEND FIX - Copy & Paste This Code**

### **Step 1: Install Resend (if not installed)**

```bash
cd /path/to/backend
npm install resend
```

---

### **Step 2: Add Environment Variable**

Add to your `.env` file:

```env
RESEND_API_KEY=re_3pHxxTWp_6zpUCEngatRzeBcDyPfgkr
RESEND_FROM_EMAIL=noreply@neurolov.ai
```

---

### **Step 3: Create Email Service**

**File:** `src/services/emailService.js`

```javascript
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

class EmailService {
  async sendOTPEmail(email, otp) {
    try {
      const { data, error } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'noreply@neurolov.ai',
        to: email,
        subject: 'Password Reset OTP - NeuroSwarm',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
              .container { background-color: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto; }
              .otp-code { font-size: 32px; font-weight: bold; color: #0361DA; text-align: center; padding: 20px; background-color: #f0f7ff; border-radius: 8px; margin: 20px 0; letter-spacing: 8px; }
              .warning { color: #ff6b6b; font-size: 14px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h2 style="color: #0361DA;">Password Reset Request</h2>
              <p>You requested to reset your password. Use the OTP code below:</p>
              <div class="otp-code">${otp}</div>
              <p>This code will expire in <strong>10 minutes</strong>.</p>
              <p class="warning">⚠️ If you didn't request this, please ignore this email.</p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
              <p style="color: #888; font-size: 12px;">NeuroSwarm - Decentralized AI Network</p>
            </div>
          </body>
          </html>
        `,
      });

      if (error) {
        console.error('Resend error:', error);
        throw new Error('Failed to send email');
      }

      console.log('✅ OTP email sent:', data);
      return { success: true, messageId: data.id };
    } catch (error) {
      console.error('Email service error:', error);
      throw error;
    }
  }
}

module.exports = new EmailService();
```

---

### **Step 4: Create Password Reset Service**

**File:** `src/services/passwordResetService.js`

```javascript
const bcrypt = require('bcryptjs');
const emailService = require('./emailService');

// In-memory OTP storage (use Redis in production)
const otpStore = new Map();

class PasswordResetService {
  // Generate 6-digit OTP
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Send OTP to email
  async sendResetOTP(email) {
    try {
      // Generate OTP
      const otp = this.generateOTP();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

      // Store OTP
      otpStore.set(email, {
        otp,
        expiresAt,
        attempts: 0,
      });

      // Send email
      await emailService.sendOTPEmail(email, otp);

      console.log(`✅ OTP sent to ${email}: ${otp} (expires in 10 min)`);
      return { success: true };
    } catch (error) {
      console.error('Send OTP error:', error);
      throw error;
    }
  }

  // Verify OTP
  async verifyOTP(email, otp) {
    const stored = otpStore.get(email);

    if (!stored) {
      throw new Error('No OTP found. Please request a new one.');
    }

    if (Date.now() > stored.expiresAt) {
      otpStore.delete(email);
      throw new Error('OTP expired. Please request a new one.');
    }

    if (stored.attempts >= 5) {
      otpStore.delete(email);
      throw new Error('Too many attempts. Please request a new OTP.');
    }

    if (stored.otp !== otp) {
      stored.attempts++;
      throw new Error('Invalid OTP. Please try again.');
    }

    // Mark as verified
    stored.verified = true;
    return { success: true };
  }

  // Reset password
  async resetPassword(email, otp, newPassword, db) {
    // Verify OTP first
    await this.verifyOTP(email, otp);

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    const result = await db.query(
      'UPDATE users SET password = $1 WHERE email = $2 RETURNING id, email',
      [hashedPassword, email]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    // Clear OTP
    otpStore.delete(email);

    console.log(`✅ Password reset successful for ${email}`);
    return { success: true, user: result.rows[0] };
  }

  // Resend OTP
  async resendOTP(email) {
    // Delete old OTP
    otpStore.delete(email);
    // Send new OTP
    return this.sendResetOTP(email);
  }
}

module.exports = new PasswordResetService();
```

---

### **Step 5: Add Password Reset Routes**

**File:** `src/routes/auth.js` (add these routes)

```javascript
const passwordResetService = require('../services/passwordResetService');

// Send OTP
router.post('/reset-password/send-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    // Check if user exists
    const user = await req.db.query('SELECT id FROM users WHERE email = $1', [email]);
    
    if (user.rows.length === 0) {
      // Don't reveal if user exists (security)
      return res.json({
        success: true,
        message: 'If this email exists, an OTP has been sent.',
      });
    }

    await passwordResetService.sendResetOTP(email);

    res.json({
      success: true,
      message: 'OTP sent to your email',
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP',
    });
  }
});

// Verify OTP
router.post('/reset-password/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required',
      });
    }

    await passwordResetService.verifyOTP(email, otp);

    res.json({
      success: true,
      message: 'OTP verified successfully',
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Update password
router.post('/reset-password/update', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP, and new password are required',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    await passwordResetService.resetPassword(email, otp, newPassword, req.db);

    res.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Resend OTP
router.post('/reset-password/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    await passwordResetService.resendOTP(email);

    res.json({
      success: true,
      message: 'New OTP sent to your email',
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend OTP',
    });
  }
});
```

---

### **Step 6: Fix Leaderboard to Show User Rank**

**File:** `src/routes/leaderboard.js` (or wherever your leaderboard route is)

```javascript
router.get('/leaderboard', async (req, res) => {
  try {
    const userId = req.user?.id; // Get from JWT if authenticated
    const limit = parseInt(req.query.limit) || 10;

    // Get top users
    const topUsersQuery = `
      SELECT 
        u.id,
        u.username,
        u.total_balance as total_earnings,
        ROW_NUMBER() OVER (ORDER BY u.total_balance DESC) as rank
      FROM users u
      ORDER BY u.total_balance DESC
      LIMIT $1
    `;
    
    const topUsers = await req.db.query(topUsersQuery, [limit]);

    // Get current user's rank if authenticated
    let currentUser = null;
    if (userId) {
      const userRankQuery = `
        WITH ranked_users AS (
          SELECT 
            u.id,
            u.username,
            u.total_balance as total_earnings,
            ROW_NUMBER() OVER (ORDER BY u.total_balance DESC) as rank
          FROM users u
        )
        SELECT * FROM ranked_users WHERE id = $1
      `;
      
      const userResult = await req.db.query(userRankQuery, [userId]);
      
      if (userResult.rows.length > 0) {
        currentUser = {
          ...userResult.rows[0],
          rank: parseInt(userResult.rows[0].rank),
          is_current_user: true,
        };
      }
    }

    // Get total users count
    const totalUsersResult = await req.db.query('SELECT COUNT(*) as count FROM users');
    const totalUsers = parseInt(totalUsersResult.rows[0].count);

    res.json({
      success: true,
      data: {
        top_10: topUsers.rows.map(user => ({
          ...user,
          rank: parseInt(user.rank),
          is_current_user: userId ? user.id === userId : false,
        })),
        current_user: currentUser,
        total_users: totalUsers,
      },
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard',
    });
  }
});
```

---

## 🚀 **DEPLOYMENT STEPS**

### **1. Install Dependencies**
```bash
npm install resend
```

### **2. Add Environment Variables**
```bash
# Add to .env
RESEND_API_KEY=re_3pHxxTWp_6zpUCEngatRzeBcDyPfgkr
RESEND_FROM_EMAIL=noreply@neurolov.ai
```

### **3. Restart Backend**
```bash
npm run dev
# or
pm2 restart neuroswarm-backend
```

### **4. Test Endpoints**

**Test Password Reset:**
```bash
# Send OTP
curl -X POST https://api.neurolov.ai/api/v1/auth/reset-password/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Should return: {"success":true,"message":"OTP sent to your email"}
```

**Test Leaderboard:**
```bash
# Get leaderboard
curl https://api.neurolov.ai/api/v1/leaderboard

# Should return: {"success":true,"data":{"top_10":[...],"current_user":{...}}}
```

---

## ✅ **EXPECTED RESULTS**

### **Password Reset:**
- ✅ `POST /auth/reset-password/send-otp` → 200 OK
- ✅ Email received with 6-digit OTP
- ✅ OTP expires in 10 minutes
- ✅ Max 5 verification attempts

### **Leaderboard:**
- ✅ `GET /leaderboard` → 200 OK
- ✅ Returns top 10 users
- ✅ Returns current user's rank (if authenticated)
- ✅ Shows "Your rank: #172" in UI

---

## 🔥 **CRITICAL FILES TO CREATE/MODIFY**

1. ✅ Create `src/services/emailService.js`
2. ✅ Create `src/services/passwordResetService.js`
3. ✅ Modify `src/routes/auth.js` (add 4 routes)
4. ✅ Modify `src/routes/leaderboard.js` (fix user rank)
5. ✅ Add `RESEND_API_KEY` to `.env`

---

## ⏱️ **TIME TO FIX: 30 MINUTES**

1. Copy-paste code (10 min)
2. Install dependencies (2 min)
3. Add env variables (2 min)
4. Restart backend (1 min)
5. Test endpoints (15 min)

---

**STATUS: 🚨 URGENT - IMPLEMENT NOW TO FIX 404 ERRORS**
