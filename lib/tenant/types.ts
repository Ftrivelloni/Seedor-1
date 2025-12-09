export type RoleCode = 'owner' | 'admin' | 'campo' | 'empaque' | 'finanzas';
export type MembershipStatus = 'active' | 'pending' | 'inactive';

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

export interface TenantModule {
  id: string;
  tenant_id: string;
  module_code: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface TenantLimits {
  users: { max: number; current: number; available: number };
  fields: { max: number; current: number; available: number };
  plan: string;
}

// DTOs
export interface CreateTenantDto {
  name: string;
  slug: string;
  plan: string;
  contactName: string;
  contactEmail: string;
  primaryCrop?: string;
}

export interface CreateTenantWithAdminDto extends CreateTenantDto {
  adminEmail: string;
  adminPassword: string;
  adminFullName: string;
  adminPhone?: string;
}

export interface UpdateTenantDto {
  name?: string;
  plan?: string;
  contactName?: string;
  contactEmail?: string;
  maxUsers?: number;
  maxFields?: number;
}

export interface EnableModuleDto {
  moduleCode: string;
  enabled: boolean;
}

export type ModuleCode =
  | 'dashboard'
  | 'campo'
  | 'empaque'
  | 'finanzas'
  | 'inventario'
  | 'usuarios'
  | 'trabajadores'
  | 'ajustes';
