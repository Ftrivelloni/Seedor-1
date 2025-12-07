import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createCheckout } from '@lemonsqueezy/lemonsqueezy.js';
import { LEMON_CONFIG, getVariantId, CHECKOUT_CONFIG, type PlanName } from '@/lib/lemonsqueezy';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

/**
 * POST /api/subscription/checkout
 *
 * Creates a LemonSqueezy checkout session for an existing tenant
 *
 * Request body:
 * - tenantId: string - ID of the tenant
 * - planId: 'basic' | 'pro' | 'enterprise' - Selected plan
 *
 * Returns:
 * - checkoutUrl: string - URL to redirect user to LemonSqueezy checkout
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { tenantId, planId } = body;

        // Validate required fields
        if (!tenantId || !planId) {
            return NextResponse.json(
                { success: false, error: 'Faltan campos requeridos: tenantId, planId' },
                { status: 400 }
            );
        }

        // Validate plan
        const validPlans: PlanName[] = ['basic', 'pro', 'enterprise'];
        if (!validPlans.includes(planId)) {
            return NextResponse.json(
                { success: false, error: 'Plan inválido' },
                { status: 400 }
            );
        }

        // Get tenant details
        const { data: tenant, error: tenantError } = await supabaseAdmin
            .from('tenants')
            .select('*')
            .eq('id', tenantId)
            .single();

        if (tenantError || !tenant) {
            return NextResponse.json(
                { success: false, error: 'Empresa no encontrada' },
                { status: 404 }
            );
        }

        // Get variant ID for the selected plan
        const variantId = getVariantId(planId);

        console.log('[create-checkout] Creating checkout for:', {
            tenantId,
            planId,
            variantId,
            testMode: LEMON_CONFIG.testMode,
        });

        // Create checkout in LemonSqueezy
        const checkoutData = await createCheckout(LEMON_CONFIG.storeId, variantId, {
            checkoutOptions: {
                embed: false,
                media: true,
                logo: true,
            },
            checkoutData: {
                email: tenant.contact_email,
                name: tenant.contact_name || tenant.name,
                custom: {
                    tenant_id: tenantId,
                    plan_id: planId,
                },
            },
            expiresAt: new Date(Date.now() + CHECKOUT_CONFIG.expiresInMs).toISOString(),
            productOptions: {
                redirectUrl: CHECKOUT_CONFIG.successUrl,
                receiptButtonText: 'Ir al Dashboard',
                receiptThankYouNote: '¡Gracias por suscribirte a Seedor!',
            },
            testMode: LEMON_CONFIG.testMode,
        });

        if (!checkoutData || !checkoutData.data) {
            console.error('[create-checkout] Failed to create checkout:', JSON.stringify(checkoutData, null, 2));
            return NextResponse.json(
                { success: false, error: 'Error al crear checkout en LemonSqueezy' },
                { status: 500 }
            );
        }

        // The SDK returns { data: { jsonapi: ..., links: ..., data: { type: 'checkouts', id: ..., attributes: { url: ... } } }, error: null }
        // So we need to access checkoutData.data.data.attributes.url
        // The previous attempt failed because we were looking at checkoutData.data.attributes

        const responseData = checkoutData.data as any;
        const attributes = responseData?.data?.attributes;
        const checkoutUrl = attributes?.url;

        if (!checkoutUrl) {
            console.error('[create-checkout] URL not found in response:', JSON.stringify(checkoutData, null, 2));
            return NextResponse.json(
                { success: false, error: 'No se pudo generar la URL de pago' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            checkoutUrl,
        });

    } catch (error: any) {
        console.error('[create-checkout] Error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Error inesperado al crear checkout',
            },
            { status: 500 }
        );
    }
}
