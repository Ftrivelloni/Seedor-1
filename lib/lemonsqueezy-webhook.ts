/**
 * LemonSqueezy Webhook Utilities
 *
 * This module provides utilities for verifying and processing
 * LemonSqueezy webhook events.
 */

import crypto from 'crypto';
import { LEMON_CONFIG } from './lemonsqueezy';

/**
 * Verify LemonSqueezy webhook signature
 *
 * @param payload - The raw request body as string
 * @param signature - The signature from the X-Signature header
 * @param secret - The webhook secret (defaults to env var)
 * @returns true if signature is valid
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string = LEMON_CONFIG.webhookSecret
): boolean {
  try {
    // Create HMAC using SHA-256
    const hmac = crypto.createHmac('sha256', secret);
    const digest = hmac.update(payload).digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(digest)
    );
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

/**
 * LemonSqueezy webhook event types that we handle
 */
export const WEBHOOK_EVENTS = {
  ORDER_CREATED: 'order_created',
  ORDER_REFUNDED: 'order_refunded',
  SUBSCRIPTION_CREATED: 'subscription_created',
  SUBSCRIPTION_UPDATED: 'subscription_updated',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
  SUBSCRIPTION_RESUMED: 'subscription_resumed',
  SUBSCRIPTION_EXPIRED: 'subscription_expired',
  SUBSCRIPTION_PAUSED: 'subscription_paused',
  SUBSCRIPTION_UNPAUSED: 'subscription_unpaused',
  SUBSCRIPTION_PAYMENT_SUCCESS: 'subscription_payment_success',
  SUBSCRIPTION_PAYMENT_FAILED: 'subscription_payment_failed',
  SUBSCRIPTION_PAYMENT_RECOVERED: 'subscription_payment_recovered',
  LICENSE_KEY_CREATED: 'license_key_created',
  LICENSE_KEY_UPDATED: 'license_key_updated',
} as const;

export type WebhookEventType = typeof WEBHOOK_EVENTS[keyof typeof WEBHOOK_EVENTS];

/**
 * LemonSqueezy webhook payload structure
 */
export interface WebhookPayload {
  meta: {
    event_name: WebhookEventType;
    custom_data?: Record<string, any>;
    [key: string]: any;
  };
  data: {
    type: string;
    id: string;
    attributes: Record<string, any>;
    relationships?: Record<string, any>;
    [key: string]: any;
  };
  [key: string]: any;
}

/**
 * Parse and validate webhook payload
 *
 * @param rawPayload - The raw request body as string
 * @returns Parsed webhook payload
 * @throws Error if payload is invalid
 */
export function parseWebhookPayload(rawPayload: string): WebhookPayload {
  try {
    const payload = JSON.parse(rawPayload);

    // Validate required fields
    if (!payload.meta?.event_name) {
      throw new Error('Missing event_name in webhook payload');
    }

    if (!payload.data?.id) {
      throw new Error('Missing data.id in webhook payload');
    }

    return payload as WebhookPayload;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON in webhook payload');
    }
    throw error;
  }
}

/**
 * Extract customer email from webhook payload
 *
 * @param payload - The webhook payload
 * @returns Customer email or undefined
 */
export function extractCustomerEmail(payload: WebhookPayload): string | undefined {
  return payload.data?.attributes?.user_email ||
         payload.data?.attributes?.customer_email ||
         payload.meta?.custom_data?.email;
}

/**
 * Extract subscription ID from webhook payload
 *
 * @param payload - The webhook payload
 * @returns Subscription ID or undefined
 */
export function extractSubscriptionId(payload: WebhookPayload): string | undefined {
  // For subscription events, the ID is the subscription ID
  if (payload.data?.type === 'subscriptions') {
    return payload.data.id;
  }

  // For order events, check relationships
  return payload.data?.relationships?.subscription?.data?.id;
}

/**
 * Extract order ID from webhook payload
 *
 * @param payload - The webhook payload
 * @returns Order ID or undefined
 */
export function extractOrderId(payload: WebhookPayload): string | undefined {
  if (payload.data?.type === 'orders') {
    return payload.data.id;
  }

  return payload.data?.relationships?.order?.data?.id;
}

/**
 * Extract variant ID from webhook payload
 *
 * @param payload - The webhook payload
 * @returns Variant ID or undefined
 */
export function extractVariantId(payload: WebhookPayload): string | undefined {
  // Check first order item for variant
  const firstOrderItem = payload.data?.attributes?.first_order_item;
  if (firstOrderItem?.variant_id) {
    return firstOrderItem.variant_id.toString();
  }

  // Check product variant ID
  if (payload.data?.attributes?.variant_id) {
    return payload.data.attributes.variant_id.toString();
  }

  // Check relationships
  return payload.data?.relationships?.variant?.data?.id;
}

/**
 * Check if webhook event has already been processed
 *
 * @param eventId - The unique event ID
 * @param supabaseClient - Supabase client instance
 * @returns true if event was already processed
 */
export async function isEventProcessed(
  eventId: string,
  supabaseClient: any
): Promise<boolean> {
  const { data, error } = await supabaseClient
    .from('lemon_squeezy_webhook_events')
    .select('processed')
    .eq('event_id', eventId)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows returned
    console.error('Error checking if event was processed:', error);
    return false;
  }

  return data?.processed === true;
}

/**
 * Store webhook event in database
 *
 * @param eventId - Unique event ID
 * @param eventType - Type of webhook event
 * @param payload - Full webhook payload
 * @param supabaseClient - Supabase client instance
 * @returns Created event record
 */
export async function storeWebhookEvent(
  eventId: string,
  eventType: string,
  payload: WebhookPayload,
  supabaseClient: any
): Promise<any> {
  const { data, error } = await supabaseClient
    .from('lemon_squeezy_webhook_events')
    .insert([
      {
        event_id: eventId,
        event_type: eventType,
        payload,
        processed: false,
        retry_count: 0,
      },
    ])
    .select()
    .single();

  if (error) {
    // If error is duplicate key, that's ok - event already exists
    if (error.code === '23505') {
      console.log(`Webhook event ${eventId} already exists in database`);
      return null;
    }
    throw error;
  }

  return data;
}

/**
 * Mark webhook event as processed
 *
 * @param eventId - Unique event ID
 * @param supabaseClient - Supabase client instance
 * @param tenantId - Optional tenant ID to associate with event
 */
export async function markEventProcessed(
  eventId: string,
  supabaseClient: any,
  tenantId?: string
): Promise<void> {
  const updateData: any = {
    processed: true,
    processed_at: new Date().toISOString(),
  };

  if (tenantId) {
    updateData.tenant_id = tenantId;
  }

  const { error } = await supabaseClient
    .from('lemon_squeezy_webhook_events')
    .update(updateData)
    .eq('event_id', eventId);

  if (error) {
    console.error('Error marking event as processed:', error);
    throw error;
  }
}

/**
 * Mark webhook event as failed
 *
 * @param eventId - Unique event ID
 * @param supabaseClient - Supabase client instance
 * @param errorMessage - Error message
 * @param retryCount - Current retry count
 */
export async function markEventFailed(
  eventId: string,
  supabaseClient: any,
  errorMessage: string,
  retryCount: number = 0
): Promise<void> {
  const { error } = await supabaseClient
    .from('lemon_squeezy_webhook_events')
    .update({
      error: errorMessage,
      retry_count: retryCount,
    })
    .eq('event_id', eventId);

  if (error) {
    console.error('Error marking event as failed:', error);
    throw error;
  }
}

/**
 * Exponential backoff delay for retries
 *
 * @param retryCount - Current retry attempt (0-based)
 * @returns Delay in milliseconds
 */
export function getRetryDelay(retryCount: number): number {
  // 2^retryCount seconds, capped at 1 hour
  const delaySeconds = Math.min(Math.pow(2, retryCount), 3600);
  return delaySeconds * 1000;
}
