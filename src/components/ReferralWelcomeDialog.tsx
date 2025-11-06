"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, X, UserPlus, LogIn, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReferralWelcomeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSignup: () => void;
  onLogin: () => void;
  referrerName?: string;
  referralCode?: string;
}

export const ReferralWelcomeDialog: React.FC<ReferralWelcomeDialogProps> = ({
  isOpen,
  onClose,
  onSignup,
  onLogin,
  referrerName,
  referralCode,
}) => {
  const handleDontShowAgain = () => {
    localStorage.setItem('referral_popup_dismissed', 'true');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#1a1a2e] rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden border border-blue-500/20"
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -z-10" />

            {/* Close button */}
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-8">
              {/* Icon and title */}
              <div className="text-center mb-6">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
                  <Gift className="w-8 h-8 text-white" />
                </div>
                
                {referrerName ? (
                  <>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-400 text-transparent bg-clip-text mb-2">
                      🎉 You've Been Referred!
                    </h2>
                    <p className="text-gray-300 text-sm mb-4">
                      <span className="text-blue-400 font-semibold">{referrerName}</span> invited you to join
                    </p>
                    
                    {/* Big SP Reward Display */}
                    <div className="relative bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-500/50 rounded-2xl p-6 mb-4 overflow-hidden">
                      {/* Animated background sparkle effect */}
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(16,185,129,0.1),transparent)]" />
                      
                      <div className="relative z-10 text-center">
                        <div className="flex items-center justify-center gap-3 mb-2">
                          <Gift className="w-8 h-8 text-green-400 animate-pulse" />
                          <p className="text-green-400 font-bold text-4xl">
                            500 SP
                          </p>
                          <Gift className="w-8 h-8 text-green-400 animate-pulse" />
                        </div>
                        <p className="text-green-300 font-semibold text-lg">
                          Welcome Bonus!
                        </p>
                        <p className="text-green-200 text-sm mt-1 opacity-80">
                          Credited instantly upon signup
                        </p>
                      </div>
                    </div>

                    {/* Referrer gets bonus too */}
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 mb-4">
                      <p className="text-blue-300 text-sm text-center">
                        <span className="text-blue-400 font-semibold">{referrerName}</span> will get{' '}
                        <strong className="text-blue-400">250 SP</strong> when you join!
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 text-transparent bg-clip-text mb-2">
                      Welcome to Swarm!
                    </h2>
                    <p className="text-gray-300 text-sm">
                      Create an account or login to get started
                    </p>
                  </>
                )}
              </div>

              {/* Benefits */}
              <div className="bg-blue-900/20 border border-blue-500/20 rounded-xl p-4 mb-6">
                <h3 className="text-blue-300 font-medium mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  {referrerName ? 'Your Referral Benefits' : 'Get Started Benefits'}
                </h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  {referrerName && (
                    <>
                      <li className="flex items-start gap-2">
                        <span className="text-green-400 mt-0.5">✓</span>
                        <span>Get <strong className="text-green-400">500 SP</strong> welcome bonus</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-0.5">✓</span>
                        <span>{referrerName} gets <strong className="text-blue-400">250 SP</strong> signup bonus</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-400 mt-0.5">✓</span>
                        <span>Join the tiered referral program</span>
                      </li>
                    </>
                  )}
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-400 mt-0.5">✓</span>
                    <span>Start earning rewards immediately</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-pink-400 mt-0.5">✓</span>
                    <span>Access exclusive features</span>
                  </li>
                </ul>
              </div>

              {/* Referral code display */}
              {referralCode && (
                <div className="bg-black/20 rounded-lg p-3 mb-6 border border-blue-500/20">
                  <p className="text-gray-400 text-xs mb-1">Referral Code</p>
                  <p className="text-white font-mono font-bold text-lg">{referralCode}</p>
                  <p className="text-gray-500 text-xs mt-1">Will be applied automatically when you sign up</p>
                </div>
              )}

              {/* Action buttons */}
              <div className="space-y-3">
                <Button
                  onClick={onSignup}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-5 h-5" />
                  Create Account {referrerName && '& Claim Bonus'}
                </Button>

                <Button
                  onClick={onLogin}
                  variant="outline"
                  className="w-full bg-transparent border-gray-600 hover:bg-gray-800 text-gray-300 rounded-xl py-3 flex items-center justify-center gap-2"
                >
                  <LogIn className="w-5 h-5" />
                  Already Have an Account? Login
                </Button>

                <div className="flex gap-3 mt-4">
                  <Button
                    onClick={onClose}
                    variant="ghost"
                    className="flex-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl py-2 text-sm"
                  >
                    Maybe Later
                  </Button>
                  <Button
                    onClick={handleDontShowAgain}
                    variant="ghost"
                    className="flex-1 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-xl py-2 text-sm"
                  >
                    Don't Show Again
                  </Button>
                </div>
              </div>

              {/* Footer note */}
              <p className="text-gray-500 text-xs text-center mt-6">
                {referrerName 
                  ? 'Your referral bonus will be credited after account creation'
                  : 'Join thousands of users earning rewards'}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
