"use client";

import React from "react";
import { Clock, AlertCircle, Info } from "lucide-react";

interface RateLimitBadgeProps {
  type: "password" | "account_deletion" | "earnings_claim" | "support" | "device" | "profile";
  variant?: "info" | "warning" | "error";
  className?: string;
}

const RATE_LIMITS = {
  password: {
    limit: "5 attempts",
    period: "per hour",
    icon: Clock,
    description: "Password changes are limited to protect your account security",
    color: "yellow"
  },
  account_deletion: {
    limit: "1 attempt",
    period: "per hour",
    icon: AlertCircle,
    description: "Account deletion is strictly limited for security",
    color: "red"
  },
  earnings_claim: {
    limit: "100 claims",
    period: "per day",
    icon: Clock,
    description: "Daily claim limit to prevent abuse",
    color: "blue"
  },
  support: {
    limit: "5 tickets",
    period: "per hour",
    icon: Info,
    description: "Support ticket limit to manage queue effectively",
    color: "blue"
  },
  device: {
    limit: "10 devices",
    period: "per hour",
    icon: Clock,
    description: "Device registration limit to prevent spam",
    color: "blue"
  },
  profile: {
    limit: "5 updates",
    period: "per hour",
    icon: Clock,
    description: "Profile update limit for security",
    color: "yellow"
  }
};

export const RateLimitBadge: React.FC<RateLimitBadgeProps> = ({ 
  type, 
  variant = "info",
  className = "" 
}) => {
  const config = RATE_LIMITS[type];
  const Icon = config.icon;

  const colorClasses = {
    info: {
      blue: "bg-blue-500/10 border-blue-500/30 text-blue-400",
      yellow: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
      red: "bg-red-500/10 border-red-500/30 text-red-400"
    },
    warning: {
      blue: "bg-blue-500/20 border-blue-500/40 text-blue-300",
      yellow: "bg-yellow-500/20 border-yellow-500/40 text-yellow-300",
      red: "bg-red-500/20 border-red-500/40 text-red-300"
    },
    error: {
      blue: "bg-blue-500/30 border-blue-500/50 text-blue-200",
      yellow: "bg-yellow-500/30 border-yellow-500/50 text-yellow-200",
      red: "bg-red-500/30 border-red-500/50 text-red-200"
    }
  };

  const colorClass = colorClasses[variant][config.color as keyof typeof colorClasses.info];

  return (
    <div className={`flex items-start gap-2 p-3 rounded-lg border ${colorClass} ${className}`}>
      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <div className="flex-1 text-xs">
        <div className="font-medium mb-1">
          Rate Limit: {config.limit} {config.period}
        </div>
        <div className="opacity-80">
          {config.description}
        </div>
      </div>
    </div>
  );
};

interface RateLimitInlineProps {
  type: "password" | "account_deletion" | "earnings_claim" | "support" | "device" | "profile";
  className?: string;
}

export const RateLimitInline: React.FC<RateLimitInlineProps> = ({ type, className = "" }) => {
  const config = RATE_LIMITS[type];

  return (
    <span className={`text-xs text-gray-400 ${className}`}>
      ({config.limit} {config.period})
    </span>
  );
};
