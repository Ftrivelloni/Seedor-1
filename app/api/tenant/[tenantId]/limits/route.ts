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

    // CORRECCION: Contar usuarios reales activos en lugar de confiar en current_users almacenado
    const { data: activeMemberships, error: membershipError } = await supabaseAdmin
      .from('tenant_memberships')
      .select('role_code')
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .in('role_code', ['admin', 'campo', 'empaque', 'finanzas'])

    let realCurrentUsers = 0
    if (!membershipError && activeMemberships) {
      realCurrentUsers = activeMemberships.length
    }

    // Si hay discrepancia, corregir el contador en la base de datos
    if (realCurrentUsers !== tenant.current_users) {
      console.log(`[FIX] Corrigiendo current_users de ${tenant.current_users} a ${realCurrentUsers} para tenant ${tenantId}`)
      
      const { error: updateError } = await supabaseAdmin
        .from('tenants')
        .update({ current_users: realCurrentUsers })
        .eq('id', tenantId)
      
      if (updateError) {
        console.error('Error updating corrected current_users:', updateError)
      }
    }

    const maxUsers = tenant.max_users || 3

    return NextResponse.json({
      current_users: realCurrentUsers, // Usar el valor real calculado
      max_users: maxUsers,
      plan: tenant.plan || 'basic',
      can_add_more: maxUsers === -1 || realCurrentUsers < maxUsers
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
