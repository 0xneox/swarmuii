"use client";

import { useState, useEffect } from 'react';
import { referralService } from '@/lib/api/referrals';

interface ReferralDetection {
  hasCode: boolean;
  code: string | null;
  referrerName: string | null;
  isVerified: boolean;
}

export const useReferralCodeDetection = () => {
  const [detection, setDetection] = useState<ReferralDetection>({
    hasCode: false,
    code: null,
    referrerName: null,
    isVerified: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const detectAndVerifyReferralCode = async () => {
      try {
        // Check if popup was dismissed permanently
        const dismissed = localStorage.getItem('referral_popup_dismissed');
        if (dismissed === 'true') {
          setIsLoading(false);
          return;
        }

        // Check URL parameters - must be done client-side
        if (typeof window === 'undefined') {
          setIsLoading(false);
          return;
        }

        const urlParams = new URLSearchParams(window.location.search);
        const refCode = urlParams.get('ref');

        if (refCode) {
          const upperCode = refCode.toUpperCase();
          
          // Store in session storage for persistence during signup
          sessionStorage.setItem('detected_referral_code', upperCode);

          // Verify the code with backend
          try {
            const result = await referralService.verifyCode({ 
              referralCode: upperCode
            });

            if (result.valid && result.referrer) {
              setDetection({
                hasCode: true,
                code: upperCode,
                referrerName: result.referrer.username,
                isVerified: true,
              });
              
              // Store referrer info in session storage
              sessionStorage.setItem('referrer_name', result.referrer.username);
            } else {
              setDetection({
                hasCode: true,
                code: upperCode,
                referrerName: null,
                isVerified: false,
              });
            }
          } catch (error) {
            // If verification fails, still show the popup but mark as unverified
            setDetection({
              hasCode: true,
              code: upperCode,
              referrerName: null,
              isVerified: false,
            });
          }
        } else {
          // Check if code exists in session storage (user navigated away and back)
          const storedCode = sessionStorage.getItem('detected_referral_code');
          const storedReferrer = sessionStorage.getItem('referrer_name');

          if (storedCode) {
            setDetection({
              hasCode: true,
              code: storedCode,
              referrerName: storedReferrer,
              isVerified: !!storedReferrer,
            });
          }
        }
      } catch (error) {
        // Silent error handling
      } finally {
        setIsLoading(false);
      }
    };

    detectAndVerifyReferralCode();
  }, []);

  const clearDetection = () => {
    sessionStorage.removeItem('detected_referral_code');
    sessionStorage.removeItem('referrer_name');
    setDetection({
      hasCode: false,
      code: null,
      referrerName: null,
      isVerified: false,
    });
  };

  return {
    ...detection,
    isLoading,
    clearDetection,
  };
};
