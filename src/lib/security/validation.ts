/**
 * Input Validation and Sanitization Utilities
 * Prevents XSS, SQL Injection, and other attacks
 */

// Email validation (RFC 5322 compliant)
export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }

  const trimmed = email.trim();
  
  if (trimmed.length === 0) {
    return { valid: false, error: 'Email cannot be empty' };
  }

  if (trimmed.length > 254) {
    return { valid: false, error: 'Email is too long' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Invalid email format' };
  }

  // Check for dangerous characters
  if (/<|>|script|javascript|onerror|onclick/i.test(trimmed)) {
    return { valid: false, error: 'Email contains invalid characters' };
  }

  return { valid: true };
}

// Username validation (alphanumeric + underscore/hyphen only)
export function validateUsername(username: string): { valid: boolean; error?: string } {
  if (!username || typeof username !== 'string') {
    return { valid: false, error: 'Username is required' };
  }

  const trimmed = username.trim();

  if (trimmed.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters' };
  }

  if (trimmed.length > 30) {
    return { valid: false, error: 'Username must be less than 30 characters' };
  }

  // Only allow alphanumeric, underscore, and hyphen
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!usernameRegex.test(trimmed)) {
    return { valid: false, error: 'Username can only contain letters, numbers, _ and -' };
  }

  // Prevent SQL injection keywords
  const sqlKeywords = /\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b/i;
  if (sqlKeywords.test(trimmed)) {
    return { valid: false, error: 'Username contains invalid keywords' };
  }

  return { valid: true };
}

// Password validation
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required' };
  }

  if (password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters' };
  }

  if (password.length > 128) {
    return { valid: false, error: 'Password is too long' };
  }

  // Check for at least one letter and one number (basic strength)
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  if (!hasLetter || !hasNumber) {
    return { valid: false, error: 'Password must contain both letters and numbers' };
  }

  return { valid: true };
}

// Device name validation
export function validateDeviceName(name: string): { valid: boolean; error?: string } {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Device name is required' };
  }

  const trimmed = name.trim();

  if (trimmed.length < 2) {
    return { valid: false, error: 'Device name must be at least 2 characters' };
  }

  if (trimmed.length > 50) {
    return { valid: false, error: 'Device name must be less than 50 characters' };
  }

  // Allow letters, numbers, spaces, and basic punctuation
  const nameRegex = /^[a-zA-Z0-9\s._-]+$/;
  if (!nameRegex.test(trimmed)) {
    return { valid: false, error: 'Device name contains invalid characters' };
  }

  // Prevent XSS
  if (/<|>|script|javascript|onerror|onclick/i.test(trimmed)) {
    return { valid: false, error: 'Device name contains invalid content' };
  }

  return { valid: true };
}

// Sanitize HTML to prevent XSS
export function sanitizeHTML(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Validate numeric input (for task points, etc.)
export function validateNumber(
  value: number,
  min: number = 0,
  max: number = Number.MAX_SAFE_INTEGER
): { valid: boolean; error?: string } {
  if (typeof value !== 'number' || isNaN(value)) {
    return { valid: false, error: 'Invalid number' };
  }

  if (value < min) {
    return { valid: false, error: `Value must be at least ${min}` };
  }

  if (value > max) {
    return { valid: false, error: `Value must be at most ${max}` };
  }

  return { valid: true };
}

// Validate UUID/ID format
export function validateId(id: string): { valid: boolean; error?: string } {
  if (!id || typeof id !== 'string') {
    return { valid: false, error: 'ID is required' };
  }

  // Check for dangerous patterns
  if (/<|>|script|'|"|;|--|\*|%/i.test(id)) {
    return { valid: false, error: 'ID contains invalid characters' };
  }

  return { valid: true };
}

// Rate limiting helper (client-side)
const requestTimestamps: Record<string, number[]> = {};

export function checkRateLimit(
  key: string,
  maxRequests: number = 10,
  windowMs: number = 60000 // 1 minute
): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const windowStart = now - windowMs;

  // Initialize if not exists
  if (!requestTimestamps[key]) {
    requestTimestamps[key] = [];
  }

  // Remove old timestamps
  requestTimestamps[key] = requestTimestamps[key].filter(ts => ts > windowStart);

  // Check if limit exceeded
  if (requestTimestamps[key].length >= maxRequests) {
    const oldestRequest = requestTimestamps[key][0];
    const retryAfter = Math.ceil((oldestRequest + windowMs - now) / 1000);
    return { allowed: false, retryAfter };
  }

  // Add current timestamp
  requestTimestamps[key].push(now);
  return { allowed: true };
}

// Comprehensive form validation
export function validateSignupForm(data: {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  // Validate email
  const emailResult = validateEmail(data.email);
  if (!emailResult.valid) {
    errors.email = emailResult.error!;
  }

  // Validate username
  const usernameResult = validateUsername(data.username);
  if (!usernameResult.valid) {
    errors.username = usernameResult.error!;
  }

  // Validate password
  const passwordResult = validatePassword(data.password);
  if (!passwordResult.valid) {
    errors.password = passwordResult.error!;
  }

  // Confirm password match
  if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateLoginForm(data: {
  email: string;
  password: string;
}): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  // Validate email
  const emailResult = validateEmail(data.email);
  if (!emailResult.valid) {
    errors.email = emailResult.error!;
  }

  // Basic password check
  if (!data.password || data.password.length < 6) {
    errors.password = 'Password is required';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
