import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    if (!tenant.lemon_customer_id) {
      return NextResponse.json(
        { error: 'No customer found for this tenant' },
        { status: 400 }
      );
    }

    // Generate customer portal URL
    // LemonSqueezy uses a standard format for customer portal URLs
    const portalUrl = `https://my.lemonsqueezy.com/billing?customer=${tenant.lemon_customer_id}`;

    console.log('[portal] Generated portal URL for tenant:', tenantId);

    return NextResponse.json({
      success: true,
      portalUrl,
    });

  } catch (error: any) {
    console.error('[portal] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate portal URL' },
      { status: 500 }
    );
  }
}
