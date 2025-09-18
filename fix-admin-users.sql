-- Fix existing admin users to have correct area_module value
-- Run this in your Supabase SQL Editor

-- Check current area_module values
SELECT id, full_name, email, area_module, status 
FROM workers 
WHERE area_module ILIKE '%admin%' OR area_module ILIKE '%administr%';

-- Update existing admin users to use the correct format
UPDATE workers 
SET area_module = 'administracion' 
WHERE area_module IN ('Administración', 'Admin', 'admin', 'administración');

-- Verify the update
SELECT id, full_name, email, area_module, status 
FROM workers 
WHERE area_module = 'administracion';