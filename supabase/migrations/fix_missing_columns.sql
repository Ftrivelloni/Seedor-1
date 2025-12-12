-- Add missing primary_crop column to tenants table
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS primary_crop TEXT DEFAULT 'general';
