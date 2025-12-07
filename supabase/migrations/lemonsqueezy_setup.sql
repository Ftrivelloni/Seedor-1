-- Add LemonSqueezy columns to tenants table
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS lemon_customer_id TEXT,
ADD COLUMN IF NOT EXISTS lemon_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active', -- active, past_due, cancelled, expired
ADD COLUMN IF NOT EXISTS subscription_renews_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ;

-- Add index for faster lookups by subscription ID
CREATE INDEX IF NOT EXISTS idx_tenants_lemon_subscription_id ON tenants(lemon_subscription_id);

-- Add index for faster lookups by customer ID
CREATE INDEX IF NOT EXISTS idx_tenants_lemon_customer_id ON tenants(lemon_customer_id);
