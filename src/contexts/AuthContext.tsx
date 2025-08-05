"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import { createClient } from "@/utils/supabase/client";
import {
  User as SupabaseUser,
  Session,
  AuthChangeEvent,
} from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { stopTaskEngine } from "@/lib/store/taskEngine";

// Define the user profile interface
export interface UserProfile {
  id: string;
  email: string;
  user_name: string | null;
  wallet_address: string | null;
  wallet_type: string | null;
  joined_at: string;
  referral_code: string | null;
  referral_count?: number;
  plan: string;
  reputation_score: number | null;
  freedom_ai_credits: number;
  music_video_credits: number;
  deepfake_credits: number;
  video_generator_credits: number;
}

// Define the auth context interface
interface AuthContextType {
  user: SupabaseUser | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  signUp: (email: string, username: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Auth provider component
interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  // Refs to prevent race conditions and memory leaks
  const isMountedRef = useRef(true);
  const profileCreationInProgressRef = useRef(false);
  const lastSessionIdRef = useRef<string | null>(null);
  const authStateChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch user profile from database with proper error handling
  const fetchUserProfile = useCallback(
    async (userId: string): Promise<UserProfile | null> => {
      if (!isMountedRef.current) return null;

      console.log("📊 Fetching user profile for user ID:", userId);
      try {
        const { data, error } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (error) {
          console.error("❌ Error fetching user profile:", error);
          return null;
        }

        console.log("✅ User profile retrieved successfully:", data);
        return data as UserProfile;
      } catch (error) {
        console.error("❌ Exception in fetchUserProfile:", error);
        return null;
      }
    },
    [supabase]
  );

  // Create user profile in the database if it doesn't exist
  const createUserProfile = useCallback(
    async (
      userId: string,
      userData: { email: string; user_name?: string }
    ): Promise<UserProfile | null> => {
      if (!isMountedRef.current || profileCreationInProgressRef.current) {
        console.log(
          "⚠️ Profile creation already in progress or component unmounted"
        );
        return null;
      }

      profileCreationInProgressRef.current = true;
      console.log("🆕 Creating user profile for:", userId, userData);

      try {
        // Generate a unique referral code
        const referralCode = generateReferralCode();

        // Create the profile
        const profileData = {
          id: userId,
          email: userData.email,
          user_name: userData.user_name || userData.email.split("@")[0],
          joined_at: new Date().toISOString(),
          referral_code: referralCode,
          freedom_ai_credits: 10000,
          music_video_credits: 0,
          deepfake_credits: 0,
          video_generator_credits: 0,
          plan: "free",
          reputation_score: 0,
        };

        console.log("📝 Attempting to create profile with data:", profileData);

        const { data, error } = await supabase
          .from("user_profiles")
          .insert(profileData)
          .select()
          .single();

        if (error) {
          console.error("❌ Error creating user profile:", error);
          return null;
        }

        console.log("✅ User profile created successfully:", data);
        return data as UserProfile;
      } catch (error) {
        console.error("❌ Exception in createUserProfile:", error);
        return null;
      } finally {
        profileCreationInProgressRef.current = false;
      }
    },
    [supabase]
  );

  // Ensure user profile exists (fetch or create)
  const ensureUserProfile = useCallback(
    async (currentUser: SupabaseUser): Promise<UserProfile | null> => {
      if (!isMountedRef.current) return null;

      // Check if we already have a profile for this user
      if (profile && profile.id === currentUser.id) {
        console.log("✅ Profile already exists in state:", profile.user_name);
        return profile;
      }

      // Try to fetch existing profile
      let userProfile = await fetchUserProfile(currentUser.id);

      if (!userProfile) {
        // Create new profile if it doesn't exist
        console.log("⚠️ No user profile found, creating new one");
        userProfile = await createUserProfile(currentUser.id, {
          email: currentUser.email!,
          user_name:
            currentUser.user_metadata?.username ||
            currentUser.email!.split("@")[0],
        });
      }

      return userProfile;
    },
    [profile, fetchUserProfile, createUserProfile]
  );

  // Initialize auth state
  const initializeAuth = useCallback(async () => {
    if (!isMountedRef.current) return;

    console.log("🔄 Initializing auth context");

    try {
      console.log("🔍 Checking for existing session");
      const {
        data: { session: currentSession },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (!isMountedRef.current) return;

      if (sessionError) {
        console.error("❌ Session error:", sessionError);
        setIsLoading(false);
        return;
      }

      if (currentSession && currentSession.user) {
        console.log("✅ Session found:", currentSession.user.email);

        // Check if this is a new session
        const sessionId = currentSession.access_token;
        if (lastSessionIdRef.current !== sessionId) {
          lastSessionIdRef.current = sessionId;

          setSession(currentSession);
          setUser(currentSession.user);

          // Ensure profile exists
          const userProfile = await ensureUserProfile(currentSession.user);
          if (userProfile && isMountedRef.current) {
            setProfile(userProfile);
          }
        }
      } else {
        console.log("ℹ️ No active session found");
        setSession(null);
        setUser(null);
        setProfile(null);
        lastSessionIdRef.current = null;
      }
    } catch (error) {
      console.error("❌ Error initializing auth:", error);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [supabase, ensureUserProfile]);

  // Handle auth state changes
  const handleAuthStateChange = useCallback(
    (event: AuthChangeEvent, currentSession: Session | null) => {
      if (!isMountedRef.current) return;

      console.log("🔔 Auth state change:", event, currentSession?.user?.email);

      // Clear any existing timeout
      if (authStateChangeTimeoutRef.current) {
        clearTimeout(authStateChangeTimeoutRef.current);
      }

      // Debounce auth state changes
      authStateChangeTimeoutRef.current = setTimeout(async () => {
        if (!isMountedRef.current) return;

        try {
          const sessionId = currentSession?.access_token || null;

          // Only update if session actually changed
          if (lastSessionIdRef.current !== sessionId) {
            lastSessionIdRef.current = sessionId;

            setSession(currentSession);
            setUser(currentSession?.user || null);

            if (event === "SIGNED_IN" && currentSession?.user) {
              console.log("🔑 User signed in:", currentSession.user.email);

              // Ensure profile exists
              const userProfile = await ensureUserProfile(currentSession.user);
              if (userProfile && isMountedRef.current) {
                setProfile(userProfile);
              }

              // Refresh router only on actual sign-in
              router.refresh();
            } else if (event === "SIGNED_OUT") {
              console.log("🚪 User signed out");
              setProfile(null);
              lastSessionIdRef.current = null;
            } else if (event === "TOKEN_REFRESHED") {
              console.log(
                "🔄 Token refreshed for:",
                currentSession?.user?.email
              );
              // No additional actions needed - session and user are already updated
            }
          }
        } catch (error) {
          console.error("❌ Error in auth state change handler:", error);
        } finally {
          if (isMountedRef.current) {
            setIsLoading(false);
          }
        }
      }, 100); // Debounce for 100ms
    },
    [router, ensureUserProfile]
  );

  // Initialize auth on mount
  useEffect(() => {
    isMountedRef.current = true;

    initializeAuth();

    // Set up auth state change listener
    console.log("📡 Setting up auth state change listener");
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    return () => {
      console.log("🧹 Cleaning up auth listener");
      isMountedRef.current = false;
      if (authStateChangeTimeoutRef.current) {
        clearTimeout(authStateChangeTimeoutRef.current);
      }
      subscription.unsubscribe();
    };
  }, [supabase, initializeAuth, handleAuthStateChange]);

  const login = async (email: string, password: string) => {
    console.log("🔑 Login attempt for:", email);
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("❌ Login error:", error);
        throw error;
      }

      console.log("✅ Login successful:", data);
    } catch (error) {
      console.error("❌ Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, username: string, password: string) => {
    console.log("📝 Sign up attempt for:", email, "with username:", username);
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error("❌ Sign up error:", error);
        throw error;
      }

      console.log("✅ Sign up successful:", data);

      // Profile creation will be handled by the auth state change listener
      // No need to create profile here to avoid duplication
    } catch (error) {
      console.error("❌ Sign up error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    console.log("🌐 Google login attempt");
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error("❌ Google login error:", error);
        throw error;
      }

      console.log("✅ Google OAuth started:", data);
    } catch (error) {
      console.error("❌ Google login error:", error);
      throw error;
    }
  };

  const logout = async () => {
    console.log("🚪 Logout attempt");

    // Always perform cleanup, regardless of Supabase errors
    const performCleanup = () => {
      // Clear auth state
      setProfile(null);
      setUser(null);
      setSession(null);
      lastSessionIdRef.current = null;

      // Stop background task engine
      try {
        stopTaskEngine();
      } catch (e) {
        console.warn("Failed to stop task engine:", e);
      }

      // Clear localStorage completely
      if (typeof window !== "undefined") {
        try {
          const keysToRemove = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (
              key &&
              (key.startsWith("node_") ||
                key.startsWith("task_") ||
                key.startsWith("earnings_") ||
                key.startsWith("swarm_") ||
                key === "node-state" ||
                key === "task-state" ||
                key === "earnings-state")
            ) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach((key) => localStorage.removeItem(key));
        } catch (e) {
          console.warn("Failed to clear localStorage:", e);
        }
      }

      console.log("✅ Local cleanup completed");

      // Force redirect
      router.push("/");
      router.refresh();
    };

    try {
      // Try to sign out from Supabase, but don't let errors block cleanup
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (currentSession) {
        await supabase.auth.signOut();
        console.log("📝 Supabase signout successful");
      } else {
        console.log("📝 No active session found");
      }
    } catch (error) {
      // Ignore all Supabase errors - just log them
      console.warn("⚠️ Supabase logout error (ignored):", error);
    }

    // Always perform cleanup regardless of Supabase result
    performCleanup();
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) {
      console.error("❌ Cannot update profile: user or profile is null");
      return;
    }

    console.log(
      "✏️ Updating profile for user:",
      user.id,
      "with data:",
      updates
    );
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .update(updates)
        .eq("id", user.id)
        .select()
        .single();

      if (error) {
        console.error("❌ Error updating profile:", error);
        throw error;
      }

      console.log("✅ Profile updated successfully:", data);
      if (isMountedRef.current) {
        setProfile({ ...profile, ...data });
      }
    } catch (error) {
      console.error("❌ Error updating profile:", error);
      throw error;
    }
  };

  const refreshProfile = async () => {
    if (!user) {
      console.log("⚠️ Cannot refresh profile: no user logged in");
      return;
    }

    console.log("🔄 Refreshing profile for user:", user.id);
    try {
      const updatedProfile = await fetchUserProfile(user.id);
      if (updatedProfile && isMountedRef.current) {
        console.log("✅ Profile refreshed:", updatedProfile);
        setProfile(updatedProfile);
      } else {
        console.log("⚠️ No profile found during refresh");
      }
    } catch (error) {
      console.error("❌ Error refreshing profile:", error);
    }
  };

  // Helper functions
  const generateReferralCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    console.log("🎫 Generated referral code:", result);
    return result;
  };

  console.log("🔄 Auth context current state:", {
    isLoggedIn: !!user,
    user: user?.id,
    email: user?.email,
    hasProfile: !!profile,
    isLoading,
  });

  const value: AuthContextType = {
    user,
    profile,
    session,
    isLoading,
    isLoggedIn: !!user,
    login,
    signUp,
    loginWithGoogle,
    logout,
    updateProfile,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
