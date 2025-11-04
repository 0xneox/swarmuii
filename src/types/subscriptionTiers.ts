// src/types/subscriptionTiers.ts

export interface AiCredits {
  neuroImageGen: number | 'limited' | 'unlimited';
  freedomAI: number | 'unlimited';
  musicVideo: number;
  deepfake: number;
  videoGenerator: number;
  creator3D: boolean | 'unlimited';
}

export interface SubscriptionTier {
  name: string;
  price: number;
  maxUptime: number; // in seconds
  deviceLimit: number;
  aiCredits: AiCredits;
  benefits: string[];
}

export const subscriptionTiers: SubscriptionTier[] = [
  {
    name: "basic",
    price: 10,
    maxUptime: 10 * 60 * 60, // 10 hours = 36000s
    deviceLimit: 1,
    aiCredits: {
      neuroImageGen: "limited",
      freedomAI: 10000,
      musicVideo: 0,
      deepfake: 0,
      videoGenerator: 0,
      creator3D: false
    },
    benefits: [
      "Neuro Image Gen",
      "Freedom AI with 10,000 credits",
      "10 Hr on 1 device Swarm Node connection"
    ]
  },
  {
    name: "ultimate",
    price: 15,
    maxUptime: 12 * 60 * 60, // 12 hours = 43200s (4 base + 8 extra from Compute App)
    deviceLimit: 2,
    aiCredits: {
      neuroImageGen: "unlimited",
      freedomAI: "unlimited",
      musicVideo: 0,
      deepfake: 0,
      videoGenerator: 0,
      creator3D: false
    },
    benefits: [
      "Neuro Image Gen - unlimited",
      "Freedom AI - unlimited",
      "12 Hr on 2 device Swarm Node connection"
    ]
  },
  {
    name: "enterprise",
    price: 50,
    maxUptime: 24 * 60 * 60, // 24 hours = 86400s
    deviceLimit: 6,
    aiCredits: {
      neuroImageGen: "unlimited",
      freedomAI: "unlimited",
      musicVideo: 20000,
      deepfake: 20000,
      videoGenerator: 10000,
      creator3D: "unlimited"
    },
    benefits: [
      "Neuro Image Gen - unlimited",
      "Freedom AI - unlimited",
      "3D Creator - unlimited",
      "AI Music Video - 20,000 credits",
      "AI Deepfake Studio - 20,000 credits",
      "AI Video Generator - 10,000 credits",
      "Full day on 6 device Swarm Node connection"
    ]
  }
];

export const getTierByName = (name: string): SubscriptionTier =>
  subscriptionTiers.find((tier) => tier.name.toLowerCase() === name.toLowerCase()) ?? freeSubscriptionTier;

// ✅ Free tier (matches backend)
export const freeSubscriptionTier: SubscriptionTier = {
  name: "free",
  price: 0,
  maxUptime: 4 * 60 * 60, // 4 hours
  deviceLimit: 1,
  aiCredits: {
    neuroImageGen: 100,
    freedomAI: 100,
    musicVideo: 0,
    deepfake: 0,
    videoGenerator: 0,
    creator3D: false
  },
  benefits: [
    "Basic Access",
    "4 Hr on 1 device Swarm Node",
    "Limited AI Credits"
  ]
};
