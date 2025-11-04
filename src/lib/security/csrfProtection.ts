/**
 * CSRF Protection Utilities
 * Generates and validates CSRF tokens for sensitive operations
 */

// Generate a random CSRF token
export function generateCSRFToken(): string {
  if (typeof window === 'undefined') return '';
  
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Store CSRF token in sessionStorage
export function storeCSRFToken(): string {
  if (typeof window === 'undefined') return '';
  
  const token = generateCSRFToken();
  sessionStorage.setItem('csrf_token', token);
  return token;
}

// Get CSRF token from sessionStorage
export function getCSRFToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  let token = sessionStorage.getItem('csrf_token');
  
  // Generate new token if none exists
  if (!token) {
    token = storeCSRFToken();
  }
  
  return token;
}

// Validate CSRF token
export function validateCSRFToken(token: string): boolean {
  if (typeof window === 'undefined') return false;
  
  const storedToken = sessionStorage.getItem('csrf_token');
  return storedToken === token && token.length === 64;
}

// Clear CSRF token (on logout)
export function clearCSRFToken(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem('csrf_token');
}
