import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { updateSubscription } from '@lemonsqueezy/lemonsqueezy.js';
import { getVariantId, getPlanFromVariantId, type PlanName } from '@/lib/lemonsqueezy';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

/**
 * POST /api/payments/lemon/subscription/update
 *
 * Update subscription (upgrade or downgrade plan)
 *
 * Request body:
 * - tenantId: string - ID of the tenant
 * - newPlan: 'basico' | 'profesional' - New plan to switch to
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, newPlan } = body;

    if (!tenantId || !newPlan) {
      return NextResponse.json(
        { error: 'Missing tenantId or newPlan' },
        { status: 400 }
      );
    }

    // Validate plan
    const validPlans: PlanName[] = ['basico', 'profesional'];
    if (!validPlans.includes(newPlan)) {
      return NextResponse.json(
        { error: 'Invalid plan. Must be "basico" or "profesional"' },
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

    // Check if subscription is active
    if (tenant.payment_status !== 'active') {
      return NextResponse.json(
        { error: 'Subscription must be active to change plans' },
        { status: 400 }
      );
    }

    // Check if already on this plan
    if (tenant.plan === newPlan) {
      return NextResponse.json(
        { error: 'Already on this plan' },
        { status: 400 }
      );
    }

    // Get new variant ID
    const newVariantId = getVariantId(newPlan);

    console.log('[update-subscription] Updating subscription:', {
      subscriptionId: tenant.lemon_subscription_id,
      currentPlan: tenant.plan,
      newPlan,
      newVariantId,
    });

    // Update subscription in LemonSqueezy
    const updateResult = await updateSubscription(tenant.lemon_subscription_id, {
      variantId: parseInt(newVariantId),
    });

    if (!updateResult || !updateResult.data) {
      throw new Error('Failed to update subscription in LemonSqueezy');
    }

    console.log('[update-subscription] Subscription updated in LemonSqueezy');

    // Determine if upgrade or downgrade
    const changeType = newPlan === 'profesional' ? 'upgrade' : 'downgrade';

    // Update limits based on new plan
    const limits = newPlan === 'basico'
      ? { maxUsers: 10, maxFields: 5 }
      : { maxUsers: 30, maxFields: 20 };

    // Update tenant in database
    const { error: updateError } = await supabaseAdmin
      .from('tenants')
      .update({
        plan: newPlan,
        lemon_variant_id: newVariantId,
        max_users: limits.maxUsers,
        max_fields: limits.maxFields,
      })
      .eq('id', tenantId);

    if (updateError) {
      console.error('[update-subscription] Error updating tenant:', updateError);
      throw new Error('Failed to update tenant: ' + updateError.message);
    }

    // Log plan change in subscription history
    await supabaseAdmin
      .from('subscription_history')
      .insert([
        {
          tenant_id: tenantId,
          from_plan: tenant.plan,
          to_plan: newPlan,
          change_type: changeType,
          effective_date: new Date().toISOString(),
          lemon_subscription_id: tenant.lemon_subscription_id,
        },
      ]);

    return NextResponse.json({
      success: true,
      message: `Subscription ${changeType}d successfully`,
      new_plan: newPlan,
      change_type: changeType,
    });

  } catch (error: any) {
    console.error('[update-subscription] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update subscription' },
      { status: 500 }
    );
  }
}
