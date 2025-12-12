import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createCheckout } from '@lemonsqueezy/lemonsqueezy.js';
import { LEMON_CONFIG, getVariantId, CHECKOUT_CONFIG, configureLemonSqueezy, type PlanName, type FrontendPlanName } from '@/lib/lemonsqueezy';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

/**
 * POST /api/payments/lemon/create-checkout
 *
 * Creates a LemonSqueezy checkout session for tenant registration
 *
 * Request body:
 * - tenantName: string - Name of the tenant/company
 * - slug: string - Unique slug for the tenant
 * - plan: 'basico' | 'profesional' - Selected plan
 * - contactName: string - Name of the contact person
 * - contactEmail: string - Email of the contact person
 * - ownerPhone?: string - Optional phone number
 *
 * Returns:
 * - checkoutUrl: string - URL to redirect user to LemonSqueezy checkout
 * - checkoutId: string - Unique checkout ID for tracking
 */
export async function POST(request: NextRequest) {
  try {
    // Ensure Lemon Squeezy is configured
    configureLemonSqueezy();

    const body = await request.json();
    const { tenantName, slug, plan, contactName, contactEmail, ownerPhone } = body;

    // Validate required fields
    if (!tenantName || !slug || !plan || !contactName || !contactEmail) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Validate plan
    const validPlans: FrontendPlanName[] = ['basico', 'profesional'];
    if (!validPlans.includes(plan as FrontendPlanName)) {
      return NextResponse.json(
        { success: false, error: 'Plan inválido. Debe ser "basico" o "profesional"' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail)) {
      return NextResponse.json(
        { success: false, error: 'Email inválido' },
        { status: 400 }
      );
    }

    // Check if email already has a pending checkout
    const { data: existingCheckout } = await supabaseAdmin
      .from('lemon_squeezy_checkouts')
      .select('*')
      .eq('contact_email', contactEmail.toLowerCase())
      .eq('completed', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (existingCheckout) {
      // Return existing checkout URL
      return NextResponse.json({
        success: true,
        checkoutUrl: existingCheckout.checkout_url,
        checkoutId: existingCheckout.checkout_id,
        message: 'Ya existe un checkout pendiente para este email',
      });
    }

    // Get variant ID for the selected plan
    const variantIdString = getVariantId(plan);
    const variantId = parseInt(variantIdString, 10);
    const storeId = parseInt(LEMON_CONFIG.storeId, 10);

    console.log('[create-checkout] Creating checkout for:', {
      email: contactEmail,
      plan,
      variantId,
      storeId,
      testMode: LEMON_CONFIG.testMode,
    });

    // Create checkout in LemonSqueezy
    const checkoutData = await createCheckout(
      storeId,
      variantId,
      {
        checkoutOptions: {
          embed: false,
          media: true,
          logo: true,
          desc: true,
          discount: true,
        },
        checkoutData: {
          email: contactEmail.toLowerCase(),
          name: contactName,
          custom: {
            tenant_name: tenantName,
            tenant_slug: slug,
            contact_name: contactName,
            contact_email: contactEmail.toLowerCase(),
            owner_phone: ownerPhone || '',
            plan: plan,
          },
        },
        expiresAt: new Date(Date.now() + CHECKOUT_CONFIG.expiresInMs).toISOString(),
        productOptions: {
          name: plan === 'basico' ? 'Plan Básico' : 'Plan Profesional',
          description: plan === 'basico'
            ? 'Perfecto para campos pequeños - Hasta 10 usuarios'
            : 'Para operaciones más grandes - Hasta 30 usuarios',
          redirectUrl: CHECKOUT_CONFIG.successUrl,
          receiptButtonText: 'Ir al Panel',
          receiptThankYouNote: '¡Gracias por elegir Seedor! Recibirás un email con instrucciones para acceder.',
          enabledVariants: [variantId],
        },
        testMode: LEMON_CONFIG.testMode,
      }
    );

    if (!checkoutData || !checkoutData.data) {
      console.error('[create-checkout] Failed to create checkout:', checkoutData);
      return NextResponse.json(
        { success: false, error: 'Error al crear checkout en LemonSqueezy' },
        { status: 500 }
      );
    }

    const checkoutUrl = checkoutData.data.attributes.url;
    const checkoutId = checkoutData.data.id;

    console.log('[create-checkout] Checkout created:', {
      checkoutId,
      checkoutUrl: checkoutUrl.substring(0, 50) + '...',
    });

    // Store checkout in database
    const expiresAt = new Date(Date.now() + CHECKOUT_CONFIG.expiresInMs).toISOString();

    const { data: checkout, error: checkoutError } = await supabaseAdmin
      .from('lemon_squeezy_checkouts')
      .insert([
        {
          checkout_id: checkoutId,
          checkout_url: checkoutUrl,
          variant_id: variantId,
          plan_name: plan,
          tenant_name: tenantName,
          tenant_slug: slug,
          contact_name: contactName,
          contact_email: contactEmail.toLowerCase(),
          owner_phone: ownerPhone || null,
          expires_at: expiresAt,
          completed: false,
        },
      ])
      .select()
      .single();

    if (checkoutError) {
      console.error('[create-checkout] Error storing checkout:', checkoutError);
      // Don't fail the request - checkout was created successfully in LemonSqueezy
      // Just log the error
    }

    console.log('[create-checkout] Checkout stored in database:', checkout?.id);

    return NextResponse.json({
      success: true,
      checkoutUrl,
      checkoutId,
    });

  } catch (error: any) {
    console.error('[create-checkout] Error:', error);
    console.error('[create-checkout] Error stack:', error.stack);
    console.error('[create-checkout] Error details:', {
      message: error.message,
      name: error.name,
      cause: error.cause,
    });

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error inesperado al crear checkout',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
