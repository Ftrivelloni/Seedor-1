import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
    verifyWebhookSignature,
    parseWebhookPayload,
    extractSubscriptionId,
    isEventProcessed,
    storeWebhookEvent,
    markEventProcessed,
    markEventFailed,
    WEBHOOK_EVENTS,
    type WebhookPayload,
} from '@/lib/lemonsqueezy-webhook';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

export async function POST(request: NextRequest) {
    try {
        const rawBody = await request.text();
        const signature = request.headers.get('x-signature') || '';

        if (!verifyWebhookSignature(rawBody, signature)) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        const payload = parseWebhookPayload(rawBody);
        const eventType = payload.meta.event_name;
        const eventId = `${eventType}_${payload.data.id}`;

        if (await isEventProcessed(eventId, supabaseAdmin)) {
            return NextResponse.json({ received: true, processed: false, reason: 'already_processed' });
        }

        await storeWebhookEvent(eventId, eventType, payload, supabaseAdmin);

        let result;
        try {
            switch (eventType) {
                case WEBHOOK_EVENTS.SUBSCRIPTION_CREATED:
                case WEBHOOK_EVENTS.SUBSCRIPTION_UPDATED:
                case WEBHOOK_EVENTS.SUBSCRIPTION_CANCELLED:
                case WEBHOOK_EVENTS.SUBSCRIPTION_EXPIRED:
                case WEBHOOK_EVENTS.SUBSCRIPTION_RESUMED:
                    result = await handleSubscriptionEvent(payload, eventType, supabaseAdmin);
                    break;
                default:
                    result = { processed: false, reason: 'unhandled_event_type' };
            }

            if (result.processed) {
                await markEventProcessed(eventId, supabaseAdmin, result.tenantId);
            }

            return NextResponse.json({ received: true, ...result });

        } catch (error: any) {
            console.error(`[webhook] Error processing ${eventType}:`, error);
            await markEventFailed(eventId, supabaseAdmin, error.message, 0);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

    } catch (error: any) {
        console.error('[webhook] Fatal error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

async function handleSubscriptionEvent(payload: WebhookPayload, eventType: string, supabase: any) {
    const subscriptionId = extractSubscriptionId(payload);
    const customerId = payload.data.attributes.customer_id;
    const status = payload.data.attributes.status;
    const renewsAt = payload.data.attributes.renews_at;
    const endsAt = payload.data.attributes.ends_at;

    // Custom data passed during checkout
    const customData = payload.meta.custom_data || {};
    const tenantId = customData.tenant_id;

    if (!tenantId && eventType === WEBHOOK_EVENTS.SUBSCRIPTION_CREATED) {
        // Try to find by subscription ID if not in custom data (shouldn't happen with new flow)
        // Or log error
        throw new Error('No tenant_id in custom_data for new subscription');
    }

    let query = supabase.from('tenants');

    if (tenantId) {
        query = query.update({
            lemon_subscription_id: subscriptionId,
            lemon_customer_id: customerId?.toString(),
            subscription_status: status,
            subscription_renews_at: renewsAt,
            subscription_ends_at: endsAt,
            last_webhook_at: new Date().toISOString(),
        }).eq('id', tenantId);
    } else {
        // For updates, find by subscription ID
        query = query.update({
            subscription_status: status,
            subscription_renews_at: renewsAt,
            subscription_ends_at: endsAt,
            last_webhook_at: new Date().toISOString(),
        }).eq('lemon_subscription_id', subscriptionId);
    }

    const { data, error } = await query.select().single();

    if (error) {
        throw new Error(`Failed to update tenant: ${error.message}`);
    }

    return { processed: true, tenantId: data.id };
}
