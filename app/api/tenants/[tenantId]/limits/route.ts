// Re-export the handler implemented in the singular path so Next's route validator
// (which may reference the pluralized path) finds a module here.
export { GET } from '../../../tenant/[tenantId]/limits/route'
