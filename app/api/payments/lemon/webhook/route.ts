import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  verifyWebhookSignature,
  parseWebhookPayload,
  extractCustomerEmail,
  extractSubscriptionId,
  extractOrderId,
  extractVariantId,
  extractCustomData,
  isEventProcessed,
  storeWebhookEvent,
  markEventProcessed,
  markEventFailed,
  WEBHOOK_EVENTS,
  type WebhookPayload,
} from '@/lib/lemonsqueezy-webhook';
import { getPlanFromVariantId } from '@/lib/lemonsqueezy';
import { buildInvitationUrl } from '@/lib/utils/url';

// Force Node.js runtime for crypto support
export const runtime = 'nodejs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function findTenantBySubscriptionOrFallback(
  subscriptionId: string,
  payload: WebhookPayload,
  supabase: any
) {
  // Try direct subscription match first
  const { data: tenantBySub, error: tenantBySubError } = await supabase
    .from('tenants')
    .select('*')
    .eq('lemon_subscription_id', subscriptionId)
    .maybeSingle?.();

  if (tenantBySub) {
    return tenantBySub;
  }

  if (tenantBySubError && tenantBySubError.code && tenantBySubError.code !== 'PGRST116') {
    throw tenantBySubError;
  }

  const customData = extractCustomData(payload);

  if (customData?.tenant_slug) {
    const { data: tenantBySlug, error: tenantBySlugError } = await supabase
      .from('tenants')
      .select('*')
      .eq('slug', customData.tenant_slug)
      .maybeSingle?.();

    if (tenantBySlug) {
      return tenantBySlug;
    }

    if (tenantBySlugError && tenantBySlugError.code && tenantBySlugError.code !== 'PGRST116') {
      throw tenantBySlugError;
    }
  }

  const email = extractCustomerEmail(payload)?.toLowerCase();

  if (email) {
    const { data: tenantByEmail, error: tenantByEmailError } = await supabase
      .from('tenants')
      .select('*')
      .eq('contact_email', email)
      .maybeSingle?.();

    if (tenantByEmail) {
      return tenantByEmail;
    }

    if (tenantByEmailError && tenantByEmailError.code && tenantByEmailError.code !== 'PGRST116') {
      throw tenantByEmailError;
    }
  }

  return null;
}

async function backfillSubscriptionFields(
  tenant: any,
  subscriptionId: string,
  payload: WebhookPayload,
  supabase: any
) {
  const customerId = payload.data.attributes?.customer_id?.toString();
  const updates: Record<string, any> = {};

  if (!tenant.lemon_subscription_id && subscriptionId) {
    updates.lemon_subscription_id = subscriptionId;
  }

  if (!tenant.lemon_customer_id && customerId) {
    updates.lemon_customer_id = customerId;
  }

  if (Object.keys(updates).length === 0) {
    return tenant;
  }

  const { data: updatedTenant, error: updateError } = await supabase
    .from('tenants')
    .update({
      ...updates,
      last_webhook_at: new Date().toISOString(),
    })
    .eq('id', tenant.id)
    .select('*')
    .single();

  if (updateError) {
    throw updateError;
  }

  return updatedTenant;
}

/**
 * GET /api/payments/lemon/webhook
 * Health check endpoint for verifying webhook is accessible
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    message: 'LemonSqueezy webhook endpoint is active',
  });
}

/**
 * POST /api/payments/lemon/webhook
 *
 * Handles LemonSqueezy webhook events
 */
export async function POST(request: NextRequest) {
  try {
    // Get raw body as text for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get('x-signature') || '';

    console.log('[webhook] Received webhook request');

    // Verify webhook signature
    if (!verifyWebhookSignature(rawBody, signature)) {
      console.error('[webhook] Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse payload
    const payload = parseWebhookPayload(rawBody);
    const eventType = payload.meta.event_name;

    // Use webhook_id for idempotency (unique per delivery)
    // Fallback to eventType_dataId if webhook_id not present
    const webhookId = payload.meta?.webhook_id;
    const eventId = webhookId || `${eventType}_${payload.data.id}`;

    console.log('[webhook] Processing event:', {
      eventType,
      eventId,
      webhookId: webhookId || 'not_present',
      dataId: payload.data.id,
    });

    // Check if event was already processed (idempotency)
    if (await isEventProcessed(eventId, supabaseAdmin)) {
      console.log('[webhook] Event already processed:', eventId);
      return NextResponse.json({ received: true, processed: false, reason: 'already_processed' });
    }

    // Store webhook event
    await storeWebhookEvent(eventId, eventType, payload, supabaseAdmin);

    // Process event based on type
    let result;
    try {
      switch (eventType) {
        case WEBHOOK_EVENTS.ORDER_CREATED:
          result = await handleOrderCreated(payload, supabaseAdmin);
          break;

        case WEBHOOK_EVENTS.SUBSCRIPTION_CREATED:
          result = await handleSubscriptionCreated(payload, supabaseAdmin);
          break;

        case WEBHOOK_EVENTS.SUBSCRIPTION_UPDATED:
          result = await handleSubscriptionUpdated(payload, supabaseAdmin);
          break;

        case WEBHOOK_EVENTS.SUBSCRIPTION_PAYMENT_SUCCESS:
          result = await handleSubscriptionPaymentSuccess(payload, supabaseAdmin);
          break;

        case WEBHOOK_EVENTS.SUBSCRIPTION_PAYMENT_FAILED:
          result = await handleSubscriptionPaymentFailed(payload, supabaseAdmin);
          break;

        case WEBHOOK_EVENTS.SUBSCRIPTION_CANCELLED:
          result = await handleSubscriptionCancelled(payload, supabaseAdmin);
          break;

        case WEBHOOK_EVENTS.SUBSCRIPTION_RESUMED:
          result = await handleSubscriptionResumed(payload, supabaseAdmin);
          break;

        case WEBHOOK_EVENTS.SUBSCRIPTION_EXPIRED:
          result = await handleSubscriptionExpired(payload, supabaseAdmin);
          break;

        default:
          console.log('[webhook] Unhandled event type:', eventType);
          result = { processed: false, reason: 'unhandled_event_type' };
      }

      if (result.processed) {
        await markEventProcessed(eventId, supabaseAdmin, result.tenantId);
      }

      return NextResponse.json({
        received: true,
        ...result,
      });

    } catch (error: any) {
      console.error(`[webhook] Error processing ${eventType}:`, error);
      await markEventFailed(eventId, supabaseAdmin, error.message, 0);

      return NextResponse.json(
        {
          received: true,
          processed: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('[webhook] Fatal error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Handle order_created event
 * This is triggered when a customer completes payment
 * We create the tenant and send admin invitation
 */
async function handleOrderCreated(payload: WebhookPayload, supabase: any) {
  console.log('[webhook:order_created] Processing order');

  const email = extractCustomerEmail(payload);
  const orderId = extractOrderId(payload);
  const variantId = extractVariantId(payload);

  if (!email || !orderId || !variantId) {
    throw new Error('Missing required fields in order_created event');
  }

  const plan = getPlanFromVariantId(variantId);
  if (!plan) {
    throw new Error(`Unknown variant ID: ${variantId}`);
  }

  console.log('[webhook:order_created] Order details:', {
    email,
    orderId,
    variantId,
    plan,
  });

  // Try to find checkout record first
  const { data: checkout, error: checkoutError } = await supabase
    .from('lemon_squeezy_checkouts')
    .select('*')
    .eq('contact_email', email.toLowerCase())
    .eq('completed', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // Get custom_data from webhook payload as fallback
  const customData = extractCustomData(payload);

  // Determine tenant data source
  let tenantData: {
    tenant_name: string;
    tenant_slug: string;
    plan_name: string;
    contact_name: string;
    contact_email: string;
  };

  if (checkout) {
    console.log('[webhook:order_created] Found checkout:', checkout.id);

    // Check if tenant already exists for this checkout
    if (checkout.tenant_id) {
      console.log('[webhook:order_created] Tenant already created:', checkout.tenant_id);
      return {
        processed: true,
        tenantId: checkout.tenant_id,
        reason: 'tenant_already_exists',
      };
    }

    tenantData = {
      tenant_name: checkout.tenant_name,
      tenant_slug: checkout.tenant_slug,
      plan_name: checkout.plan_name,
      contact_name: checkout.contact_name,
      contact_email: checkout.contact_email,
    };
  } else if (customData && customData.tenant_name && customData.contact_email) {
    // Use custom_data from webhook payload as fallback
    console.log('[webhook:order_created] No checkout found, using custom_data from payload');
    tenantData = {
      tenant_name: customData.tenant_name,
      tenant_slug: customData.tenant_slug || customData.tenant_name.toLowerCase().replace(/\s+/g, '-'),
      plan_name: customData.plan || plan,
      contact_name: customData.contact_name || customData.tenant_name,
      contact_email: customData.contact_email || email,
    };
  } else {
    console.error('[webhook:order_created] No checkout or custom_data found:', email);
    throw new Error('Checkout record not found and no custom_data available for email: ' + email);
  }

  // Check if tenant already exists by email or slug
  const { data: existingTenant } = await supabase
    .from('tenants')
    .select('id')
    .or(`contact_email.eq.${tenantData.contact_email.toLowerCase()},slug.eq.${tenantData.tenant_slug}`)
    .single();

  if (existingTenant) {
    console.log('[webhook:order_created] Tenant already exists:', existingTenant.id);

    // Update checkout if exists
    if (checkout) {
      await supabase
        .from('lemon_squeezy_checkouts')
        .update({ completed: true, completed_at: new Date().toISOString(), tenant_id: existingTenant.id })
        .eq('id', checkout.id);
    }

    return {
      processed: true,
      tenantId: existingTenant.id,
      reason: 'tenant_already_exists',
    };
  }

  // Get system user ID for created_by field
  let systemUserId = process.env.SUPABASE_SERVICE_USER_ID || null;

  if (!systemUserId) {
    // Create fallback service user
    try {
      const svcEmail = `seedor-system-${Date.now()}@local.invalid`;
      const svcPassword = Math.random().toString(36).slice(2) + Date.now().toString(36);
      const { data: svcData, error: svcError } = await supabase.auth.admin.createUser({
        email: svcEmail,
        password: svcPassword,
        email_confirm: true,
        user_metadata: { system: true }
      });

      if (!svcError && svcData.user) {
        systemUserId = svcData.user.id;
        console.log('[webhook:order_created] Created fallback service user');
      }
    } catch (err) {
      console.error('[webhook:order_created] Failed to create service user:', err);
    }
  }

  if (!systemUserId) {
    throw new Error('Unable to get system user ID for tenant creation');
  }

  // Set limits based on plan
  const limits = plan === 'basic'
    ? { maxUsers: 10, maxFields: 5 }
    : { maxUsers: 30, maxFields: 20 };

  // Create tenant
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .insert([
      {
        name: tenantData.tenant_name,
        slug: tenantData.tenant_slug,
        plan: tenantData.plan_name,
        contact_name: tenantData.contact_name,
        contact_email: tenantData.contact_email,
        created_by: systemUserId,
        max_users: limits.maxUsers,
        max_fields: limits.maxFields,
        current_users: 0,
        current_fields: 0,
        // LemonSqueezy subscription fields
        lemon_order_id: orderId,
        lemon_variant_id: variantId,
        payment_status: 'active',
        payment_collected_at: new Date().toISOString(),
        last_webhook_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (tenantError || !tenant) {
    console.error('[webhook:order_created] Error creating tenant:', tenantError);
    throw new Error('Failed to create tenant: ' + (tenantError?.message || 'Unknown error'));
  }

  console.log('[webhook:order_created] Tenant created:', tenant.id);

  // Create invitation for admin role
  const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

  const { data: invitation, error: inviteError } = await supabase
    .from('invitations')
    .insert([
      {
        tenant_id: tenant.id,
        email: tenantData.contact_email.toLowerCase(),
        role_code: 'admin',
        token_hash: token,
        invited_by: null,
        expires_at: expiresAt,
      },
    ])
    .select()
    .single();

  if (inviteError || !invitation) {
    console.error('[webhook:order_created] Error creating invitation:', inviteError);
    // Don't rollback tenant - we can manually send invitation later
  } else {
    console.log('[webhook:order_created] Invitation created:', invitation.id);

    // Send invitation email via Supabase
    const inviteUrl = buildInvitationUrl('admin', token);

    const { error: sendError } = await supabase.auth.admin.inviteUserByEmail(
      tenantData.contact_email.toLowerCase(),
      {
        redirectTo: inviteUrl,
        data: {
          tenant_id: tenant.id,
          tenant_name: tenant.name,
          role_code: 'admin',
          invitation_token: token,
        },
      }
    );

    if (sendError) {
      console.error('[webhook:order_created] Error sending invitation email:', sendError);
      // Don't fail - invitation exists in DB, can be resent manually
    } else {
      console.log('[webhook:order_created] Invitation email sent to:', tenantData.contact_email);
    }
  }

  // Mark checkout as completed (only if we found one)
  if (checkout) {
    await supabase
      .from('lemon_squeezy_checkouts')
      .update({
        completed: true,
        completed_at: new Date().toISOString(),
        tenant_id: tenant.id,
      })
      .eq('id', checkout.id);

    console.log('[webhook:order_created] Checkout marked as completed');
  }

  return {
    processed: true,
    tenantId: tenant.id,
  };
}

/**
 * Handle subscription_created event
 * Update tenant with subscription ID
 */
async function handleSubscriptionCreated(payload: WebhookPayload, supabase: any) {
  console.log('[webhook:subscription_created] Processing subscription');

  const email = extractCustomerEmail(payload);
  const subscriptionId = extractSubscriptionId(payload);

  if (!email || !subscriptionId) {
    throw new Error('Missing required fields in subscription_created event');
  }

  const customData = extractCustomData(payload);

  // Prefer slug if provided, fallback to contact email
  const { data: tenant, error: tenantError } = customData?.tenant_slug
    ? await supabase
        .from('tenants')
        .select('*')
        .eq('slug', customData.tenant_slug)
        .maybeSingle?.()
    : await supabase
        .from('tenants')
        .select('*')
        .eq('contact_email', email.toLowerCase())
        .single();

  if (tenantError || !tenant) {
    console.error('[webhook:subscription_created] Tenant not found:', customData?.tenant_slug || email);
    throw new Error('Tenant not found for email: ' + email);
  }

  // Update tenant with subscription ID
  const renewsAt = payload.data.attributes.renews_at;

  const { error: updateError } = await supabase
    .from('tenants')
    .update({
      lemon_subscription_id: subscriptionId,
      lemon_customer_id: payload.data.attributes.customer_id?.toString(),
      payment_status: 'active',
      subscription_renews_at: renewsAt,
      last_webhook_at: new Date().toISOString(),
    })
    .eq('id', tenant.id);

  if (updateError) {
    throw new Error('Failed to update tenant with subscription: ' + updateError.message);
  }

  console.log('[webhook:subscription_created] Tenant updated with subscription:', tenant.id);

  return {
    processed: true,
    tenantId: tenant.id,
  };
}

/**
 * Handle subscription_updated event
 */
async function handleSubscriptionUpdated(payload: WebhookPayload, supabase: any) {
  const subscriptionId = extractSubscriptionId(payload);

  if (!subscriptionId) {
    throw new Error('Missing subscription ID');
  }

  let tenant = await findTenantBySubscriptionOrFallback(subscriptionId, payload, supabase);

  if (!tenant) {
    throw new Error('Tenant not found for subscription: ' + subscriptionId);
  }

  tenant = await backfillSubscriptionFields(tenant, subscriptionId, payload, supabase);

  const renewsAt = payload.data.attributes.renews_at;
  const endsAt = payload.data.attributes.ends_at;

  const { error: updateError } = await supabase
    .from('tenants')
    .update({
      subscription_renews_at: renewsAt,
      subscription_ends_at: endsAt,
      last_webhook_at: new Date().toISOString(),
    })
    .eq('id', tenant.id);

  if (updateError) {
    throw new Error('Failed to update tenant: ' + updateError.message);
  }

  return {
    processed: true,
    tenantId: tenant.id,
  };
}

/**
 * Handle subscription_payment_success event
 */
async function handleSubscriptionPaymentSuccess(payload: WebhookPayload, supabase: any) {
  const subscriptionId = extractSubscriptionId(payload);

  if (!subscriptionId) {
    throw new Error('Missing subscription ID');
  }

  let tenant = await findTenantBySubscriptionOrFallback(subscriptionId, payload, supabase);

  if (!tenant) {
    throw new Error('Tenant not found for subscription: ' + subscriptionId);
  }

  tenant = await backfillSubscriptionFields(tenant, subscriptionId, payload, supabase);

  const renewsAt = payload.data.attributes.renews_at;

  const { error: updateError } = await supabase
    .from('tenants')
    .update({
      payment_status: 'active',
      subscription_renews_at: renewsAt,
      payment_failed_at: null, // Clear any previous failure
      last_webhook_at: new Date().toISOString(),
    })
    .eq('id', tenant.id);

  if (updateError) {
    throw new Error('Failed to update tenant: ' + updateError.message);
  }

  console.log('[webhook:payment_success] Payment successful for tenant:', tenant.id);

  return {
    processed: true,
    tenantId: tenant.id,
  };
}

/**
 * Handle subscription_payment_failed event
 */
async function handleSubscriptionPaymentFailed(payload: WebhookPayload, supabase: any) {
  const subscriptionId = extractSubscriptionId(payload);

  if (!subscriptionId) {
    throw new Error('Missing subscription ID');
  }

  let tenant = await findTenantBySubscriptionOrFallback(subscriptionId, payload, supabase);

  if (!tenant) {
    throw new Error('Tenant not found for subscription: ' + subscriptionId);
  }

  tenant = await backfillSubscriptionFields(tenant, subscriptionId, payload, supabase);

  const { error: updateError } = await supabase
    .from('tenants')
    .update({
      payment_status: 'past_due',
      payment_failed_at: new Date().toISOString(),
      last_webhook_at: new Date().toISOString(),
    })
    .eq('id', tenant.id);

  if (updateError) {
    throw new Error('Failed to update tenant: ' + updateError.message);
  }

  console.log('[webhook:payment_failed] Payment failed for tenant:', tenant.id);

  // TODO: Send payment failure email notification

  return {
    processed: true,
    tenantId: tenant.id,
  };
}

/**
 * Handle subscription_cancelled event
 */
async function handleSubscriptionCancelled(payload: WebhookPayload, supabase: any) {
  const subscriptionId = extractSubscriptionId(payload);

  if (!subscriptionId) {
    throw new Error('Missing subscription ID');
  }

  let tenant = await findTenantBySubscriptionOrFallback(subscriptionId, payload, supabase);

  if (!tenant) {
    throw new Error('Tenant not found for subscription: ' + subscriptionId);
  }

  tenant = await backfillSubscriptionFields(tenant, subscriptionId, payload, supabase);

  const endsAt = payload.data.attributes.ends_at;

  const { error: updateError } = await supabase
    .from('tenants')
    .update({
      payment_status: 'cancelled',
      subscription_ends_at: endsAt,
      last_webhook_at: new Date().toISOString(),
    })
    .eq('id', tenant.id);

  if (updateError) {
    throw new Error('Failed to update tenant: ' + updateError.message);
  }

  console.log('[webhook:cancelled] Subscription cancelled for tenant:', tenant.id);

  // TODO: Send cancellation confirmation email

  return {
    processed: true,
    tenantId: tenant.id,
  };
}

/**
 * Handle subscription_resumed event
 */
async function handleSubscriptionResumed(payload: WebhookPayload, supabase: any) {
  const subscriptionId = extractSubscriptionId(payload);

  if (!subscriptionId) {
    throw new Error('Missing subscription ID');
  }

  let tenant = await findTenantBySubscriptionOrFallback(subscriptionId, payload, supabase);

  if (!tenant) {
    throw new Error('Tenant not found for subscription: ' + subscriptionId);
  }

  tenant = await backfillSubscriptionFields(tenant, subscriptionId, payload, supabase);

  const renewsAt = payload.data.attributes.renews_at;

  const { error: updateError } = await supabase
    .from('tenants')
    .update({
      payment_status: 'active',
      subscription_renews_at: renewsAt,
      subscription_ends_at: null,
      payment_failed_at: null,
      last_webhook_at: new Date().toISOString(),
    })
    .eq('id', tenant.id);

  if (updateError) {
    throw new Error('Failed to update tenant: ' + updateError.message);
  }

  console.log('[webhook:resumed] Subscription resumed for tenant:', tenant.id);

  return {
    processed: true,
    tenantId: tenant.id,
  };
}

/**
 * Handle subscription_expired event
 */
async function handleSubscriptionExpired(payload: WebhookPayload, supabase: any) {
  const subscriptionId = extractSubscriptionId(payload);

  if (!subscriptionId) {
    throw new Error('Missing subscription ID');
  }

  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('*')
    .eq('lemon_subscription_id', subscriptionId)
    .single();

  if (tenantError || !tenant) {
    throw new Error('Tenant not found for subscription: ' + subscriptionId);
  }

  const { error: updateError } = await supabase
    .from('tenants')
    .update({
      payment_status: 'expired',
      last_webhook_at: new Date().toISOString(),
    })
    .eq('id', tenant.id);

  if (updateError) {
    throw new Error('Failed to update tenant: ' + updateError.message);
  }

  console.log('[webhook:expired] Subscription expired for tenant:', tenant.id);

  // TODO: Send expiration notice email

  return {
    processed: true,
    tenantId: tenant.id,
  };
}
