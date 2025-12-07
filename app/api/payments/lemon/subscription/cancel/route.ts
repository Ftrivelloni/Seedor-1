import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cancelSubscription } from '@lemonsqueezy/lemonsqueezy.js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

/**
 * POST /api/payments/lemon/subscription/cancel
 *
 * Cancel a subscription
 *
 * Request body:
 * - tenantId: string - ID of the tenant
 * - reason?: string - Optional cancellation reason
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, reason } = body;

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

    if (!tenant.lemon_subscription_id) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 400 }
      );
    }

    // Check if already cancelled
    if (tenant.payment_status === 'cancelled' || tenant.payment_status === 'expired') {
      return NextResponse.json(
        { error: 'Subscription is already cancelled or expired' },
        { status: 400 }
      );
    }

    console.log('[cancel-subscription] Cancelling subscription:', tenant.lemon_subscription_id);

    // Cancel subscription in LemonSqueezy
    const cancelResult = await cancelSubscription(tenant.lemon_subscription_id);

    if (!cancelResult || !cancelResult.data) {
      throw new Error('Failed to cancel subscription in LemonSqueezy');
    }

    console.log('[cancel-subscription] Subscription cancelled in LemonSqueezy');

    // The webhook will update the tenant status automatically
    // But we can also update it here for immediate feedback
    const endsAt = cancelResult.data.attributes.ends_at;

    const { error: updateError } = await supabaseAdmin
      .from('tenants')
      .update({
        payment_status: 'cancelled',
        subscription_ends_at: endsAt,
      })
      .eq('id', tenantId);

    if (updateError) {
      console.error('[cancel-subscription] Error updating tenant:', updateError);
      // Don't fail the request - subscription was cancelled successfully
    }

    // Log cancellation reason if provided
    if (reason) {
      await supabaseAdmin
        .from('subscription_history')
        .insert([
          {
            tenant_id: tenantId,
            from_plan: tenant.plan,
            to_plan: tenant.plan,
            change_type: 'cancellation',
            effective_date: new Date().toISOString(),
            lemon_subscription_id: tenant.lemon_subscription_id,
            notes: reason,
          },
        ]);
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully',
      ends_at: endsAt,
    });

  } catch (error: any) {
    console.error('[cancel-subscription] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
