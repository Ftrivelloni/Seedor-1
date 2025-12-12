/**
 * LemonSqueezy SDK Configuration
 *
 * This module initializes the LemonSqueezy SDK and provides
 * configuration constants for payment integration.
 */

import { lemonSqueezySetup } from '@lemonsqueezy/lemonsqueezy.js';

// Validate required environment variables
const requiredEnvVars = [
  'LEMONSQUEEZY_API_KEY',
  'LEMONSQUEEZY_STORE_ID',
  'LEMONSQUEEZY_VARIANT_BASIC_ID',
  'LEMONSQUEEZY_VARIANT_PRO_ID',
  'LEMONSQUEEZY_VARIANT_ENTERPRISE_ID',
  'LEMONSQUEEZY_WEBHOOK_SECRET',
] as const;

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
  }
}

// Initialize LemonSqueezy SDK
lemonSqueezySetup({
  apiKey: process.env.LEMONSQUEEZY_API_KEY!,
  onError: (error) => {
    console.error('LemonSqueezy API Error:', error);
    throw error;
  },
});

/**
 * LemonSqueezy Configuration Constants
 */
export const LEMON_CONFIG = {
  storeId: process.env.LEMONSQUEEZY_STORE_ID!,
  variants: {
    basic: process.env.LEMONSQUEEZY_VARIANT_BASIC_ID!,
    pro: process.env.LEMONSQUEEZY_VARIANT_PRO_ID!,
    enterprise: process.env.LEMONSQUEEZY_VARIANT_ENTERPRISE_ID!,
  },
  webhookSecret: process.env.LEMONSQUEEZY_WEBHOOK_SECRET!,
  testMode: process.env.LEMONSQUEEZY_TEST_MODE === 'true',
} as const;

/**
 * Plan names that map to LemonSqueezy variants
 */
export type PlanName = 'basic' | 'pro' | 'enterprise';

/**
 * Frontend plan names (Spanish)
 */
export type FrontendPlanName = 'basico' | 'profesional';

/**
 * Map frontend plan names to LemonSqueezy plan names
 */
const PLAN_MAPPING: Record<FrontendPlanName, PlanName> = {
  'basico': 'basic',
  'profesional': 'pro',
};

/**
 * Get LemonSqueezy variant ID for a given plan
 *
 * @param plan - The plan name ('basic', 'pro', 'enterprise', 'basico', or 'profesional')
 * @returns The LemonSqueezy variant ID
 */
export function getVariantId(plan: PlanName | FrontendPlanName): string {
  // Map frontend names to LemonSqueezy names
  const lemonPlan = (plan === 'basico' || plan === 'profesional') 
    ? PLAN_MAPPING[plan]
    : plan;
  
  const variantId = LEMON_CONFIG.variants[lemonPlan as PlanName];

  if (!variantId) {
    throw new Error(`No variant ID configured for plan: ${plan}`);
  }

  return variantId;
}

/**
 * Get plan name from variant ID
 *
 * @param variantId - The LemonSqueezy variant ID
 * @returns The plan name or undefined if not found
 */
export function getPlanFromVariantId(variantId: string): PlanName | undefined {
  const entries = Object.entries(LEMON_CONFIG.variants) as [PlanName, string][];
  const entry = entries.find(([_, id]) => id === variantId);
  return entry?.[0];
}

/**
 * Check if LemonSqueezy is properly configured
 *
 * @returns true if all required environment variables are set
 */
export function isLemonSqueezyConfigured(): boolean {
  return requiredEnvVars.every(envVar => !!process.env[envVar]);
}

/**
 * Get plan display information
 */
export const PLAN_INFO = {
  basic: {
    name: 'Plan Básico',
    maxUsers: 3,
    maxFields: 5,
    modules: ['Campo', 'Empaque', 'Inventario', 'Ajustes'],
  },
  pro: {
    name: 'Plan Profesional',
    maxUsers: 10,
    maxFields: 20,
    modules: ['Campo', 'Empaque', 'Inventario', 'Ajustes', 'Reportes'],
  },
  enterprise: {
    name: 'Plan Empresarial',
    maxUsers: -1,
    maxFields: -1,
    modules: ['Todo Incluido'],
  },
} as const;

/**
 * Get the app URL for checkout redirects
 * Falls back to production URL if NEXT_PUBLIC_APP_URL is not set
 */
function getAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, ''); // Remove trailing slash
  }
  
  // Production URL (update this to your actual production URL)
  return 'http://localhost:3000';
}

/**
 * Checkout configuration defaults
 */
export const CHECKOUT_CONFIG = {
  /**
   * How long a checkout is valid for (in milliseconds)
   * Default: 24 hours
   */
  expiresInMs: 24 * 60 * 60 * 1000,

  /**
   * Success URL - where to redirect after successful payment
   */
  successUrl: `${getAppUrl()}/register-tenant/success`,

  /**
   * Cancel URL - where to redirect if checkout is cancelled
   */
  cancelUrl: `${getAppUrl()}/register-tenant`,

  /**
   * Checkout options for Lemon Squeezy
   */
  checkoutOptions: {
    embed: false, // Use full page checkout (recommended for production)
    media: true, // Show product media
    logo: true, // Show store logo
    desc: true, // Show product description
    discount: true, // Allow discount codes
    dark: false, // Use light theme by default
    subscriptionPreview: true, // Show subscription preview
  },
} as const;
