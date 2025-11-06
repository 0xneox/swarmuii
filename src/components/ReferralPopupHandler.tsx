"use client";

import { useState, useEffect } from 'react';
import { ReferralWelcomeDialog } from './ReferralWelcomeDialog';
import { useReferralCodeDetection } from '@/hooks/useReferralCodeDetection';
import { useAuth } from '@/contexts/AuthContext';

export function ReferralPopupHandler() {
  const { hasCode, code, referrerName, isVerified, isLoading } = useReferralCodeDetection();
  const { user } = useAuth();
  const [showDialog, setShowDialog] = useState(false);

  // Show welcome dialog when referral code is detected or for new visitors
  useEffect(() => {
    if (!isLoading && !user) {
      // Show for non-authenticated users (with or without referral code)
      // Small delay for better UX
      const timer = setTimeout(() => {
        setShowDialog(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, user, hasCode]);

  const handleSignup = () => {
    // Store referral code for signup if available
    if (code) {
      sessionStorage.setItem('pending_referral_code', code);
      if (referrerName) {
        sessionStorage.setItem('pending_referrer_name', referrerName);
      }
    }
    
    // Trigger signup modal (you'll need to implement this based on your auth system)
    // For now, we'll just close the dialog and the user can click signup button
    setShowDialog(false);
    
    // Try to trigger the auth modal
    const loginButton = document.querySelector('[data-auth-button]') as HTMLElement;
    if (loginButton) {
      loginButton.click();
      // Switch to signup tab after a brief delay
      setTimeout(() => {
        const signupTab = document.querySelector('[data-tab="signup"]') as HTMLElement;
        if (signupTab) signupTab.click();
      }, 100);
    }
  };

  const handleLogin = () => {
    setShowDialog(false);
    
    // Trigger login modal
    const loginButton = document.querySelector('[data-auth-button]') as HTMLElement;
    if (loginButton) {
      loginButton.click();
    }
  };

  // Don't render anything if user is already logged in
  if (user) return null;

  return (
    <ReferralWelcomeDialog
      isOpen={showDialog}
      onClose={() => setShowDialog(false)}
      onSignup={handleSignup}
      onLogin={handleLogin}
      referrerName={isVerified && referrerName ? referrerName : undefined}
      referralCode={code || undefined}
    />
  );
}
