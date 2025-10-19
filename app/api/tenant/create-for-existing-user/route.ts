import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tenantName, slug, plan, contactName, contactEmail, ownerPhone, existingUserId } = body

    if (!tenantName || !slug || !existingUserId) {
      return NextResponse.json({ success: false, error: 'Faltan campos requeridos' }, { status: 400 })
    }

    // Ensure slug uniqueness to avoid duplicate key violation on tenants.slug
    const generateSlug = (name: string) => {
      return String(name || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').substring(0, 50)
    }

    const baseSlug = slug && String(slug).trim().length > 0 ? String(slug).trim() : generateSlug(tenantName)
    let candidateSlug = baseSlug
    let suffix = 0
    while (true) {
      const { data: existing, error: selErr } = await supabaseAdmin
        .from('tenants')
        .select('id')
        .eq('slug', candidateSlug)
        .maybeSingle()

      if (selErr) {
        return NextResponse.json({ success: false, error: selErr.message || 'Error verificando slug' }, { status: 500 })
      }

      if (!existing) break

      suffix += 1
      candidateSlug = `${baseSlug}-${suffix}`
    }

    // Create tenant and tenant_membership in a simple sequence; better to wrap in transaction if supported
    const limits = plan === 'basico' ? { maxUsers: 10, maxFields: 5 } : { maxUsers: 30, maxFields: 20 }

    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .insert([{
        name: tenantName,
        slug: candidateSlug,
        plan,
        contact_name: contactName,
        contact_email: contactEmail,
        created_by: existingUserId,
        max_users: limits.maxUsers,
        max_fields: limits.maxFields,
        current_users: 0,
        current_fields: 0
      }])
      .select()
      .single()

    if (tenantError || !tenant) {
      return NextResponse.json({ success: false, error: tenantError?.message || 'Error al crear tenant' }, { status: 500 })
    }

    // create membership as admin
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('tenant_memberships')
      .insert([{
        tenant_id: tenant.id,
        user_id: existingUserId,
        role_code: 'admin',
        status: 'active',
        accepted_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (membershipError) {
      // rollback tenant
      await supabaseAdmin.from('tenants').delete().eq('id', tenant.id)
      return NextResponse.json({ success: false, error: membershipError.message || 'Error creando membresía' }, { status: 500 })
    }

    // increment current_users
    const { error: updateError } = await supabaseAdmin
      .from('tenants')
      .update({ current_users: tenant.current_users + 1 })
      .eq('id', tenant.id)

    if (updateError) {
      console.error('Error incrementing tenant current_users:', updateError)
    }

    return NextResponse.json({ success: true, data: { tenant, membership } })

  } catch (error: any) {
    console.error('create-for-existing-user error', error)
    return NextResponse.json({ success: false, error: error.message || 'Error inesperado' }, { status: 500 })
  }
}
