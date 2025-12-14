import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSubscription } from '@lemonsqueezy/lemonsqueezy.js';
import { configureLemonSqueezy } from '@/lib/lemonsqueezy';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

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
    const { tenantId } = body;

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
    if (tenant.lemon_subscription_id) {
      try {
        configureLemonSqueezy();
        const lsSub = await getSubscription(tenant.lemon_subscription_id);
        const urls = lsSub?.data?.attributes?.urls || {};
        const portalUrl = urls.update_payment_method || urls.customer_portal;

        if (portalUrl) {
          console.log('[portal] Using LS subscription URLs for tenant:', tenantId, 'source:subscription_urls');
          return NextResponse.json({ success: true, portalUrl, source: 'subscription_urls' });
        }
      } catch (err) {
        console.error('[portal] Error fetching LS subscription for subscription_urls:', err);
      }
    }

    // If subscription URLs failed, fall back to the generic customer portal
    if (tenant.lemon_customer_id) {
      const portalUrl = `https://my.lemonsqueezy.com/billing?customer=${tenant.lemon_customer_id}`;
      console.log('[portal] Fallback to customer portal for tenant:', tenantId);
      return NextResponse.json({ success: true, portalUrl, source: 'customer_id' });
    }

    return NextResponse.json(
      { error: 'No customer found for this tenant', hint: 'No lemon_subscription_id URLs or lemon_customer_id available' },
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
