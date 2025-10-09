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

    // Get tenant information including current_users, max_users, and plan
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('plan, current_users, max_users')
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

    // Use the values directly from the tenant table
    const currentUsers = tenant.current_users || 0
    const maxUsers = tenant.max_users || 3

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
