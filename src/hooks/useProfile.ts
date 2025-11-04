'use client';

// TODO: Replace with new auth system
import { useState } from 'react';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export const useProfile = () => {
  // Disabled - TODO: Replace with new auth system
  const [profile] = useState<UserProfile | null>(null);
  const [loading] = useState(false);
  const [error] = useState<string | null>('Auth system disabled');

  const updateProfile = async (updates: Partial<UserProfile>) => {
    throw new Error('Auth system disabled. Please implement new auth.');
  };

  return {
    profile,
    loading,
    error,
    updateProfile,
  };
};
