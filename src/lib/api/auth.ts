/**
 * Authentication Service
 * Handles signup, login, logout, and profile management
 */

import apiClient, { getErrorMessage } from './client';

export interface User {
  id: string;
  email: string;
  username: string;
  created_at?: string;
  total_balance?: number;
  unclaimed_reward?: number;
  referralCode?: string;
  wallet_address?: string;
  wallet_type?: string;
  plan?: string;  // ✅ ADD SUBSCRIPTION PLAN
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  username: string;
  password: string;
}

class AuthService {
  /**
   * Sign up a new user
   */
  async signup(credentials: SignupCredentials): Promise<AuthResponse> {
    try {
      const { data } = await apiClient.post<{ success: boolean; data: AuthResponse }>(
        '/auth/signup',
        credentials
      );
      
      // Store token and user in localStorage
      if (data.data.token) {
        this.storeAuth(data.data.token, data.data.user);
      }
      
      return data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Log in an existing user
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const { data } = await apiClient.post<{ success: boolean; data: AuthResponse }>(
        '/auth/login',
        credentials
      );
      
      // Store token and user in localStorage
      if (data.data.token) {
        this.storeAuth(data.data.token, data.data.user);
      }
      
      return data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Get current authenticated user's profile
   */
  async getProfile(): Promise<User> {
    try {
      const { data } = await apiClient.get<{ success: boolean; data: User }>(
        '/auth/profile'
      );
      
      // Update stored user data
      if (data.data) {
        this.updateStoredUser(data.data);
      }
      
      return data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<User>): Promise<User> {
    try {
      const { data } = await apiClient.put<{ success: boolean; data: User }>(
        '/auth/profile',
        updates
      );
      
      // Update stored user data
      if (data.data) {
        this.updateStoredUser(data.data);
      }
      
      return data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Log out current user
   */
  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('token');
  }

  /**
   * Get stored user data
   */
  getUser(): User | null {
    if (typeof window === 'undefined') return null;
    
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  /**
   * Get stored token
   */
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }

  /**
   * Store authentication data
   */
  private storeAuth(token: string, user: User): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    }
  }

  /**
   * Update stored user data
   */
  private updateStoredUser(user: User): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
