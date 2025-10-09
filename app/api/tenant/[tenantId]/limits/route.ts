import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params

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

    // Get tenant information including max_users and plan
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('plan, max_users')
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

    // Count actual active users (admin + users with active memberships)
    const { data: memberships, error: membershipsError } = await supabaseAdmin
      .from('tenant_memberships')
      .select('id, user_id, role_code, status, accepted_at')
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .not('accepted_at', 'is', null) // Only count users who have accepted their invitations

    if (membershipsError) {
      console.error('Error counting memberships:', membershipsError)
      return NextResponse.json({
        current_users: 1,
        max_users: tenant.max_users || 3,
        plan: tenant.plan || 'basic'
      })
    }

    const currentUsers = memberships?.length || 0
    const maxUsers = tenant.max_users || 3

    // Update the tenant's current_users count
    await supabaseAdmin
      .from('tenants')
      .update({ current_users: currentUsers })
      .eq('id', tenantId)

    return NextResponse.json({
      current_users: currentUsers,
      max_users: maxUsers,
      plan: tenant.plan || 'basic',
      can_add_more: maxUsers === -1 || currentUsers < maxUsers
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
