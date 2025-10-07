import { supabase } from './supabaseClient'
import crypto from 'crypto'

export interface CreateTenantParams {
  tenantName: string
  slug: string
  plan: string
  contactName: string      
  contactEmail: string     
  ownerPassword: string
  ownerPhone?: string
}

export interface InviteUserParams {
  tenantId: string
  email: string
  roleCode: string
  invitedBy: string
}

export interface AcceptInvitationParams {
  token: string
  userData?: {
    fullName: string
    phone?: string
    password: string
  }
}

// Funciones de validación (mantener las existentes)
export const validators = {
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },
  
  phone: (phone: string): boolean => {
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,20}$/
    return phone.trim() === '' || phoneRegex.test(phone)
  },
  
  text: (text: string, minLength: number = 1, maxLength: number = 255): boolean => {
    const trimmed = text.trim()
    return trimmed.length >= minLength && trimmed.length <= maxLength
  },
  
  slug: (slug: string): boolean => {
    const slugRegex = /^[a-z0-9\-]+$/
    return slugRegex.test(slug) && slug.length >= 3 && slug.length <= 50
  },
  
  password: (password: string): boolean => {
    return password.length >= 8 && password.length <= 128
  }
}

export const sanitizeInput = {
  text: (input: string): string => input.trim().replace(/\s+/g, ' '),
  email: (input: string): string => input.trim().toLowerCase(),
  phone: (input: string): string => input.trim(),
  slug: (input: string): string => input.trim().toLowerCase().replace(/[^a-z0-9\-]/g, '')
}

const generateInvitationToken = (): string => {
  return crypto.randomBytes(32).toString('hex')
}

export const authService = {
  sendOwnerVerificationCode: async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('Sending owner verification code to:', email)
      
      if (!validators.email(email)) {
        return { success: false, error: 'Email inválido' }
      }

      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: true, 
          data: {
            is_tenant_owner: true,
            signup_type: 'tenant_registration'
          }
        }
      })

      if (error) {
        console.error('Error sending owner verification:', error)
        
        if (error.message.includes('Signups not allowed')) {
          return { success: false, error: 'El registro de nuevos usuarios está deshabilitado. Contacta al administrador.' }
        }
        
        return { success: false, error: `Error al enviar código: ${error.message}` }
      }

      return { success: true }

    } catch (error: any) {
      console.error('Unexpected error sending owner verification:', error)
      return { success: false, error: error.message || 'Error inesperado' }
    }
  },

  verifyOwnerCode: async (email: string, code: string): Promise<{ success: boolean; error?: string; session?: any }> => {
    try {
      console.log('🔍 Verifying owner code for:', email, 'with code:', code)
      
      const { data, error } = await supabase.auth.verifyOtp({
        email: email,
        token: code,
        type: 'email'
      })

      if (error) {
        console.error('❌ Owner code verification error:', error)
        if (error.message.includes('Invalid login credentials')) {
          return { success: false, error: 'Código inválido. Verificá que hayas ingresado el código correcto.' }
        }
        if (error.message.includes('expired')) {
          return { success: false, error: 'El código ha expirado. Solicitá uno nuevo.' }
        }
        if (error.message.includes('Token has expired')) {
          return { success: false, error: 'El código ha expirado. Solicitá uno nuevo.' }
        }
        if (error.message.includes('Email not confirmed')) {
          return { success: false, error: 'El email no fue confirmado correctamente.' }
        }
        return { success: false, error: 'Código inválido o expirado. Intentá de nuevo.' }
      }

      if (!data.session || !data.user) {
        console.error('❌ No session/user returned from verification')
        return { success: false, error: 'No se pudo crear la sesión. Intentá de nuevo.' }
      }

      console.log('✅ Owner code verified successfully for:', data.user.email)
      return { success: true, session: data.session }

    } catch (error: any) {
      console.error('❌ Unexpected error verifying owner code:', error)
      return { success: false, error: error.message || 'Error inesperado durante la verificación' }
    }
  },

  createTenantWithOwner: async (params: CreateTenantParams): Promise<{ success: boolean; error?: string; data?: any }> => {
    try {
      console.log('Creating tenant with owner...')
      
      const cleanData = {
        tenantName: sanitizeInput.text(params.tenantName),
        slug: sanitizeInput.slug(params.slug),
        plan: params.plan,
        contactName: sanitizeInput.text(params.contactName),
        contactEmail: sanitizeInput.email(params.contactEmail),
        ownerPassword: params.ownerPassword,
        ownerPhone: params.ownerPhone ? sanitizeInput.phone(params.ownerPhone) : null,
      }

      const { data: existingTenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', cleanData.slug)
        .maybeSingle()

      if (existingTenant) {
        return { success: false, error: 'Ya existe una empresa con ese identificador' }
      }

      let session: any = null
      
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        session = sessionData.session
        
        if (!session?.user) {
          console.log('⚠️ No session from getSession, trying refreshSession...')
          const { data: refreshData } = await supabase.auth.refreshSession()
          session = refreshData.session
        }
      } catch (sessionError) {
        console.error('Error getting session:', sessionError)
      }

      if (!session?.user) {
        console.error('❌ No valid session found')
        return { success: false, error: 'Sesión no válida. Por favor, reintentá el proceso.' }
      }

      console.log('✅ Valid session found for user:', session.user.email)

      const planLimits = {
        basico: { maxUsers: 10, maxFields: 5 },
        profesional: { maxUsers: 30, maxFields: 20 }
      }
      
      const limits = planLimits[params.plan as keyof typeof planLimits] || planLimits.basico

      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .insert([{
          name: cleanData.tenantName,
          slug: cleanData.slug,
          plan: cleanData.plan,
          contact_name: cleanData.contactName,
          contact_email: cleanData.contactEmail,
          created_by: session.user.id,
          max_users: limits.maxUsers,
          max_fields: limits.maxFields, 
          current_users: 1,
          current_fields: 0
        }])
        .select()
        .single()

      if (tenantError) {
        console.error('Tenant creation error:', tenantError)
        return { success: false, error: `Error al crear empresa: ${tenantError.message}` }
      }

      console.log('🔄 Updating user metadata with full name...')
      const { error: updateUserError } = await supabase.auth.updateUser({
        data: {
          full_name: cleanData.contactName,
          phone: cleanData.ownerPhone
        }
      })

      if (updateUserError) {
        console.warn('⚠️ Warning: Could not update user metadata:', updateUserError)
      } else {
        console.log('✅ User metadata updated successfully')
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert([{
          user_id: session.user.id,
          full_name: cleanData.contactName,
          phone: cleanData.ownerPhone,
          default_tenant_id: tenantData.id,
        }])

      if (profileError) {
        console.error('❌ Profile creation error:', profileError)
        return { success: false, error: `Error al crear perfil de usuario: ${profileError.message}` }
      }

      const { data: membershipData, error: membershipError } = await supabase
        .from('tenant_memberships')
        .insert([{
          tenant_id: tenantData.id,
          user_id: session.user.id,
          role_code: 'owner',
          status: 'active',
        }])
        .select()
        .single()

      if (membershipError) {
        console.error('Membership creation error:', membershipError)
        return { success: false, error: `Error al crear membresía: ${membershipError.message}` }
      }

      await supabase
        .from('audit_logs')
        .insert([{
          tenant_id: tenantData.id,
          actor_user_id: session.user.id, 
          action: 'tenant_created',  
          entity: 'tenant', 
          entity_id: tenantData.id, 
          details: { tenant_name: tenantData.name, slug: tenantData.slug, plan: cleanData.plan }
        }])

      return { 
        success: true, 
        data: { 
          tenant: tenantData, 
          user: session.user,
          membership: membershipData 
        }
      }

    } catch (error: any) {
      console.error('Unexpected error in createTenantWithOwner:', error)
      return { success: false, error: error.message || 'Error inesperado' }
    }
  },

  getTenantLimits: async (tenantId: string): Promise<{ success: boolean; error?: string; data?: any }> => {
    try {
      const { data: tenant, error } = await supabase
        .from('tenants')
        .select('max_users, current_users, max_fields, current_fields, plan')
        .eq('id', tenantId)
        .single()

      if (error || !tenant) {
        return { success: false, error: 'Tenant no encontrado' }
      }

      const limits = {
        users: {
          max: tenant.max_users,
          current: tenant.current_users,
          available: tenant.max_users - tenant.current_users
        },
        fields: {
          max: tenant.max_fields,
          current: tenant.current_fields,
          available: tenant.max_fields - tenant.current_fields
        },
        plan: tenant.plan
      }

      return { success: true, data: limits }

    } catch (error: any) {
      console.error('Error getting tenant limits:', error)
      return { success: false, error: error.message }
    }
  },

  canAddField: async (tenantId: string): Promise<{ success: boolean; error?: string; canAdd?: boolean }> => {
    try {
      const { success, data, error } = await authService.getTenantLimits(tenantId)
      
      if (!success) {
        return { success: false, error }
      }

      const canAdd = data.fields.available > 0
      
      return { 
        success: true, 
        canAdd,
        error: canAdd ? undefined : `Has alcanzado el límite de ${data.fields.max} campos para tu plan ${data.plan}`
      }

    } catch (error: any) {
      console.error('Error checking field limit:', error)
      return { success: false, error: error.message }
    }
  },

  incrementFieldCount: async (tenantId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('current_fields, max_fields')
        .eq('id', tenantId)
        .single()

      if (!tenant) {
        return { success: false, error: 'Tenant no encontrado' }
      }

      if (tenant.current_fields >= tenant.max_fields) {
        return { success: false, error: 'Se alcanzó el límite máximo de campos' }
      }

      const { error } = await supabase
        .from('tenants')
        .update({ current_fields: tenant.current_fields + 1 })
        .eq('id', tenantId)

      if (error) {
        return { success: false, error: 'Error al actualizar contador de campos' }
      }

      return { success: true }

    } catch (error: any) {
      console.error('Error incrementing field count:', error)
      return { success: false, error: error.message }
    }
  },

  decrementFieldCount: async (tenantId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('current_fields')
        .eq('id', tenantId)
        .single()

      if (!tenant) {
        return { success: false, error: 'Tenant no encontrado' }
      }

      const newCount = Math.max(0, tenant.current_fields - 1)

      const { error } = await supabase
        .from('tenants')
        .update({ current_fields: newCount })
        .eq('id', tenantId)

      if (error) {
        return { success: false, error: 'Error al actualizar contador de campos' }
      }

      return { success: true }

    } catch (error: any) {
      console.error('Error decrementing field count:', error)
      return { success: false, error: error.message }
    }
  },

  inviteUser: async (params: InviteUserParams): Promise<{ success: boolean; error?: string; data?: any }> => {
    try {
      console.log('🔍 Starting inviteUser with params:', params)
      
      const token = generateInvitationToken()
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
      
      console.log('🔍 Generated token:', token)
      console.log('🔍 Expires at:', expiresAt.toISOString())

      console.log('🔍 Step 1: Checking tenant...')
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('current_users, max_users, name')
        .eq('id', params.tenantId)
        .single()

      if (tenantError) {
        console.error('❌ Tenant error:', tenantError)
        return { success: false, error: `Error al buscar tenant: ${tenantError.message}` }
      }

      if (!tenant) {
        console.error('❌ Tenant not found')
        return { success: false, error: 'Tenant no encontrado' }
      }

      console.log('✅ Tenant found:', tenant)

      console.log('🔍 Step 2: Checking permissions...')
      const { data: membership, error: membershipError } = await supabase
        .from('tenant_memberships')
        .select('role_code')
        .eq('tenant_id', params.tenantId)
        .eq('user_id', params.invitedBy)
        .eq('status', 'active')
        .single()

      if (membershipError) {
        console.error('❌ Membership error:', membershipError)
        return { success: false, error: `Error al verificar permisos: ${membershipError.message}` }
      }

      if (!membership) {
        console.error('❌ No membership found')
        return { success: false, error: 'No se encontró membresía activa' }
      }

      console.log('✅ Membership found:', membership)

      console.log('🔍 Step 3: Checking existing invitation...')
      const cleanEmail = sanitizeInput.email(params.email)

      const { data: existingInvitation, error: existingError } = await supabase
        .from('invitations')
        .select('id')
        .eq('tenant_id', params.tenantId)
        .eq('email', cleanEmail)
        .is('accepted_at', null)
        .is('revoked_at', null)
        .maybeSingle()

      if (existingError) {
        console.error('❌ Existing invitation check error:', existingError)
        return { success: false, error: `Error al verificar invitaciones: ${existingError.message}` }
      }

      if (existingInvitation) {
        console.error('❌ Existing invitation found:', existingInvitation)
        return { success: false, error: 'Ya existe una invitación pendiente para este email' }
      }

      console.log('✅ No existing invitation')

      console.log('🔍 Step 4: Verifying inviter profile...')
      
      const { data: inviterProfile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('user_id', params.invitedBy)
        .single()

      if (profileError || !inviterProfile) {
        console.error('❌ Inviter profile not found:', profileError)
        return { success: false, error: 'El usuario invitador no tiene un perfil válido' }
      }

      console.log('✅ Inviter profile verified')

      console.log('🔍 Step 5: Creating invitation...')
      
      const insertData = {
        tenant_id: params.tenantId,
        email: cleanEmail,
        role_code: params.roleCode,
        token_hash: token, 
        invited_by: params.invitedBy,
        expires_at: expiresAt.toISOString()
      }
      
      console.log('🔍 Insert data:', insertData)

      const { data: invitation, error: insertError } = await supabase
        .from('invitations')
        .insert([insertData])
        .select()
        .single()

      if (insertError) {
        console.error('❌ Insert error:', insertError)
        console.error('❌ Error code:', insertError.code)
        console.error('❌ Error details:', insertError.details)
        console.error('❌ Error hint:', insertError.hint)
        console.error('❌ Error message:', insertError.message)
        return { success: false, error: `Error al crear invitación: ${insertError.message}` }
      }

      if (!invitation) {
        console.error('❌ No invitation returned')
        return { success: false, error: 'No se retornó la invitación creada' }
      }

      console.log('✅ Invitation created successfully:', invitation)

      const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/user-setup?token=${token}`
      console.log('🔗 Invite URL:', inviteUrl)

      console.log('🔍 Step 6: Sending invitation email...')
      
      const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
        cleanEmail,
        {
          redirectTo: inviteUrl,
          data: {
            tenant_id: params.tenantId,
            tenant_name: tenant.name,
            role_code: params.roleCode,
            invitation_token: token,
            invited_by_id: params.invitedBy,
            full_name: params.email.split('@')[0]
          }
        }
      )

      if (inviteError) {
        console.error('❌ Error sending invitation email:', inviteError)
        
        await supabase
          .from('invitations')
          .delete()
          .eq('id', invitation.id)

        return { success: false, error: `Error al enviar invitación: ${inviteError.message}` }
      }

      console.log('✅ Invitation email sent successfully')

      return { 
        success: true, 
        data: { 
          invitation: {
            ...invitation,
            tenants: { name: tenant.name }
          }, 
          inviteUrl,
          message: 'Invitación enviada por email. El usuario recibirá un enlace para establecer su contraseña.'
        } 
      }

    } catch (error: any) {
      console.error('❌ Unexpected error in inviteUser:', error)
      console.error('❌ Stack trace:', error.stack)
      return { success: false, error: `Error inesperado: ${error.message}` }
    }
  },

  inviteAdmin: async (tenantId: string, adminEmail: string, invitedBy: string): Promise<{ success: boolean; error?: string; data?: any }> => {
    try {
      console.log('🔄 Calling invite-admin API...')

      const response = await fetch('/api/auth/invite-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenantId,
          adminEmail,
          invitedBy
        })
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('❌ API error:', result.error)
        return { success: false, error: result.error || 'Error al enviar invitación' }
      }

      console.log('✅ Admin invitation API call successful')
      return { success: true, data: result.data }

    } catch (error: any) {
      console.error('❌ Error calling invite-admin API:', error)
      return { success: false, error: error.message || 'Error inesperado' }
    }
  },

  getTenantInvitations: async (tenantId: string, userId: string): Promise<{ success: boolean; error?: string; data?: any }> => {
    try {
      const { data: membership } = await supabase
        .from('tenant_memberships')
        .select('role_code')
        .eq('tenant_id', tenantId)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()

      if (!membership || !['owner', 'admin'].includes(membership.role_code)) {
        return { success: false, error: 'No tienes permisos para ver las invitaciones' }
      }

      const { data: invitations, error } = await supabase
        .from('invitations')
        .select('*, roles(name), profiles!invited_by(full_name)')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })

      if (error) {
        return { success: false, error: 'Error al obtener invitaciones' }
      }

      return { success: true, data: invitations }

    } catch (error: any) {
      console.error('Error getting tenant invitations:', error)
      return { success: false, error: error.message }
    }
  },

  getInvitationByToken: async (token: string): Promise<{ success: boolean; error?: string; data?: any }> => {
    try {
      console.log('🔍 Getting invitation by token...');
      
      const { data: invitation, error } = await supabase
        .from('invitations')
        .select(`
          *,
          tenants(name),
          roles(name)
        `)
        .eq('token_hash', token)
        .is('accepted_at', null)
        .is('revoked_at', null)
        .single()

      if (error) {
        console.error('❌ Database error getting invitation:', error);
        if (error.code === 'PGRST116') {
          return { success: false, error: 'Invitación no encontrada o ya fue utilizada' }
        }
        return { success: false, error: 'Error al buscar invitación' }
      }

      if (!invitation) {
        return { success: false, error: 'Invitación no encontrada' }
      }

      if (new Date() > new Date(invitation.expires_at)) {
        return { success: false, error: 'La invitación ha expirado' }
      }

      console.log('✅ Invitation found and valid');
      return { success: true, data: invitation }

    } catch (error: any) {
      console.error('❌ Error getting invitation:', error)
      return { success: false, error: error.message || 'Error inesperado' }
    }
  },

  acceptInvitationWithSetup: async (params: AcceptInvitationParams): Promise<{ success: boolean; error?: string; data?: any }> => {
    try {
      console.log('🔄 Starting acceptInvitationWithSetup process...');
      
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        return { success: false, error: 'No hay sesión activa. Por favor, usa el link del email de invitación.' }
      }

      const invitationResult = await authService.getInvitationByToken(params.token)
      if (!invitationResult.success || !invitationResult.data) {
        return { success: false, error: invitationResult.error }
      }

      const invitation = invitationResult.data
      console.log('✅ Invitation found:', invitation.email, invitation.role_code);

      if (session.user.email !== invitation.email) {
        return { success: false, error: 'El email de la sesión no coincide con la invitación' }
      }

      if (params.userData?.password) {
        console.log('🔄 Setting password with temporal session...');
        const { error: passwordError } = await supabase.auth.updateUser({
          password: params.userData.password,
          data: {
            full_name: params.userData.fullName,
            phone: params.userData.phone || null
          }
        })

        if (passwordError) {
          console.error('❌ Error setting password:', passwordError)
          return { success: false, error: `Error al establecer contraseña: ${passwordError.message}` }
        }
        console.log('✅ Password set successfully');
      }

      const { data: tenant } = await supabase
        .from('tenants')
        .select('current_users, max_users')
        .eq('id', invitation.tenant_id)
        .single()

      if (!tenant) {
        return { success: false, error: 'Tenant no encontrado' }
      }

      if (tenant.current_users >= tenant.max_users) {
        return { success: false, error: 'Se alcanzó el límite máximo de usuarios para este tenant' }
      }

      console.log('🔄 Creating tenant membership...');
      const { data: membershipData, error: membershipError } = await supabase
        .from('tenant_memberships')
        .insert([{
          tenant_id: invitation.tenant_id,
          user_id: session.user.id,
          role_code: invitation.role_code,
          status: 'active',
          invited_by: invitation.invited_by,
          accepted_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (membershipError) {
        console.error('❌ Membership creation error:', membershipError)
        return { success: false, error: `Error al crear membresía: ${membershipError.message}` }
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert([{
          user_id: session.user.id,
          full_name: params.userData?.fullName || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '',
          phone: params.userData?.phone || session.user.user_metadata?.phone || null,
          default_tenant_id: invitation.tenant_id,
        }], { onConflict: 'user_id' })

      if (profileError) {
        console.warn('⚠️ Profile update warning:', profileError);
      }

      const { error: updateError } = await supabase
        .from('tenants')
        .update({ current_users: tenant.current_users + 1 })
        .eq('id', invitation.tenant_id)

      if (updateError) {
        console.warn('⚠️ Error updating tenant user count:', updateError);
      }

      await supabase
        .from('invitations')
        .update({ 
          accepted_at: new Date().toISOString()
        })
        .eq('id', invitation.id)

      await supabase
        .from('audit_logs')
        .insert([{
          tenant_id: invitation.tenant_id,
          actor_user_id: session.user.id,
          action: 'invitation_accepted', 
          entity: 'invitation', 
          entity_id: invitation.id, 
          details: { 
            email: invitation.email,
            role: invitation.role_code,
            flow: 'setup_form'
          }
        }])

      console.log('✅ Invitation accepted successfully');

      return { 
        success: true, 
        data: { 
          userId: session.user.id, 
          tenantId: invitation.tenant_id,
          membership: membershipData,
          role: invitation.role_code
        } 
      }

    } catch (error: any) {
      console.error('❌ Error accepting invitation:', error)
      return { success: false, error: error.message || 'Error inesperado' }
    }
  },

  acceptInvitationSimple: async (token: string): Promise<{ success: boolean; error?: string; data?: any }> => {
    try {
      console.log('🔄 Starting acceptInvitationSimple process...');
      
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        return { success: false, error: 'No hay sesión activa. Por favor, establece tu contraseña primero.' }
      }

      const invitationResult = await authService.getInvitationByToken(token)
      if (!invitationResult.success || !invitationResult.data) {
        return { success: false, error: invitationResult.error }
      }

      const invitation = invitationResult.data
      console.log('✅ Invitation found:', invitation.email, invitation.role_code);

      if (session.user.email !== invitation.email) {
        return { success: false, error: 'El email de la sesión no coincide con la invitación' }
      }

      const { data: tenant } = await supabase
        .from('tenants')
        .select('current_users, max_users')
        .eq('id', invitation.tenant_id)
        .single()

      if (!tenant) {
        return { success: false, error: 'Tenant no encontrado' }
      }

      if (tenant.current_users >= tenant.max_users) {
        return { success: false, error: 'Se alcanzó el límite máximo de usuarios para este tenant' }
      }

      console.log('🔄 Creating tenant membership...');
      const { data: membershipData, error: membershipError } = await supabase
        .from('tenant_memberships')
        .insert([{
          tenant_id: invitation.tenant_id,
          user_id: session.user.id,
          role_code: invitation.role_code,
          status: 'active',
          invited_by: invitation.invited_by,
          accepted_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (membershipError) {
        console.error('❌ Membership creation error:', membershipError)
        return { success: false, error: `Error al crear membresía: ${membershipError.message}` }
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert([{
          user_id: session.user.id,
          full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '',
          phone: session.user.user_metadata?.phone || null,
          default_tenant_id: invitation.tenant_id,
        }], { onConflict: 'user_id' })

      if (profileError) {
        console.warn('⚠️ Profile update warning:', profileError);
      }

      const { error: updateError } = await supabase
        .from('tenants')
        .update({ current_users: tenant.current_users + 1 })
        .eq('id', invitation.tenant_id)

      if (updateError) {
        console.warn('⚠️ Error updating tenant user count:', updateError);
      }

      await supabase
        .from('invitations')
        .update({ 
          accepted_at: new Date().toISOString()
        })
        .eq('id', invitation.id)

      await supabase
        .from('audit_logs')
        .insert([{
          tenant_id: invitation.tenant_id,
          actor_user_id: session.user.id,
          action: 'invitation_accepted', 
          entity: 'invitation', 
          entity_id: invitation.id, 
          details: { 
            email: invitation.email,
            role: invitation.role_code,
            flow: 'simplified'
          }
        }])

      console.log('✅ Invitation accepted successfully');

      return { 
        success: true, 
        data: { 
          userId: session.user.id, 
          tenantId: invitation.tenant_id,
          membership: membershipData,
          role: invitation.role_code
        } 
      }

    } catch (error: any) {
      console.error('❌ Error accepting invitation:', error)
      return { success: false, error: error.message || 'Error inesperado' }
    }
  },

  acceptInvitation: async (params: AcceptInvitationParams): Promise<{ success: boolean; error?: string; data?: any }> => {
    try {
      console.log('🔄 Starting acceptInvitation process...');
      
      const invitationResult = await authService.getInvitationByToken(params.token)
      if (!invitationResult.success || !invitationResult.data) {
        return { success: false, error: invitationResult.error }
      }

      const invitation = invitationResult.data
      console.log('✅ Invitation found:', invitation.email, invitation.role_code);

      const { data: tenant } = await supabase
        .from('tenants')
        .select('current_users, max_users')
        .eq('id', invitation.tenant_id)
        .single()

      if (!tenant) {
        return { success: false, error: 'Tenant no encontrado' }
      }

      if (tenant.current_users >= tenant.max_users) {
        return { success: false, error: 'Se alcanzó el límite máximo de usuarios para este tenant' }
      }

      let userId: string
      let isNewUser = false

      const { data: currentSession } = await supabase.auth.getSession()
      
      if (currentSession.session && currentSession.session.user.email === invitation.email) {
        console.log('✅ User already logged in with correct email');
        userId = currentSession.session.user.id
      } else {
        if (!params.userData) {
          return { success: false, error: 'Se requieren datos de usuario para crear la cuenta' }
        }

        console.log('🔄 Updating existing user password...');
        
        try {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: invitation.email,
            password: 'temp-password-' + Math.random() // Password temporal
          })

          if (signInError && !signInError.message.includes('Invalid login credentials')) {
            throw signInError
          }

          const { data: adminUsers, error: listError } = await supabase.auth.admin.listUsers()
          
          if (listError) {
            throw new Error(`Error obteniendo usuarios: ${listError.message}`)
          }

          const existingUser = adminUsers.users.find((u: { email: string; id: string }) => u.email === invitation.email)
          
          if (!existingUser) {
            throw new Error('Usuario no encontrado en el sistema')
          }

          userId = existingUser.id

          const { error: updateError } = await supabase.auth.admin.updateUserById(
            userId,
            {
              password: params.userData.password,
              user_metadata: {
                full_name: params.userData.fullName,
                phone: params.userData.phone
              }
            }
          )

          if (updateError) {
            throw new Error(`Error actualizando usuario: ${updateError.message}`)
          }

          console.log('✅ User password updated successfully');

          const { data: newSignIn, error: newSignInError } = await supabase.auth.signInWithPassword({
            email: invitation.email,
            password: params.userData.password
          })

          if (newSignInError) {
            throw new Error(`Error al iniciar sesión: ${newSignInError.message}`)
          }

          isNewUser = false

        } catch (authError: any) {
          console.error('❌ Error updating user password:', authError);
          return { success: false, error: authError.message || 'Error al configurar credenciales' }
        }

        console.log('🔄 Creating/updating profile for user:', userId);
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .upsert([{
            user_id: userId,
            full_name: params.userData.fullName,
            phone: params.userData.phone,
            default_tenant_id: invitation.tenant_id,
          }], { onConflict: 'user_id' })
          .select()
          .single()

        if (profileError) {
          console.error('❌ Error creating/updating profile:', profileError);
          console.error('❌ Profile error details:', profileError.details);
          console.error('❌ Profile error hint:', profileError.hint);
        } else {
          console.log('✅ Profile created/updated successfully:', profileData);
        }
      }

      console.log('🔄 Creating tenant membership...');

      const { data: membershipData, error: membershipError } = await supabase
        .from('tenant_memberships')
        .insert([{
          tenant_id: invitation.tenant_id,
          user_id: userId,
          role_code: invitation.role_code,
          status: 'active',
          invited_by: invitation.invited_by,
          accepted_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (membershipError) {
        console.error('❌ Membership creation error:', membershipError)
        return { success: false, error: `Error al crear membresía: ${membershipError.message}` }
      }

      const { error: updateError } = await supabase
        .from('tenants')
        .update({ current_users: tenant.current_users + 1 })
        .eq('id', invitation.tenant_id)

      if (updateError) {
        console.warn('⚠️ Error updating tenant user count:', updateError);
      }

      await supabase
        .from('invitations')
        .update({ 
          accepted_at: new Date().toISOString()
        })
        .eq('id', invitation.id)

      await supabase
        .from('audit_logs')
        .insert([{
          tenant_id: invitation.tenant_id,
          actor_user_id: userId,
          action: 'invitation_accepted', 
          entity: 'invitation', 
          entity_id: invitation.id, 
          details: { 
            email: invitation.email,
            role: invitation.role_code,
            is_new_user: isNewUser 
          }
        }])

      console.log('✅ Invitation accepted successfully');

      return { 
        success: true, 
        data: { 
          userId, 
          tenantId: invitation.tenant_id,
          membership: membershipData,
          isNewUser
        } 
      }

    } catch (error: any) {
      console.error('❌ Error accepting invitation:', error)
      return { success: false, error: error.message || 'Error inesperado' }
    }
  },

  revokeInvitation: async (invitationId: string, revokedBy: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data: invitation, error: getError } = await supabase
        .from('invitations')
        .select('*')
        .eq('id', invitationId)
        .single()

      if (getError || !invitation) {
        return { success: false, error: 'Invitación no encontrada' }
      }

      const { error } = await supabase
        .from('invitations')
        .update({ 
          revoked_at: new Date().toISOString()
        })
        .eq('id', invitationId)

      if (error) {
        return { success: false, error: 'Error al revocar invitación' }
      }

      await supabase
        .from('audit_logs')
        .insert([{
          tenant_id: invitation.tenant_id,
          actor_user_id: revokedBy,
          action: 'invitation_revoked',
          entity: 'invitation', 
          entity_id: invitationId,
          details: { 
            invited_email: invitation.email,
            role: invitation.role_code 
          }
        }])

      return { success: true }

    } catch (error: any) {
      console.error('Error revoking invitation:', error)
      return { success: false, error: error.message }
    }
  },

  login: async (email: string, password: string): Promise<{ user?: any; error?: string }> => {
    try {
      const cleanEmail = sanitizeInput.email(email)
      
      if (!validators.email(cleanEmail) || !validators.password(password)) {
        return { error: 'Credenciales inválidas' }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password,
      })

      if (error) {
        return { error: 'Email o contraseña incorrectos' }
      }

      if (!data.user) {
        return { error: 'No se pudo iniciar sesión' }
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', data.user.id)
        .maybeSingle()

      const { data: memberships } = await supabase
        .from('tenant_memberships')
        .select('*, tenants(*)')
        .eq('user_id', data.user.id)
        .eq('status', 'active')

      return {
        user: {
          ...data.user,
          profile,
          memberships
        }
      }

    } catch (error: any) {
      return { error: error.message }
    }
  },

  getSafeSession: async () => {
    try {
      console.log('🔍 Getting safe session...');
      
      const { data: { session } } = await supabase.auth.getSession();
      
      console.log('📋 Session obtained:', {
        hasSession: !!session,
        userEmail: session?.user?.email
      });

      if (!session?.user) {
        console.log('📋 No user session found');
        return { user: null }
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      const { data: memberships, error: membershipError } = await supabase
        .from('tenant_memberships')
        .select('*, tenants(*)')
        .eq('user_id', session.user.id)
        .eq('status', 'active');

      console.log('✅ Profile and memberships loaded');
      console.log('📋 Debug memberships:', {
        userId: session.user.id,
        membershipCount: memberships?.length || 0,
        memberships: memberships,
        membershipError: membershipError
      });

      let mappedUser = null;

      if (memberships && memberships.length > 0) {
        const defaultMembership = memberships[0]
        mappedUser = {
          id: session.user.id,
          email: session.user.email,
          nombre: profile?.full_name || session.user.email,
          rol: defaultMembership.role_code,
          tenantId: defaultMembership.tenant_id,
          tenant: defaultMembership.tenants,
          profile,
          memberships
        }
      } else {
        mappedUser = {
          id: session.user.id,
          email: session.user.email,
          nombre: profile?.full_name || session.user.email,
          rol: null,
          tenantId: null,
          tenant: null,
          profile,
          memberships: []
        }
      }

      console.log('✅ User mapped successfully:', {
        email: mappedUser.email,
        rol: mappedUser.rol,
        tenantId: mappedUser.tenantId
      });

      return {
        user: mappedUser
      }

    } catch (error: any) {
      console.error('❌ Error in getSafeSession:', error);
      return { user: null, error: error.message }
    }
  },

  getCurrentUser: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        return null
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle()

      const { data: memberships } = await supabase
        .from('tenant_memberships')
        .select('*, tenants(*)')
        .eq('user_id', session.user.id)
        .eq('status', 'active')

      if (memberships && memberships.length > 0) {
        const defaultMembership = memberships[0]
        return {
          id: session.user.id,
          email: session.user.email,
          nombre: profile?.full_name || session.user.email,
          rol: defaultMembership.role_code,
          tenantId: defaultMembership.tenant_id,
          tenant: defaultMembership.tenants
        }
      }

      return {
        id: session.user.id,
        email: session.user.email,
        nombre: profile?.full_name || session.user.email,
        rol: null,
        tenantId: null,
        tenant: null
      }

    } catch (error: any) {
      console.error('Error getting current user:', error)
      return null
    }
  },

  acceptAdminInvitation: async (params: { token: string; workerData: any }): Promise<{ success: boolean; error?: string; data?: any }> => {
    try {
      console.log('🔄 Starting acceptAdminInvitation process...');
      
      const invitationResult = await authService.getInvitationByToken(params.token)
      if (!invitationResult.success || !invitationResult.data) {
        return { success: false, error: invitationResult.error }
      }

      const invitation = invitationResult.data
      console.log('✅ Admin invitation found:', invitation.email);

      if (invitation.role_code !== 'admin') {
        return { success: false, error: 'Esta invitación no es para administrador' }
      }

      const { data: tenant } = await supabase
        .from('tenants')
        .select('current_users, max_users')
        .eq('id', invitation.tenant_id)
        .single()

      if (!tenant) {
        return { success: false, error: 'Tenant no encontrado' }
      }

      if (tenant.current_users >= tenant.max_users) {
        return { success: false, error: 'Se alcanzó el límite máximo de usuarios para este tenant' }
      }

      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user || session.user.email !== invitation.email) {
        return { success: false, error: 'Sesión de usuario no válida' }
      }

      const userId = session.user.id

      console.log('🔄 Creating admin membership...');

      const { data: membershipData, error: membershipError } = await supabase
        .from('tenant_memberships')
        .insert([{
          tenant_id: invitation.tenant_id,
          user_id: userId,
          role_code: 'admin',
          status: 'active',
          invited_by: invitation.invited_by,
          accepted_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (membershipError) {
        console.error('❌ Admin membership creation error:', membershipError)
        return { success: false, error: `Error al crear membresía: ${membershipError.message}` }
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert([{
          user_id: userId,
          full_name: params.workerData.fullName,
          phone: params.workerData.phone,
          default_tenant_id: invitation.tenant_id,
        }])

      if (profileError) {
        console.warn('⚠️ Profile creation warning:', profileError);
      }

      const { data: workerData, error: workerError } = await supabase
        .from('workers')
        .insert([{
          tenant_id: invitation.tenant_id,
          full_name: params.workerData.fullName,
          document_id: params.workerData.documentId || '',
          email: invitation.email,
          phone: params.workerData.phone || null,
          area_module: 'administracion',
          membership_id: membershipData.id,
          status: 'active'
        }])
        .select()
        .single()

      if (workerError) {
        console.warn('⚠️ Error creating admin worker profile:', workerError);
      }

      const { error: updateError } = await supabase
        .from('tenants')
        .update({ current_users: tenant.current_users + 1 })
        .eq('id', invitation.tenant_id)

      if (updateError) {
        console.warn('⚠️ Error updating tenant user count:', updateError);
      }

      await supabase
        .from('invitations')
        .update({ 
          accepted_at: new Date().toISOString()
        })
        .eq('id', invitation.id)

      await supabase
        .from('audit_logs')
        .insert([{
          tenant_id: invitation.tenant_id,
          actor_user_id: userId,
          action: 'admin_invitation_accepted', 
          entity: 'invitation', 
          entity_id: invitation.id, 
          details: { 
            email: invitation.email,
            worker_id: params.workerData.workerId,
            context: 'admin_setup_complete'
          }
        }])

      console.log('✅ Admin invitation accepted successfully');

      return { 
        success: true, 
        data: { 
          userId, 
          tenantId: invitation.tenant_id,
          membership: membershipData,
          isNewAdmin: true
        } 
      }

    } catch (error: any) {
      console.error('❌ Error accepting admin invitation:', error)
      return { success: false, error: error.message || 'Error inesperado' }
    }
  },

  logout: async (): Promise<{ error?: string }> => {
    try {
      console.log('🔄 Starting logout process...')
      
      const { error } = await supabase.auth.signOut()
      
      if (typeof window !== 'undefined') {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-') || key.startsWith('supabase.') || key.includes('seedor')) {
            localStorage.removeItem(key)
          }
        })
        
        Object.keys(sessionStorage).forEach(key => {
          if (key.startsWith('sb-') || key.startsWith('supabase.') || key.includes('seedor')) {
            sessionStorage.removeItem(key)
          }
        })
        
        console.log('✅ Local storage cleared')
      }
      
      if (error) {
        console.error('❌ Logout error:', error)
        return { error: error.message }
      }
      
      console.log('✅ Logout successful')
      return {}
    } catch (error: any) {
      console.error('❌ Unexpected logout error:', error)
      return { error: error.message }
    }
  }
}