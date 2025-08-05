"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { validateSession } from "@/lib/sessionUtils";
import { useRouter } from "next/navigation";

interface SessionGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function SessionGuard({
  children,
  requireAuth = false,
  fallback = null,
  redirectTo = "/",
}: SessionGuardProps) {
  const { user, isLoading } = useAuth();
  const [isValidating, setIsValidating] = useState(true);
  const [sessionValid, setSessionValid] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const validateCurrentSession = async () => {
      if (isLoading) return;

      try {
        const validation = await validateSession();

        if (isMounted) {
          setSessionValid(validation.isValid);

          // If session is invalid and auth is required, redirect
          if (!validation.isValid && requireAuth) {
            console.log("🚫 Invalid session, redirecting to:", redirectTo);
            router.push(redirectTo);
          }
        }
      } catch (error) {
        console.error("❌ Session validation error:", error);
        if (isMounted && requireAuth) {
          router.push(redirectTo);
        }
      } finally {
        if (isMounted) {
          setIsValidating(false);
        }
      }
    };

    validateCurrentSession();

    return () => {
      isMounted = false;
    };
  }, [isLoading, requireAuth, redirectTo, router]);

  // Show loading state while validating
  if (isLoading || isValidating) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )
    );
  }

  // If auth is required but user is not authenticated
  if (requireAuth && !user) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">
              Authentication Required
            </h2>
            <p className="text-gray-600">Please log in to access this page.</p>
          </div>
        </div>
      )
    );
  }

  // If auth is required but session is invalid
  if (requireAuth && !sessionValid) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Session Expired</h2>
            <p className="text-gray-600">Please log in again to continue.</p>
          </div>
        </div>
      )
    );
  }

  // If auth is not required but user is authenticated, allow access
  if (!requireAuth) {
    return <>{children}</>;
  }

  // If auth is required and user is authenticated with valid session
  if (requireAuth && user && sessionValid) {
    return <>{children}</>;
  }

  // Fallback
  return fallback || null;
}

// Higher-order component for protecting routes
export function withSessionGuard<P extends object>(
  Component: React.ComponentType<P>,
  requireAuth: boolean = false,
  redirectTo: string = "/"
) {
  return function ProtectedComponent(props: P) {
    return (
      <SessionGuard requireAuth={requireAuth} redirectTo={redirectTo}>
        <Component {...props} />
      </SessionGuard>
    );
  };
}
