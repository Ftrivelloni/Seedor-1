export const DEMO_SESSION_COOKIE = "seedor_session";
export const DEMO_FLAG_COOKIE = "seedor_demo";
export const DEMO_SESSION_PREFIX = "demo-";

export const DEMO_TENANT = {
  id: "demo-tenant",
  name: "Campo Demo",
  slug: "campo-demo",
  plan: "enterprise",
  primary_crop: "Frutas variadas",
  contact_email: "demo@seedor.com",
  created_by: "demo-admin",
  created_at: "2024-01-01T00:00:00.000Z",
};

export const DEMO_MEMBERSHIP = {
  id: "demo-membership",
  tenant_id: DEMO_TENANT.id,
  user_id: "demo-admin",
  role_code: "admin",
  status: "active",
  invited_by: null,
  accepted_at: "2024-01-01T00:00:00.000Z",
};

export const DEMO_USER = {
  id: "demo-admin",
  email: "demo@seedor.com",
  nombre: "Administrador Demo",
  rol: "admin",
  tenantId: DEMO_TENANT.id,
  tenant: {
    id: DEMO_TENANT.id,
    name: DEMO_TENANT.name,
    slug: DEMO_TENANT.slug,
    plan: DEMO_TENANT.plan,
  },
  profile: {
    full_name: "Administrador Demo",
    avatar_url: null,
  },
  memberships: [
    {
      ...DEMO_MEMBERSHIP,
    },
  ],
  isDemo: true,
};

export function isDemoSessionToken(token: string | undefined | null): boolean {
  return Boolean(token && token.startsWith(DEMO_SESSION_PREFIX));
}
