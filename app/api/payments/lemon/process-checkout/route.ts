import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { buildInvitationUrl } from '@/lib/utils/url';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

type TenantRecord = {
    id: string;
    name: string;
    contact_email: string;
};

async function ensureAdminInvitation(
    supabase: typeof supabaseAdmin,
    tenant: TenantRecord,
    contactEmail: string,
    tokenHint?: string
) {
    const lowerEmail = contactEmail.toLowerCase();

    const { data: existingInvitation, error: fetchInviteError } = await supabase
        .from('invitations')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('email', lowerEmail)
        .is('revoked_at', null)
        .is('accepted_at', null)
        .order('created_at', { ascending: false })
        .maybeSingle();

    if (fetchInviteError) {
        throw new Error('Error buscando invitación: ' + fetchInviteError.message);
    }

    let invitation = existingInvitation;
    let token = tokenHint || existingInvitation?.token_hash;

    if (!invitation) {
        token = token || crypto.randomBytes(24).toString('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

        const { data: newInvitation, error: inviteError } = await supabase
            .from('invitations')
            .insert([
                {
                    tenant_id: tenant.id,
                    email: lowerEmail,
                    role_code: 'admin',
                    token_hash: token,
                    invited_by: null,
                    expires_at: expiresAt,
                },
            ])
            .select()
            .single();

        if (inviteError || !newInvitation) {
            throw new Error('Error creando invitación: ' + (inviteError?.message || 'desconocido'));
        }

        invitation = newInvitation;
    }

    token = token || invitation.token_hash;
    const inviteUrl = buildInvitationUrl('admin', token);

    const { error: sendError } = await supabase.auth.admin.inviteUserByEmail(lowerEmail, {
        redirectTo: inviteUrl,
        data: {
            tenant_id: tenant.id,
            tenant_name: tenant.name,
            role_code: 'admin',
            invitation_token: token,
        },
    });

    let invitationSent = !sendError;
    let fallbackUsed = false;

    if (sendError) {
        // Supabase returns an error when the user already exists; fall back to a magic link
        if (sendError.message?.toLowerCase().includes('already registered')) {
            const { error: magicError } = await supabase.auth.signInWithOtp({
                email: lowerEmail,
                options: {
                    emailRedirectTo: inviteUrl,
                    data: {
                        tenant_id: tenant.id,
                        tenant_name: tenant.name,
                        role_code: 'admin',
                        invitation_token: token,
                    },
                },
            });

            if (!magicError) {
                invitationSent = true;
                fallbackUsed = true;
                console.log('[process-checkout] Enviada magic link para usuario existente');
            } else {
                console.error('[process-checkout] Error enviando magic link:', magicError);
            }
        } else {
            console.error('[process-checkout] Error enviando invitación:', sendError);
        }
    }

    return { invitation, invitationSent, inviteUrl, fallbackUsed };
}

/**
 * POST /api/payments/lemon/process-checkout
 *
 * Process a completed checkout manually (for localhost testing without webhooks)
 * This endpoint should be called from the success page after payment
 *
 * In production, this flow is handled by LemonSqueezy webhooks
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json(
                { success: false, error: 'Email requerido' },
                { status: 400 }
            );
        }

        const lowerEmail = email.toLowerCase();
        console.log('[process-checkout] Processing checkout for email:', lowerEmail);

        // Try to find a pending checkout first
        const { data: checkout, error: checkoutError } = await supabaseAdmin
            .from('lemon_squeezy_checkouts')
            .select('*')
            .eq('contact_email', lowerEmail)
            .eq('completed', false)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (checkoutError && checkoutError.code !== 'PGRST116') {
            console.error('[process-checkout] Error fetching checkout:', checkoutError);
        }

        // Helper to resend invitation for an existing tenant (already processed path)
        const resendForTenant = async (tenant: TenantRecord, alreadyProcessed: boolean) => {
            const inviteResult = await ensureAdminInvitation(supabaseAdmin, tenant, tenant.contact_email);

            return NextResponse.json({
                success: true,
                tenantId: tenant.id,
                tenantName: tenant.name,
                invitationSent: inviteResult.invitationSent,
                alreadyProcessed,
                message: inviteResult.invitationSent
                    ? 'Tu empresa ya estaba creada. Reenviamos el enlace de acceso a tu email.'
                    : 'La empresa ya estaba creada pero no pudimos reenviar el email. Contactá a soporte.',
            });
        };

        // Pending checkout found → create tenant (or reuse) and send invite
        if (checkout) {
            console.log('[process-checkout] Found checkout:', checkout.id);

            // If tenant was already linked to this checkout, just resend the invitation
            if (checkout.tenant_id) {
                const { data: existingTenant } = await supabaseAdmin
                    .from('tenants')
                    .select('id,name,contact_email')
                    .eq('id', checkout.tenant_id)
                    .maybeSingle();

                if (existingTenant) {
                    // Mark checkout as completed just in case
                    await supabaseAdmin
                        .from('lemon_squeezy_checkouts')
                        .update({ completed: true, completed_at: new Date().toISOString() })
                        .eq('id', checkout.id);

                    return resendForTenant(existingTenant, true);
                }
            }

            // Get system user ID for created_by field
            let systemUserId = process.env.SUPABASE_SERVICE_USER_ID || null;

            if (!systemUserId) {
                // Create fallback service user
                try {
                    const svcEmail = `seedor-system-${Date.now()}@local.invalid`;
                    const svcPassword = Math.random().toString(36).slice(2) + Date.now().toString(36);
                    const { data: svcData, error: svcError } = await supabaseAdmin.auth.admin.createUser({
                        email: svcEmail,
                        password: svcPassword,
                        email_confirm: true,
                        user_metadata: { system: true }
                    });

                    if (!svcError && svcData.user) {
                        systemUserId = svcData.user.id;
                        console.log('[process-checkout] Created fallback service user');
                    }
                } catch (err) {
                    console.error('[process-checkout] Failed to create service user:', err);
                }
            }

            if (!systemUserId) {
                return NextResponse.json(
                    { success: false, error: 'Error de configuración del servidor' },
                    { status: 500 }
                );
            }

            // Set limits based on plan
            const limits = checkout.plan_name === 'basico'
                ? { maxUsers: 10, maxFields: 5 }
                : { maxUsers: 30, maxFields: 20 };

            // Create tenant
            const { data: tenant, error: tenantError } = await supabaseAdmin
                .from('tenants')
                .insert([
                    {
                        name: checkout.tenant_name,
                        slug: checkout.tenant_slug,
                        plan: checkout.plan_name,
                        contact_name: checkout.contact_name,
                        contact_email: checkout.contact_email,
                        created_by: systemUserId,
                        max_users: limits.maxUsers,
                        max_fields: limits.maxFields,
                        current_users: 0,
                        current_fields: 0,
                        payment_status: 'active',
                        payment_collected_at: new Date().toISOString(),
                    },
                ])
                .select()
                .single();

            if (tenantError || !tenant) {
                console.error('[process-checkout] Error creating tenant:', tenantError);
                return NextResponse.json(
                    { success: false, error: 'Error creando empresa: ' + (tenantError?.message || 'Unknown') },
                    { status: 500 }
                );
            }

            console.log('[process-checkout] Tenant created:', tenant.id);

            const inviteResult = await ensureAdminInvitation(supabaseAdmin, tenant, checkout.contact_email);

            // Mark checkout as completed
            await supabaseAdmin
                .from('lemon_squeezy_checkouts')
                .update({
                    completed: true,
                    completed_at: new Date().toISOString(),
                    tenant_id: tenant.id,
                })
                .eq('id', checkout.id);

            console.log('[process-checkout] Checkout marked as completed');

            return NextResponse.json({
                success: true,
                tenantId: tenant.id,
                tenantName: tenant.name,
                invitationSent: inviteResult.invitationSent,
                message: inviteResult.invitationSent
                    ? 'Tu empresa fue creada. Revisá tu email para completar la configuración de tu cuenta.'
                    : 'Tu empresa fue creada pero hubo un problema enviando el email. Contactá a soporte.',
            });
        }

        // No pending checkout: try to find an existing tenant and resend invite instead of failing
        const { data: latestCheckout } = await supabaseAdmin
            .from('lemon_squeezy_checkouts')
            .select('*')
            .eq('contact_email', lowerEmail)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        let tenantFallback: TenantRecord | null = null;

        if (latestCheckout?.tenant_id) {
            const { data: existingTenant } = await supabaseAdmin
                .from('tenants')
                .select('id,name,contact_email')
                .eq('id', latestCheckout.tenant_id)
                .maybeSingle();

            tenantFallback = existingTenant || null;
        }

        if (!tenantFallback) {
            const { data: tenantByEmail } = await supabaseAdmin
                .from('tenants')
                .select('id,name,contact_email')
                .ilike('contact_email', lowerEmail)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            tenantFallback = tenantByEmail || null;
        }

        // Try to find by latest invitation for this email
        if (!tenantFallback) {
            const { data: invitation } = await supabaseAdmin
                .from('invitations')
                .select('tenant_id,token_hash')
                .ilike('email', lowerEmail)
                .is('revoked_at', null)
                .is('accepted_at', null)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (invitation?.tenant_id) {
                const { data: tenantFromInvite } = await supabaseAdmin
                    .from('tenants')
                    .select('id,name,contact_email')
                    .eq('id', invitation.tenant_id)
                    .maybeSingle();

                if (tenantFromInvite) {
                    return resendForTenant(tenantFromInvite, true);
                }
            }
        }

        if (tenantFallback) {
            return resendForTenant(tenantFallback, true);
        }

        return NextResponse.json(
            {
                success: true,
                invitationSent: false,
                alreadyProcessed: true,
                message: 'Ya procesamos tu pago pero no pudimos reenviar el email. Contactá a soporte con tu comprobante.',
            },
            { status: 200 }
        );

    } catch (error: any) {
        console.error('[process-checkout] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Error inesperado' },
            { status: 500 }
        );
    }
}
