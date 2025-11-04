"use client";

import React, { useState, useEffect } from "react";
import {
  Copy,
  Users,
  CheckCircle,
  User,
  Clock,
  DollarSign,
  RefreshCw,
  AlertCircle,
  Share2,
  Check,
  X as CloseIcon,
  Link as LinkIcon,
  Lock,
  Gift,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ReferralStatCard } from "./ReferralStatCard";
import { User as LucideUser } from "lucide-react";
import { useReferrals } from "@/hooks/useRefferals";
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/lib/toast';
import { referralService } from "@/lib/api/referrals";
import { motion, AnimatePresence } from "framer-motion";
import { FaSquareXTwitter, FaWhatsapp, FaTelegram } from "react-icons/fa6";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  referralLink: string | null;
}

interface UnclaimedReward {
  reward_id: string;
  referral_id: string;
  reward_amount: number;
  claimed_at: string | null;
  referred_id: string;
  referred_name: string;
  referrer_id: string;
}

export const ReferralProgram = () => {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [referralError, setReferralError] = useState("");
  const [referralSuccess, setReferralSuccess] = useState(false);
  const [referralData, setReferralData] = useState<any>(null);
  const [unclaimedRewards, setUnclaimedRewards] = useState<UnclaimedReward[]>([]);
  const [totalReferralEarnings, setTotalReferralEarnings] = useState(0);
  const [claimedRewards, setClaimedRewards] = useState(0);
  const [pendingRewards, setPendingRewards] = useState(0);
  const [isClaimingReward, setIsClaimingReward] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [isReferred, setIsReferred] = useState(false);
  const [referrerInfo, setReferrerInfo] = useState<any>(null);

  const { user } = useAuth();
  const userProfile = user;
  const {
    verifyReferralCode,
    createReferralRelationship,
    getMyReferrals,
    isVerifying,
    isCreating,
    isFetching
  } = useReferrals();

  // Load referral data
  useEffect(() => {
    if (user?.id && !isLoading) {
      loadReferralData();
      checkIfUserIsReferred();
    }
  }, [user?.id]);

  const loadReferralData = async () => {
    setIsLoading(true);
    try {
      // Get my referrals using Express backend
      const myReferrals = await referralService.getReferrals();
      setReferralData({ referrals: myReferrals || [], total_referrals: myReferrals?.length || 0 });

      // Get referral stats from Express backend
      const stats = await referralService.getStats();
      console.log('Referral stats loaded:', stats);
      
      // Map backend stats to component state
      setTotalReferralEarnings(stats?.total_rewards ?? 0);
      setClaimedRewards((stats?.total_rewards ?? 0) - (stats?.pending_rewards ?? 0));
      setPendingRewards(stats?.pending_rewards ?? 0);
      
      // For unclaimed rewards, we would need a separate endpoint
      // For now, we'll construct it from stats
      setUnclaimedRewards([]);

    } catch (error) {
      // Silently handle 404 - backend not fully implemented
      if (error instanceof Error && error.message.includes('404')) {
        console.warn('Referral endpoints not fully available yet');
      } else {
        console.error('Error loading referral data:', error);
      }
      // Set default values
      setReferralData({ referrals: [], total_referrals: 0 });
      setTotalReferralEarnings(0);
      setClaimedRewards(0);
      setPendingRewards(0);
      setUnclaimedRewards([]);
    } finally {
      setIsLoading(false);
    }
  };

  const checkIfUserIsReferred = async () => {
    if (!user?.id) return;

    try {
      // Check if user has referrals (if they have referrals, they were referred)
      const myReferrals = await referralService.getReferrals();
      
      // User is considered referred if they joined through a referral code
      // This would ideally come from user profile, but we can infer from data
      setIsReferred(false); // Default to false, backend should provide this info
      setReferrerInfo(null);
    } catch (error) {
      console.error('Error checking referral status:', error);
      setIsReferred(false);
      setReferrerInfo(null);
    }
  };

  const userReferralCode = userProfile?.referralCode || null;
  const referralLink = userReferralCode && typeof window !== "undefined"
    ? `${window.location.origin}?ref=${userReferralCode}`
    : null;

  // Filter referrals by tier
  const tier1Referrals = referralData?.referrals?.filter((ref: any) => ref.tier_level === "tier_1") || [];
  const tier2Referrals = referralData?.referrals?.filter((ref: any) => ref.tier_level === "tier_2") || [];
  const tier3Referrals = referralData?.referrals?.filter((ref: any) => ref.tier_level === "tier_3") || [];

  const handleCopyReferralLink = async () => {
    if (!referralLink) {
      console.error("Please sign in to get your referral code");
      return;
    }

    try {
      await navigator.clipboard.writeText(referralLink);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    } catch (err) {
      console.error("Failed to copy referral link:", err);
    }
  };

  const extractReferralCodeFromInput = (input: string): string => {
    if (!input.trim()) return '';

    if (input.includes('://') || input.includes('?ref=')) {
      try {
        let urlString = input;
        if (!input.startsWith('http://') && !input.startsWith('https://')) {
          urlString = 'https://' + input;
        }

        const url = new URL(urlString);
        const refParam = url.searchParams.get('ref');

        if (refParam) {
          return refParam.trim();
        }
      } catch (error) {
        const refMatch = input.match(/[?&]ref=([^&\s]+)/i);
        if (refMatch && refMatch[1]) {
          return refMatch[1].trim().toUpperCase();
        }
      }
    }

    return input.trim().toUpperCase();
  };

  const handleVerifyReferralCode = async () => {
    const extractedCode = extractReferralCodeFromInput(referralCode);

    if (!extractedCode) {
      setReferralError("Please enter a referral code or link");
      return;
    }

    try {
      const { referrerId, error } = await verifyReferralCode(extractedCode);

      if (error) {
        setReferralError(error.message);
        setReferralSuccess(false);
        return;
      }

      if (!referrerId) {
        setReferralError("Invalid referral code");
        setReferralSuccess(false);
        return;
      }

      const { success, error: createError } = await createReferralRelationship(
        extractedCode,
        user!.id
      );

      if (createError) {
        setReferralError(createError.message);
        setReferralSuccess(false);
        return;
      }

      if (success) {
        // Backend should handle reward creation automatically
        setReferralSuccess(true);
        setReferralError("");
        setReferralCode("");
        await loadReferralData();
        setTimeout(() => {
          setReferralSuccess(false);
        }, 3000);
      }
    } catch (err) {
      console.error("Error verifying referral code:", err);
      setReferralError("An error occurred while verifying the code");
      setReferralSuccess(false);
    }
  };

  const handleClaimReward = async (rewardId: string, amount: number) => {
    if (isClaimingReward) return;

    setIsClaimingReward(true);
    try {
      // TODO: Implement claim reward endpoint in Express backend
      // This would be: await referralService.claimReward(rewardId);
      console.warn('Referral reward claiming not yet implemented in Express backend');
      toast.info('Referral reward claiming feature coming soon!');
      
      // For now, just refresh data
      await loadReferralData();
    } catch (error) {
      console.error('Error claiming reward:', error);
      toast.error('Failed to claim reward');
    } finally {
      setIsClaimingReward(false);
    }
  };

  const openSocialShare = (shareUrl: string) => {
    window.open(shareUrl, "_blank", "width=600,height=400");
  };

  const getShareMessage = (platform: string) => {
    if (!referralLink) return null;

    const twitterMessage = `🚀 NeuroSwarm Airdrop Confirmed!\nSecure your spot in the $NLOV Connect-to-Earn revolution 🌐\n💰 100M $NLOV tokens available\n📲 Connect your phone, laptop, or GPU — start earning in one click!\n🎯 Join before TGE\n🔗 ${referralLink}`;

    const encodedTwitterMessage = encodeURIComponent(twitterMessage);

    switch (platform) {
      case "Twitter":
        return `https://twitter.com/intent/tweet?text=${encodedTwitterMessage}`;
      default:
        return referralLink;
    }
  };

  const ShareModal = ({ isOpen, onClose, referralLink }: ShareModalProps) => {
    const [isCopied, setIsCopied] = useState(false);

    const copyToClipboard = async () => {
      if (!referralLink) return;
      try {
        await navigator.clipboard.writeText(referralLink);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy link:", err);
      }
    };

    const getShareMessage = (platform: string) => {
      if (!referralLink) return null;

      const message = `🚀 NeuroSwarm Airdrop Confirmed!\nSecure your spot in the $NLOV Connect-to-Earn revolution 🌐\n💰 100M $NLOV tokens available\n📲 Connect your phone, laptop, or GPU — start earning in one click!\n🎯 Join before TGE\n🔗 ${referralLink}`;

      switch (platform) {
        case "whatsapp":
          return `https://wa.me/?text=${encodeURIComponent(message)}`;
        case "telegram":
          return `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(message)}`;
        default:
          return referralLink;
      }
    };

    const openSocialShare = (platform: string) => {
      const url = getShareMessage(platform);
      if (url) {
        window.open(url, "_blank", "width=600,height=400");
      }
    };

    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl shadow-2xl w-96 p-8 relative overflow-hidden"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <button
                className="absolute top-4 right-4 text-gray-300 hover:text-white"
                onClick={onClose}
              >
                <CloseIcon className="w-5 h-5" />
              </button>

              <div className="text-center mb-6">
                <Share2 className="mx-auto w-12 h-12 text-blue-400 mb-4" />
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 text-transparent bg-clip-text">
                  Share Referral
                </h2>
              </div>

              <div className="mb-6 p-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/20 rounded-xl mt-4">
                <p className="text-blue-300 text-sm font-medium mb-2">How Referrals Work:</p>
                <ul className="text-gray-300 text-xs space-y-2">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>You get <span className="text-green-400 font-medium">250 SP</span> for each successful referral</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Your friend gets <span className="text-green-400 font-medium">500 SP</span> when they join with your link</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Limited-time promotional period - invite now!</span>
                  </li>
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <motion.button
                  className="flex items-center justify-center gap-2 bg-[#0088CC] p-3 rounded-lg hover:bg-[#0088CC]/80"
                  onClick={() => openSocialShare("telegram")}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FaTelegram className="w-5 h-5" />
                  <span className="text-sm">Telegram</span>
                </motion.button>

                <motion.button
                  className="flex items-center justify-center gap-2 bg-[#25D366] p-3 rounded-lg hover:bg-[#25D366]/80"
                  onClick={() => openSocialShare("whatsapp")}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FaWhatsapp className="w-5 h-5" />
                  <span className="text-sm">WhatsApp</span>
                </motion.button>
              </div>

              <div className="bg-black/20 p-4 rounded-lg border border-blue-500/20">
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={referralLink || ""}
                    readOnly
                    className="flex-1 bg-transparent text-sm text-white focus:outline-none overflow-hidden"
                  />
                  <motion.button
                    className={`p-2 rounded-full ${isCopied ? "bg-green-500/20" : "bg-blue-500/20"}`}
                    onClick={copyToClipboard}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {isCopied ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-blue-400" />
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  // Show authentication required UI if user is not logged in
  if (!user) {
    return (
      <div className="flex flex-col stat-card">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl">Referral Program</h2>
        </div>

        <div className="flex flex-col items-center justify-center h-[400px] p-8 bg-[#161628] rounded-lg">
          <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-blue-500/10">
            <Lock className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="text-xl font-semibold text-blue-400 mb-2">
            Authentication Required
          </h3>
          <p className="text-slate-400 text-center mb-6">
            Please sign in to access this feature and view your personalized data.
          </p>
          <Button 
            className="gradient-button px-6 py-2 rounded-full"
            onClick={() => {
              // Trigger auth modal - you can customize this
              const signInButton = document.querySelector('[data-auth-button]') as HTMLElement;
              if (signInButton) signInButton.click();
            }}
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              ></path>
            </svg>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 p-3 sm:p-6 rounded-3xl max-w-full overflow-x-hidden">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <ReferralStatCard
          label="First Tier"
          value={isLoading ? "..." : tier1Referrals.length}
          icon={<LucideUser className="w-5 h-5 text-white" />}
          backgroundImage={"/images/flower_1.png"}
          description={`${tier1Referrals.length} direct referrals`}
        />
        <ReferralStatCard
          label="Second Tier"
          value={isLoading ? "..." : tier2Referrals.length}
          icon={<LucideUser className="w-5 h-5 text-white" />}
          backgroundImage={"/images/flower_1.png"}
          description={`${tier2Referrals.length} indirect referrals`}
        />
        <ReferralStatCard
          label="Third Tier"
          value={isLoading ? "..." : tier3Referrals.length}
          icon={<LucideUser className="w-5 h-5 text-white" />}
          backgroundImage={"/images/flower_1.png"}
          description={`${tier3Referrals.length} indirect referrals`}
        />
        <ReferralStatCard
          label="Total Referral Rewards"
          value={
            isLoading
              ? "..."
              : `${totalReferralEarnings.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })} SP`
          }
          backgroundImage={"/images/flower_2.png"}
          highlight
          description={`From ${referralData?.total_referrals || 0} total referrals`}
        />
      </div>

      {/* Share Buttons */}
      {true ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
          <motion.button
            className="gradient-button py-3 sm:py-4 flex items-center justify-center gap-2 relative overflow-hidden"
            onClick={() => setIsShareModalOpen(true)}
            initial="initial"
            whileHover="hover"
          >
            <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
            <div className="relative w-36 text-center">
              <motion.span
                className="text-sm sm:text-base absolute left-0 right-0 whitespace-nowrap"
                variants={{
                  initial: { opacity: 1 },
                  hover: { opacity: 0 }
                }}
                transition={{ duration: 0.3 }}
              >
                Promotional Period
              </motion.span>
              <motion.span
                className="text-sm sm:text-base whitespace-nowrap"
                variants={{
                  initial: { opacity: 0 },
                  hover: { opacity: 1 }
                }}
                transition={{ duration: 0.3 }}
              >
                Share Referral
              </motion.span>
            </div>
          </motion.button>

          <motion.button
            className="gradient-button py-3 sm:py-4 flex items-center justify-center gap-2 relative overflow-hidden"
            onClick={() => {
              const shareUrl = getShareMessage("Twitter");
              if (shareUrl) {
                openSocialShare(shareUrl);
              }
            }}
            initial="initial"
            whileHover="hover"
          >
            <FaSquareXTwitter className="w-4 h-4 sm:w-5 sm:h-5" />
            <div className="relative w-36 text-center">
              <motion.span
                className="text-sm sm:text-base absolute left-0 right-0 whitespace-nowrap"
                variants={{
                  initial: { opacity: 1 },
                  hover: { opacity: 0 }
                }}
                transition={{ duration: 0.3 }}
              >
                Promotional Period
              </motion.span>
              <motion.span
                className="text-sm sm:text-base whitespace-nowrap"
                variants={{
                  initial: { opacity: 0 },
                  hover: { opacity: 1 }
                }}
                transition={{ duration: 0.3 }}
              >
                Tweet Referral
              </motion.span>
            </div>
          </motion.button>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 p-5 rounded-xl border border-blue-500/20 text-center">
          <Lock className="mx-auto h-10 w-10 text-blue-400 mb-2" />
          <h3 className="text-white font-medium mb-2">Sign In Required</h3>
          <p className="text-sm text-blue-300/80 mb-4">
            Please sign in or sign up to join the referral program and start
            earning rewards.
          </p>
        </div>
      )}

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        referralLink={referralLink}
      />

      {/* Referral Code Input Section */}
      {userProfile?.id && !isReferred && (
        <div className="bg-[radial-gradient(ellipse_at_top_left,#0361DA_0%,#090C18_54%)] p-3 sm:p-6 rounded-2xl border border-[#0361DA]/80">
          <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 p-5 rounded-xl border border-blue-500/20">
            <div className="flex items-center gap-2 mb-4">
              <LinkIcon className="h-5 w-5 text-blue-400" />
              <h3 className="text-white font-medium">Use Referral Code</h3>
            </div>

            <p className="text-sm text-blue-300/80 mb-4">
              Enter a referral code to join the program and earn rewards.
            </p>

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 w-full">
                <div className="relative flex-1 w-full">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <LinkIcon className="h-4 w-4 text-blue-400/60" />
                  </div>
                  <Input
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    className="pl-10 py-3 bg-[#111827]/50 border-blue-500/20 focus:border-blue-400 text-white rounded-xl focus-visible:ring-blue-500/30 focus-visible:ring-offset-0 w-full"
                    placeholder="Enter referral code or paste referral link"
                  />
                </div>
                <Button
                  onClick={handleVerifyReferralCode}
                  className="bg-blue-600 hover:bg-blue-700 rounded-xl px-5 py-3 flex items-center justify-center w-full sm:w-auto"
                  disabled={isVerifying || !referralCode.trim()}
                >
                  {isVerifying ? (
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  <span>{isVerifying ? "Verifying..." : "Verify & Join"}</span>
                </Button>
              </div>

              {referralError && (
                <p className="text-red-400 text-sm mt-2 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {referralError}
                </p>
              )}

              {referralSuccess && (
                <p className="text-green-400 text-sm mt-2 flex items-center">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Referral code successfully applied! Welcome to the program.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Already Referred Banner */}
      {userProfile?.id && isReferred && (
        <div className="bg-[radial-gradient(ellipse_at_top_left,#16a34a_0%,#0f172a_54%)] p-3 sm:p-6 rounded-2xl border border-green-500/40">
          <div className="bg-gradient-to-r from-green-600/10 to-emerald-600/10 p-5 rounded-xl border border-green-500/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-green-500/20 rounded-full p-2">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <h3 className="text-white font-medium mb-1">
                  You've been referred by {referrerInfo?.name || 'someone'}! 🎉
                </h3>
                <p className="text-sm text-green-300/80">
                  Now earn more by sharing your referral code on social media
                </p>
              </div>
            </div>

            <div className="bg-black/20 p-4 rounded-lg border border-green-500/20">
              <div className="flex items-center gap-2 mb-3">
                <Share2 className="w-4 h-4 text-green-400" />
                <span className="text-green-400 text-sm font-medium">Share & Earn More</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                <motion.button
                  onClick={() => {
                    const message = `🚀 Join me on Kyahaiye and start earning SP! Use my referral code: ${userReferralCode} ${referralLink}`;
                    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink || '')}&text=${encodeURIComponent(message)}`;
                    window.open(telegramUrl, '_blank', 'width=600,height=400');
                  }}
                  className="flex items-center justify-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3 py-2 rounded-lg transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FaTelegram className="w-4 h-4" />
                  <span className="text-xs">Telegram</span>
                </motion.button>

                <motion.button
                  onClick={() => {
                    const message = `🚀 Join me on Kyahaiye and start earning SP! Use my referral code: ${userReferralCode} ${referralLink}`;
                    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
                    window.open(whatsappUrl, '_blank', 'width=600,height=400');
                  }}
                  className="flex items-center justify-center gap-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 px-3 py-2 rounded-lg transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FaWhatsapp className="w-4 h-4" />
                  <span className="text-xs">WhatsApp</span>
                </motion.button>

                <motion.button
                  onClick={() => {
                    const message = `🚀 Join me on @Kyahaiye and start earning SP! 💰\n\nUse my referral code: ${userReferralCode}\n\n${referralLink}\n\n#Kyahaiye #EarnSP #ReferralProgram`;
                    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`;
                    window.open(twitterUrl, '_blank', 'width=600,height=400');
                  }}
                  className="flex items-center justify-center gap-2 bg-gray-700/20 hover:bg-gray-700/30 text-white px-3 py-2 rounded-lg transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FaSquareXTwitter className="w-4 h-4" />
                  <span className="text-xs">Twitter</span>
                </motion.button>

                <motion.button
                  onClick={async () => {
                    if (referralLink) {
                      try {
                        await navigator.clipboard.writeText(referralLink);
                        setCopySuccess(true);
                        setTimeout(() => setCopySuccess(false), 2000);
                      } catch (err) {
                        console.error('Failed to copy:', err);
                      }
                    }
                  }}
                  className={`flex items-center justify-center gap-2 ${copySuccess ? 'bg-green-500/20 text-green-400' : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-400'} px-3 py-2 rounded-lg transition-all`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {copySuccess ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span className="text-xs">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span className="text-xs">Copy Link</span>
                    </>
                  )}
                </motion.button>
              </div>

              <div className="bg-black/30 p-3 rounded-lg border border-green-500/10">
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={referralLink || ""}
                    readOnly
                    className="flex-1 bg-transparent text-sm text-green-300 focus:outline-none overflow-hidden"
                  />
                  <motion.button
                    className={`p-1 rounded-full ${copySuccess ? "bg-green-500/20" : "bg-green-500/20"}`}
                    onClick={async () => {
                      if (referralLink) {
                        try {
                          await navigator.clipboard.writeText(referralLink);
                          setCopySuccess(true);
                          setTimeout(() => setCopySuccess(false), 2000);
                        } catch (err) {
                          console.error('Failed to copy:', err);
                        }
                      }
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {copySuccess ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-green-400" />
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rewards Summary */}
      {userProfile?.id && (
        <div className="bg-[radial-gradient(ellipse_at_top_left,#0361DA_0%,#090C18_54%)] p-3 sm:p-6 rounded-2xl border border-[#0361DA]/80">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
            <div className="bg-[#161628] rounded-2xl p-4 sm:p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="icon-bg icon-container flex items-center justify-center rounded-md p-2">
                  <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-medium text-sm sm:text-base">
                      Claimed Rewards
                    </h3>
                    <span className="text-green-400 font-bold text-sm sm:text-base">
                      {claimedRewards.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      SP
                    </span>
                  </div>
                  <p className="text-[#515194]/80 text-xs sm:text-sm mt-1">
                    Total earning from claimed referral rewards
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[#161628] rounded-2xl p-4 sm:p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="icon-bg icon-container flex items-center justify-center rounded-md p-2">
                  <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-amber-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-medium text-sm sm:text-base">
                      Pending Rewards
                    </h3>
                    <span className="text-amber-400 font-bold text-sm sm:text-base">
                      {pendingRewards.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      SP
                    </span>
                  </div>
                  <p className="text-[#515194]/80 text-xs sm:text-sm mt-1">
                    Available rewards ready to claim
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Referral Earnings Breakdown */}
          <div className="space-y-3 sm:space-y-4 mt-4 sm:mt-6">
            <h3 className="text-white font-medium text-sm sm:text-base">
              Referral Earnings Breakdown
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
              <div className="bg-[#161628] rounded-2xl p-3 sm:p-6 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="icon-bg icon-container flex items-center justify-center rounded-md p-2">
                    <img
                      src="/images/referrals.png"
                      alt="Tier 1"
                      className="w-6 h-6 sm:w-8 sm:h-8 relative z-10"
                      style={{ objectFit: "contain" }}
                    />
                  </div>
                  <div>
                    <h4 className="text-white font-medium text-sm sm:text-base">
                      Tier 1
                    </h4>
                    <p className="text-blue-400 text-xs sm:text-sm">
                      Earn 10% from your direct referrals
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-[#161628] rounded-2xl p-3 sm:p-6 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="icon-bg icon-container flex items-center justify-center rounded-md p-2">
                    <img
                      src="/images/referrals.png"
                      alt="Tier 2"
                      className="w-6 h-6 sm:w-8 sm:h-8 relative z-10"
                      style={{ objectFit: "contain" }}
                    />
                  </div>
                  <div>
                    <h4 className="text-white font-medium text-sm sm:text-base">
                      Tier 2
                    </h4>
                    <p className="text-blue-400 text-xs sm:text-sm">
                      Earn 5% from their referrals
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-[#161628] rounded-2xl p-3 sm:p-6 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="icon-bg icon-container flex items-center justify-center rounded-md p-2">
                    <img
                      src="/images/referrals.png"
                      alt="Tier 3"
                      className="w-6 h-6 sm:w-8 sm:h-8 relative z-10"
                      style={{ objectFit: "contain" }}
                    />
                  </div>
                  <div>
                    <h4 className="text-white font-medium text-sm sm:text-base">
                      Tier 3
                    </h4>
                    <p className="text-blue-400 text-xs sm:text-sm">
                      Earn 2.5% from the next level
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unclaimed Rewards List */}
      {userProfile?.id && unclaimedRewards.length > 0 && (
        <div className="bg-[#161628] rounded-2xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-amber-500/20 rounded-full p-2">
                <Gift className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-white font-medium">Unclaimed Rewards</h3>
                <p className="text-[#515194] text-sm">
                  Claim rewards from your referrals
                </p>
              </div>
            </div>
            <span className="text-amber-400 font-bold text-lg">
              {pendingRewards.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })} SP
            </span>
          </div>

          <div className="space-y-4">
            {unclaimedRewards
              .filter(reward => Number(reward.reward_amount) > 0)
              .map((reward) => (
                <motion.div
                  key={reward.reward_id}
                  className="bg-[#1E1E3F] rounded-xl p-4 border border-amber-500/20"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-amber-500/20 rounded-full p-2">
                        <TrendingUp className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <h4 className="text-white font-medium">
                          Reward from {reward.referred_name}
                        </h4>
                        <p className="text-[#515194] text-sm">
                          Referral reward available to claim
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-amber-400 font-bold text-lg">
                          {Number(reward.reward_amount).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })} SP
                        </p>
                        <p className="text-[#515194] text-xs">Available</p>
                      </div>
                      <Button
                        onClick={() => handleClaimReward(reward.reward_id, Number(reward.reward_amount))}
                        disabled={isClaimingReward}
                        className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                      >
                        {isClaimingReward ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <DollarSign className="w-4 h-4" />
                        )}
                        <span>{isClaimingReward ? "Claiming..." : "Claim"}</span>
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
          </div>

          {claimSuccess && (
            <motion.div
              className="mt-4 p-4 bg-green-500/20 border border-green-500/40 rounded-xl"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <p className="text-green-400 font-medium">
                  Reward claimed successfully! Added to your earnings.
                </p>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Referral List */}
      {userProfile?.id && referralData?.referrals?.length > 0 && (
        <div className="bg-[#161628] rounded-2xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-medium">Your Referrals</h3>
            <span className="text-[#515194] text-sm">
              Total: {referralData.total_referrals}
            </span>
          </div>
          <div className="space-y-4">
            {referralData.referrals.map((ref: any) => (
              <div
                key={ref.user_id}
                className="flex items-center justify-between p-3 bg-[#1E1E3F] rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-white text-sm">{ref.user_name}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-[#515194] text-xs">
                        {ref.tier_level.replace('_', ' ').toUpperCase()}
                      </p>
                      <span className="text-[#515194]">•</span>
                      <p className="text-[#515194] text-xs">
                        Referred {new Date(ref.referred_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
