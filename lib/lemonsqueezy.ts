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
 * Get LemonSqueezy variant ID for a given plan
 *
 * @param plan - The plan name ('basic', 'pro', or 'enterprise')
 * @returns The LemonSqueezy variant ID
 */
export function getVariantId(plan: PlanName): string {
  const variantId = LEMON_CONFIG.variants[plan];

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
 * Checkout configuration defaults
 */
export const CHECKOUT_CONFIG = {
  /**
   * How long a checkout is valid for (in milliseconds)
   * Default: 24 hours
   */
  expiresInMs: 24 * 60 * 60 * 1000,

  /**
   * Checkout URL for production
   */
  successUrl: process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/register-tenant/success`
    : 'https://seedor-1.vercel.app/register-tenant/success',

  /**
   * Cancel URL (return to registration)
   */
  cancelUrl: process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/register-tenant`
    : 'https://seedor-1.vercel.app/register-tenant',
} as const;
