import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin'

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    const tenantId = params.tenantId

    // Verify authentication
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'No authorization header' },
        { status: 401 }
      )
    }

    // Check if supabaseAdmin is available
    if (!supabaseAdmin) {
      console.error('Supabase admin client not available')
      return NextResponse.json({
        current_users: 1,
        max_users: 3,
        plan: 'basic'
      })
    }

    // Get tenant information including plan
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('plan')
      .eq('id', tenantId)
      .single()

    if (tenantError) {
      console.error('Error fetching tenant:', tenantError)
      // Return default limits as fallback
      return NextResponse.json({
        current_users: 1,
        max_users: 3,
        plan: 'basic'
      })
    }

    // Count current active users/workers in this tenant
    const { count: userCount, error: countError } = await supabaseAdmin
      .from('workers')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('status', 'active')

    if (countError) {
      console.error('Error counting users:', countError)
    }

    // Determine max users based on plan
    const planLimits: Record<string, number> = {
      'basic': 3,
      'basico': 3,
      'pro': 10,
      'enterprise': -1, // unlimited
      'empresarial': -1
    }

    const plan = tenant.plan?.toLowerCase() || 'basic'
    const maxUsers = planLimits[plan] || 3

    return NextResponse.json({
      current_users: userCount || 0,
      max_users: maxUsers,
      plan: tenant.plan || 'basic',
      can_add_more: maxUsers === -1 || (userCount || 0) < maxUsers
    })
  } catch (error) {
    console.error('Error in tenant limits API:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        current_users: 1,
        max_users: 3,
        plan: 'basic'
      },
      { status: 500 }
    )
  }
}
