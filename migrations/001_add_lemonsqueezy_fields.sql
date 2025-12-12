-- Migration: Add LemonSqueezy Integration Fields
-- Description: Adds all necessary fields and tables for LemonSqueezy payment integration
-- Date: 2025-01-06
-- NOTE: This migration accounts for existing columns (lemon_variant_id, lemon_order_id, lemon_checkout_id, payment_status, etc.)

-- =====================================================
-- 1. Add missing LemonSqueezy columns to tenants table
-- =====================================================
-- You already have: lemon_variant_id, lemon_order_id, lemon_checkout_id, payment_status,
--                   payment_provider, payment_reference, trial_ends_at, payment_collected_at

-- Add only the columns that don't exist yet
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS lemon_customer_id TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS lemon_subscription_id TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_renews_at TIMESTAMPTZ;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS payment_failed_at TIMESTAMPTZ;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS last_webhook_at TIMESTAMPTZ;

-- Update payment_status column to ensure it has valid values
-- Your existing payment_status will be used as the subscription status
ALTER TABLE tenants DROP CONSTRAINT IF EXISTS tenants_payment_status_check;
ALTER TABLE tenants ADD CONSTRAINT tenants_payment_status_check
  CHECK (payment_status IN ('pending', 'active', 'past_due', 'cancelled', 'expired', 'legacy'));

-- Set default payment_status if NULL
UPDATE tenants
SET payment_status = 'pending'
WHERE payment_status IS NULL OR payment_status = '';

-- Update payment_provider for existing LemonSqueezy records
UPDATE tenants
SET payment_provider = 'lemonsqueezy'
WHERE lemon_variant_id IS NOT NULL
  AND (payment_provider IS NULL OR payment_provider = '');

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_tenants_lemon_customer_id ON tenants(lemon_customer_id);
CREATE INDEX IF NOT EXISTS idx_tenants_lemon_subscription_id ON tenants(lemon_subscription_id);
CREATE INDEX IF NOT EXISTS idx_tenants_payment_status ON tenants(payment_status);
CREATE INDEX IF NOT EXISTS idx_tenants_lemon_checkout_id ON tenants(lemon_checkout_id);
CREATE INDEX IF NOT EXISTS idx_tenants_lemon_variant_id ON tenants(lemon_variant_id);

-- =====================================================
-- 2. Create lemon_squeezy_webhook_events table
-- =====================================================
CREATE TABLE IF NOT EXISTS lemon_squeezy_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  error TEXT,
  retry_count INTEGER DEFAULT 0,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for webhook events
CREATE INDEX IF NOT EXISTS idx_lsw_event_id ON lemon_squeezy_webhook_events(event_id);
CREATE INDEX IF NOT EXISTS idx_lsw_event_type ON lemon_squeezy_webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_lsw_processed ON lemon_squeezy_webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_lsw_tenant_id ON lemon_squeezy_webhook_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lsw_created_at ON lemon_squeezy_webhook_events(created_at DESC);

-- Add comment
COMMENT ON TABLE lemon_squeezy_webhook_events IS 'Stores all LemonSqueezy webhook events for audit and debugging';

-- =====================================================
-- 3. Create lemon_squeezy_checkouts table
-- =====================================================
CREATE TABLE IF NOT EXISTS lemon_squeezy_checkouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checkout_id TEXT UNIQUE NOT NULL,
  checkout_url TEXT NOT NULL,
  variant_id TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  tenant_name TEXT NOT NULL,
  tenant_slug TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  owner_phone TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for checkouts
CREATE INDEX IF NOT EXISTS idx_lsc_checkout_id ON lemon_squeezy_checkouts(checkout_id);
CREATE INDEX IF NOT EXISTS idx_lsc_contact_email ON lemon_squeezy_checkouts(contact_email);
CREATE INDEX IF NOT EXISTS idx_lsc_completed ON lemon_squeezy_checkouts(completed);
CREATE INDEX IF NOT EXISTS idx_lsc_expires_at ON lemon_squeezy_checkouts(expires_at);

-- Add comment
COMMENT ON TABLE lemon_squeezy_checkouts IS 'Tracks pending LemonSqueezy checkouts for matching with webhook events';

-- =====================================================
-- 4. Update subscription_history table (if exists)
-- =====================================================
-- Add LemonSqueezy tracking fields if table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'subscription_history') THEN
        ALTER TABLE subscription_history ADD COLUMN IF NOT EXISTS lemon_subscription_id TEXT;
        ALTER TABLE subscription_history ADD COLUMN IF NOT EXISTS lemon_order_id TEXT;
    END IF;
END $$;

-- =====================================================
-- 5. Migrate existing tenants to 'legacy' status
-- =====================================================
-- All existing tenants should be marked as 'legacy' so they continue working without payment
-- Using your existing payment_status column
UPDATE tenants
SET payment_status = 'legacy'
WHERE payment_status = 'pending'
  AND lemon_variant_id IS NULL;  -- Only mark as legacy if they don't have LemonSqueezy data

-- =====================================================
-- 6. Add comments for documentation
-- =====================================================
COMMENT ON COLUMN tenants.payment_status IS 'Subscription status: pending, active, past_due, cancelled, expired, legacy';
COMMENT ON COLUMN tenants.lemon_customer_id IS 'LemonSqueezy customer ID';
COMMENT ON COLUMN tenants.lemon_subscription_id IS 'LemonSqueezy subscription ID';
COMMENT ON COLUMN tenants.lemon_variant_id IS 'LemonSqueezy product variant ID (existing)';
COMMENT ON COLUMN tenants.lemon_order_id IS 'LemonSqueezy initial order ID (existing)';
COMMENT ON COLUMN tenants.lemon_checkout_id IS 'LemonSqueezy checkout ID (existing)';
COMMENT ON COLUMN tenants.payment_provider IS 'Payment provider (e.g., lemonsqueezy)';
COMMENT ON COLUMN tenants.payment_reference IS 'Payment reference number';
COMMENT ON COLUMN tenants.payment_collected_at IS 'When payment was first collected (subscription start)';
COMMENT ON COLUMN tenants.subscription_renews_at IS 'Next renewal date';
COMMENT ON COLUMN tenants.subscription_ends_at IS 'Subscription end date (for cancelled)';
COMMENT ON COLUMN tenants.payment_failed_at IS 'Last payment failure timestamp';
COMMENT ON COLUMN tenants.last_webhook_at IS 'Last webhook received timestamp';
COMMENT ON COLUMN tenants.trial_ends_at IS 'Free trial end date (existing)';
COMMENT ON COLUMN tenants.billing_status IS 'Billing status (deprecated - use payment_status)';

-- =====================================================
-- ROLLBACK SCRIPT (for emergency use only)
-- =====================================================
-- To rollback this migration, run the following:
--
-- DROP TABLE IF EXISTS lemon_squeezy_webhook_events CASCADE;
-- DROP TABLE IF EXISTS lemon_squeezy_checkouts CASCADE;
-- ALTER TABLE tenants DROP COLUMN IF EXISTS lemon_customer_id;
-- ALTER TABLE tenants DROP COLUMN IF EXISTS lemon_subscription_id;
-- ALTER TABLE tenants DROP COLUMN IF EXISTS subscription_renews_at;
-- ALTER TABLE tenants DROP COLUMN IF EXISTS subscription_ends_at;
-- ALTER TABLE tenants DROP COLUMN IF EXISTS payment_failed_at;
-- ALTER TABLE tenants DROP COLUMN IF EXISTS last_webhook_at;
-- ALTER TABLE tenants DROP CONSTRAINT IF EXISTS tenants_payment_status_check;
--
-- NOTE: Do NOT drop lemon_variant_id, lemon_order_id, lemon_checkout_id, payment_status,
-- payment_provider, payment_reference, trial_ends_at, or payment_collected_at as these existed before this migration
