import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { buildInvitationUrl } from '@/lib/utils/url';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

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

        console.log('[process-checkout] Processing checkout for email:', email);

        // Find pending checkout for this email
        const { data: checkout, error: checkoutError } = await supabaseAdmin
            .from('lemon_squeezy_checkouts')
            .select('*')
            .eq('contact_email', email.toLowerCase())
            .eq('completed', false)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (checkoutError || !checkout) {
            console.error('[process-checkout] Checkout not found:', checkoutError);
            return NextResponse.json(
                { success: false, error: 'No se encontró checkout pendiente para este email' },
                { status: 404 }
            );
        }

        console.log('[process-checkout] Found checkout:', checkout.id);

        // Check if tenant already exists
        if (checkout.tenant_id) {
            console.log('[process-checkout] Tenant already exists:', checkout.tenant_id);
            return NextResponse.json({
                success: true,
                tenantId: checkout.tenant_id,
                message: 'Tenant ya creado. Revisá tu email para completar la configuración.',
                alreadyProcessed: true,
            });
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

        // Create invitation for admin role
        const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

        const { data: invitation, error: inviteError } = await supabaseAdmin
            .from('invitations')
            .insert([
                {
                    tenant_id: tenant.id,
                    email: checkout.contact_email.toLowerCase(),
                    role_code: 'admin',
                    token_hash: token,
                    invited_by: null,
                    expires_at: expiresAt,
                },
            ])
            .select()
            .single();

        let invitationSent = false;

        if (!inviteError && invitation) {
            console.log('[process-checkout] Invitation created:', invitation.id);

            // Send invitation email via Supabase
            const inviteUrl = buildInvitationUrl('admin', token);

            const { error: sendError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
                checkout.contact_email.toLowerCase(),
                {
                    redirectTo: inviteUrl,
                    data: {
                        tenant_id: tenant.id,
                        tenant_name: tenant.name,
                        role_code: 'admin',
                        invitation_token: token,
                    },
                }
            );

            if (!sendError) {
                invitationSent = true;
                console.log('[process-checkout] Invitation email sent to:', checkout.contact_email);
            } else {
                console.error('[process-checkout] Error sending invitation email:', sendError);
            }
        } else {
            console.error('[process-checkout] Error creating invitation:', inviteError);
        }

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
            invitationSent,
            message: invitationSent
                ? 'Tu empresa fue creada. Revisá tu email para completar la configuración de tu cuenta.'
                : 'Tu empresa fue creada pero hubo un problema enviando el email. Contactá a soporte.',
        });

    } catch (error: any) {
        console.error('[process-checkout] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Error inesperado' },
            { status: 500 }
        );
    }
}
