import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSubscription } from '@lemonsqueezy/lemonsqueezy.js';
import { configureLemonSqueezy } from '@/lib/lemonsqueezy';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function getSubscriptionUrlsById(subscriptionId: string) {
  configureLemonSqueezy();

  // SDK fetch
  const lsSub = await getSubscription(subscriptionId).catch((err: any) => {
    throw new Error(`LS SDK getSubscription failed: ${err?.message || err}`);
  });

  // If SDK returns but no urls, try REST as a second attempt (more tolerant)
  let urls = lsSub?.data?.attributes?.urls || null;
  let customerId = lsSub?.data?.attributes?.customer_id?.toString();
  let subscriptionIdRet = lsSub?.data?.id;
  let restAttempted = false;
  let restError: string | null = null;

  let restJson: any = null;

  if (!urls) {
    restAttempted = true;
    const res = await fetch(`https://api.lemonsqueezy.com/v1/subscriptions/${subscriptionId}`, {
      headers: {
        Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY || ''}`,
        Accept: 'application/vnd.api+json',
      },
    }).catch((err: any) => {
      restError = err?.message || String(err);
      return null;
    });

    if (res && res.ok) {
      restJson = await res.json().catch(() => null);
      urls = restJson?.data?.attributes?.urls || null;
      customerId = restJson?.data?.attributes?.customer_id?.toString() || customerId;
      subscriptionIdRet = restJson?.data?.id || subscriptionIdRet;
    } else if (res) {
      restError = `REST ${res.status}`;
      restJson = await res.json().catch(() => null);
    }
  }

  return {
    urls,
    subscriptionId: subscriptionIdRet,
    customerId,
    restAttempted,
    restError,
    sdkStatus: lsSub?.data?.attributes?.status,
    restStatus: restJson?.data?.attributes?.status,
    restJson,
  };
}

async function getFirstSubscriptionUrlsByCustomer(customerId: string) {
  // LemonSqueezy API list subscriptions filtered by customer
  const res = await fetch(`https://api.lemonsqueezy.com/v1/subscriptions?filter[customer_id]=${customerId}`, {
    headers: {
      Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY || ''}`,
      Accept: 'application/vnd.api+json',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to list subscriptions for customer ${customerId}: ${res.status}`);
  }

  const json = await res.json().catch(() => null);
  const first = json?.data?.[0];
  return first
    ? {
        urls: first.attributes?.urls || null,
        subscriptionId: first.id,
        customerId: customerId,
        restError: null,
      }
    : null;
}

/**
 * POST /api/payments/lemon/portal
 *
 * Generate customer portal URL for billing management
 *
 * Request body:
 * - tenantId: string - ID of the tenant
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, subscriptionId: overrideSubId } = body;
    let lastRestError: string | null = null;

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing tenantId' },
        { status: 400 }
      );
    }

    // Get tenant from database
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Prefer subscription URLs (they are more reliable than the generic customer portal)
    const subscriptionIdToUse = overrideSubId || tenant.lemon_subscription_id;

    // 1) Try subscription ID directly (preferred, freshest signed URLs)
    if (subscriptionIdToUse) {
      try {
        const subData = await getSubscriptionUrlsById(subscriptionIdToUse);
        lastRestError = subData?.restError || lastRestError;
        const portalUrl = subData?.urls?.update_payment_method || subData?.urls?.customer_portal;

        if (portalUrl) {
          console.log('[portal] Using LS subscription URLs for tenant:', tenantId, 'source:subscription_urls');

          // Backfill IDs if missing
          if ((!tenant.lemon_subscription_id && subData?.subscriptionId) || (!tenant.lemon_customer_id && subData?.customerId)) {
            await supabaseAdmin
              .from('tenants')
              .update({
                lemon_subscription_id: tenant.lemon_subscription_id || subData.subscriptionId,
                lemon_customer_id: tenant.lemon_customer_id || subData.customerId,
                last_webhook_at: new Date().toISOString(),
              })
              .eq('id', tenantId);
          }

          return NextResponse.json({
            success: true,
            portalUrl,
            source: 'subscription_urls',
            subscriptionStatus: subData?.sdkStatus || subData?.restStatus,
          });
        }
      } catch (err) {
        console.error('[portal] Error fetching LS subscription for subscription_urls:', err);
      }
    }

    // 2) If no stored subscription, try to list subscriptions by customer and use the first one
    if (tenant.lemon_customer_id) {
      try {
        const subFromCustomer = await getFirstSubscriptionUrlsByCustomer(tenant.lemon_customer_id);
        lastRestError = subFromCustomer?.restError || lastRestError;
        const portalUrl = subFromCustomer?.urls?.update_payment_method || subFromCustomer?.urls?.customer_portal;

        if (portalUrl) {
          console.log('[portal] Using LS subscription URLs via customer lookup for tenant:', tenantId, 'source:customer_subscription_lookup');

          // Backfill subscription/customer IDs if missing
          if ((!tenant.lemon_subscription_id && subFromCustomer?.subscriptionId) || (!tenant.lemon_customer_id && subFromCustomer?.customerId)) {
            await supabaseAdmin
              .from('tenants')
              .update({
                lemon_subscription_id: tenant.lemon_subscription_id || subFromCustomer.subscriptionId,
                lemon_customer_id: tenant.lemon_customer_id || subFromCustomer.customerId,
                last_webhook_at: new Date().toISOString(),
              })
              .eq('id', tenantId);
          }

          return NextResponse.json({
            success: true,
            portalUrl,
            source: 'customer_subscription_lookup',
            subscriptionStatus: subFromCustomer?.restStatus,
          });
        }
      } catch (err) {
        console.error('[portal] Error fetching subscriptions by customer:', err);
      }
    }

    // 3) Do not return the generic customer portal if no subscription URLs were found, to avoid 404
    return NextResponse.json(
      {
        error: 'No subscription URLs available',
        hint: 'Ensure lemon_subscription_id is stored for this tenant and the subscription exists in LemonSqueezy.',
        debug: {
          tenantId,
          tenantHasSubscriptionId: !!tenant.lemon_subscription_id,
          tenantHasCustomerId: !!tenant.lemon_customer_id,
          attemptedSubscriptionId: subscriptionIdToUse || null,
          source: 'portal',
          note: 'If this keeps failing, verify the subscription is active and not cancelled/expired.',
          restAttempted: true,
          restError: lastRestError,
          subscriptionStatus: undefined,
        },
      },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('[portal] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate portal URL' },
      { status: 500 }
    );
  }
}
