// Role codes
export type RoleCode = 'owner' | 'admin' | 'campo' | 'empaque' | 'finanzas';

// Membership status
export type MembershipStatus = 'active' | 'pending' | 'inactive';

// Tenant
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  contact_name: string;
  contact_email: string;
  created_by: string;
  max_users: number;
  max_fields: number;
  current_users: number;
  current_fields: number;
  created_at: string;
  updated_at: string;
}

// Profile
export interface Profile {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  default_tenant_id: string | null;
  created_at: string;
  updated_at: string;
}

// Tenant Membership
export interface TenantMembership {
  id: string;
  tenant_id: string;
  user_id: string;
  role_code: RoleCode;
  status: MembershipStatus;
  invited_by: string | null;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
  tenants?: Tenant;
}

// Invitation
export interface Invitation {
  id: string;
  tenant_id: string;
  email: string;
  role_code: RoleCode;
  token_hash: string;
  invited_by: string;
  expires_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
  created_at: string;
  tenants?: { name: string };
}

// Auth User (current user with all info)
export interface AuthUser {
  id: string;
  email: string;
  nombre?: string;
  tenantId: string | null;
  rol: RoleCode | null;
  tenant?: Tenant | null;
  profile?: Profile | null;
  memberships?: TenantMembership[];
  isDemo?: boolean;
  worker?: {
    id: string;
    fullName: string;
    email: string;
    role: RoleCode | null;
    tenantId: string | null;
  };
}

// Tenant Limits
export interface TenantLimits {
  users: {
    max: number;
    current: number;
    available: number;
  };
  fields: {
    max: number;
    current: number;
    available: number;
  };
  plan: string;
}

// ==================== DTOs ====================

// Login
export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
}

// Send OTP
export interface SendOtpDto {
  email: string;
}

// Verify OTP
export interface VerifyOtpDto {
  email: string;
  code: string;
}

export interface VerifyOtpResponse {
  accessToken: string;
  userId: string;
}

// Register Tenant
export interface RegisterTenantDto {
  tenantName: string;
  slug: string;
  plan: string;
  contactName: string;
  contactEmail: string;
  ownerPhone?: string;
}

export interface RegisterTenantResponse {
  tenant: Tenant;
  membership: TenantMembership;
}

// Invite User
export interface InviteUserDto {
  tenantId: string;
  email: string;
  roleCode: RoleCode;
}

export interface InviteUserResponse {
  invitation: Invitation;
  inviteUrl: string;
  message: string;
}

// Accept Invitation
export interface AcceptInvitationDto {
  token: string;
  accessToken: string;
  password?: string;
  fullName?: string;
  phone?: string;
}

export interface AcceptInvitationResponse {
  membership: TenantMembership;
  tenantId: string;
  message: string;
}

// Session User (stored in session)
export interface SessionUser {
  id: string;
  email: string;
  tenantId: string | null;
  rol: RoleCode | null;
  nombre?: string;
  tenant?: Tenant | null;
  profile?: Profile | null;
  memberships?: TenantMembership[];
  isDemo?: boolean;
}

// Current User (extended for components)
export interface CurrentUser extends SessionUser {
  worker?: {
    id: string;
    fullName: string;
    email: string;
    role: RoleCode | null;
    tenantId: string | null;
  };
}
