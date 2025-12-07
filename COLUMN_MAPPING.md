# LemonSqueezy Column Mapping

This document maps the new column names to your existing database schema.

## Tenant Table Column Mapping

| Implementation Plan Name | Your Existing Column | Status |
|-------------------------|---------------------|---------|
| `ls_customer_id` | `lemon_customer_id` | ✅ Using yours (new) |
| `ls_subscription_id` | `lemon_subscription_id` | ✅ Using yours (new) |
| `ls_variant_id` | `lemon_variant_id` | ✅ **Already exists** |
| `ls_order_id` | `lemon_order_id` | ✅ **Already exists** |
| `ls_checkout_id` | `lemon_checkout_id` | ✅ **Already exists** |
| `subscription_status` | `payment_status` | ✅ **Already exists** |
| `subscription_starts_at` | `payment_collected_at` | ✅ **Already exists** |
| `subscription_renews_at` | `subscription_renews_at` | ✅ Using plan name (new) |
| `subscription_ends_at` | `subscription_ends_at` | ✅ Using plan name (new) |
| `payment_failed_at` | `payment_failed_at` | ✅ Using plan name (new) |
| `last_webhook_at` | `last_webhook_at` | ✅ Using plan name (new) |
| N/A | `trial_ends_at` | ✅ **Already exists** |
| N/A | `billing_status` | ⚠️ Deprecated (use payment_status) |
| N/A | `payment_provider` | ✅ **Already exists** (set to 'lemonsqueezy') |
| N/A | `payment_reference` | ✅ **Already exists** (optional) |

## Code Updates Required

All code must be updated to use your column names:

### Example
**Before (implementation plan):**
```typescript
tenant.ls_customer_id
tenant.ls_subscription_id
tenant.ls_variant_id
tenant.subscription_status
```

**After (your schema):**
```typescript
tenant.lemon_customer_id
tenant.lemon_subscription_id
tenant.lemon_variant_id
tenant.payment_status
```

## Files That Need Updates
- [x] `/migrations/001_add_lemonsqueezy_fields.sql` - DONE
- [ ] `/lib/types.ts` - Update Tenant interface
- [ ] `/lib/features-context.tsx` - Update subscription_status → payment_status
- [ ] `/app/api/payments/lemon/webhook/route.ts` - Update all column references
- [ ] `/app/api/payments/lemon/subscription/route.ts` - Update all column references
- [ ] `/app/api/payments/lemon/subscription/update/route.ts` - Update all column references
- [ ] `/app/api/payments/lemon/subscription/cancel/route.ts` - Update all column references
- [ ] `/app/api/payments/lemon/portal/route.ts` - Update all column references
