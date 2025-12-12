import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSubscription } from '@lemonsqueezy/lemonsqueezy.js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

/**
 * GET /api/payments/lemon/subscription?tenantId={id}
 *
 * Get subscription status for a tenant
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing tenantId parameter' },
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

    // If no subscription ID, return basic tenant info
    if (!tenant.lemon_subscription_id) {
      return NextResponse.json({
        subscription_status: tenant.payment_status || 'pending',
        plan: tenant.plan,
        has_subscription: false,
      });
    }

    // Fetch subscription from LemonSqueezy
    try {
      const lsSubscription = await getSubscription(tenant.lemon_subscription_id);

      if (!lsSubscription || !lsSubscription.data) {
        // Subscription not found in LemonSqueezy, return DB data
        return NextResponse.json({
          subscription_status: tenant.payment_status,
          plan: tenant.plan,
          has_subscription: true,
          subscription_starts_at: tenant.payment_collected_at,
          subscription_renews_at: tenant.subscription_renews_at,
          subscription_ends_at: tenant.subscription_ends_at,
          payment_failed_at: tenant.payment_failed_at,
        });
      }

      // Return combined data
      return NextResponse.json({
        subscription_status: tenant.payment_status,
        plan: tenant.plan,
        has_subscription: true,
        subscription_starts_at: tenant.payment_collected_at,
        subscription_renews_at: tenant.subscription_renews_at,
        subscription_ends_at: tenant.subscription_ends_at,
        payment_failed_at: tenant.payment_failed_at,
        ls_subscription: {
          id: lsSubscription.data.id,
          status: lsSubscription.data.attributes.status,
          customer_id: lsSubscription.data.attributes.customer_id,
          product_name: lsSubscription.data.attributes.product_name,
          variant_name: lsSubscription.data.attributes.variant_name,
          created_at: lsSubscription.data.attributes.created_at,
          updated_at: lsSubscription.data.attributes.updated_at,
          renews_at: lsSubscription.data.attributes.renews_at,
          ends_at: lsSubscription.data.attributes.ends_at,
          trial_ends_at: lsSubscription.data.attributes.trial_ends_at,
        },
      });
    } catch (lsError) {
      console.error('[subscription] Error fetching from LemonSqueezy:', lsError);
      // Return DB data if LemonSqueezy API fails
      return NextResponse.json({
        subscription_status: tenant.payment_status,
        plan: tenant.plan,
        has_subscription: true,
        subscription_starts_at: tenant.payment_collected_at,
        subscription_renews_at: tenant.subscription_renews_at,
        subscription_ends_at: tenant.subscription_ends_at,
        payment_failed_at: tenant.payment_failed_at,
      });
    }

  } catch (error: any) {
    console.error('[subscription] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
