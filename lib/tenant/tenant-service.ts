import { apiClient, tokenStorage } from '../auth/api-client';
import {
  Tenant,
  TenantMembership,
  TenantModule,
  TenantLimits,
  CreateTenantDto,
  CreateTenantWithAdminDto,
  UpdateTenantDto,
  EnableModuleDto,
  ModuleCode,
} from './types';

class TenantService {
  // ==================== GET OPERATIONS ====================

  async getTenantById(tenantId: string): Promise<Tenant | null> {
    const response = await apiClient.get<{ tenant: Tenant | null }>(
      `/tenant/${tenantId}`,
    );
    return response.data.tenant;
  }

  async getTenantBySlug(slug: string): Promise<Tenant | null> {
    const response = await apiClient.get<{ tenant: Tenant | null }>(
      `/tenant/by-slug/${slug}`,
    );
    return response.data.tenant;
  }

  async getUserTenants(): Promise<Tenant[]> {
    const response = await apiClient.get<{ tenants: Tenant[] }>(
      '/tenant/user-tenants',
    );
    return response.data.tenants;
  }

  async getUserMembership(tenantId: string): Promise<TenantMembership | null> {
    const response = await apiClient.get<{ membership: TenantMembership | null }>(
      `/tenant/${tenantId}/membership`,
    );
    return response.data.membership;
  }

  async isSlugAvailable(slug: string): Promise<boolean> {
    const response = await apiClient.get<{ available: boolean }>(
      `/tenant/check-slug?slug=${encodeURIComponent(slug)}`,
    );
    return response.data.available;
  }

  // ==================== CREATE OPERATIONS ====================

  async createTenant(
    dto: CreateTenantDto,
  ): Promise<{ tenant: Tenant; membership: TenantMembership }> {
    const response = await apiClient.post<{
      tenant: Tenant;
      membership: TenantMembership;
    }>('/tenant/create', dto);
    return response.data;
  }

  async createTenantWithAdmin(
    dto: CreateTenantWithAdminDto,
  ): Promise<{ tenant: Tenant; membership: TenantMembership; userId: string }> {
    const response = await apiClient.post<{
      tenant: Tenant;
      membership: TenantMembership;
      userId: string;
    }>('/tenant/create-with-admin', dto);
    return response.data;
  }

  // ==================== UPDATE OPERATIONS ====================

  async updateTenant(tenantId: string, dto: UpdateTenantDto): Promise<Tenant> {
    const response = await apiClient.put<{ tenant: Tenant }>(
      `/tenant/${tenantId}`,
      dto,
    );
    return response.data.tenant;
  }

  async setDefaultTenant(tenantId: string): Promise<void> {
    await apiClient.post('/tenant/set-default', { tenantId });
  }

  async clearDefaultTenant(): Promise<void> {
    await apiClient.post('/tenant/clear-default');
  }

  // ==================== MODULES ====================

  async getTenantModules(tenantId: string): Promise<TenantModule[]> {
    const response = await apiClient.get<{ modules: TenantModule[] }>(
      `/tenant/${tenantId}/modules`,
    );
    return response.data.modules;
  }

  async enableModule(
    tenantId: string,
    moduleCode: ModuleCode,
    enabled: boolean,
  ): Promise<void> {
    await apiClient.post(`/tenant/${tenantId}/modules`, {
      moduleCode,
      enabled,
    });
  }

  async enableMultipleModules(
    tenantId: string,
    moduleCodes: ModuleCode[],
  ): Promise<void> {
    await apiClient.post(`/tenant/${tenantId}/modules/bulk`, {
      moduleCodes,
    });
  }

  // ==================== LIMITS ====================

  async getTenantLimits(tenantId: string): Promise<TenantLimits> {
    const response = await apiClient.get<TenantLimits>(
      `/tenant/${tenantId}/limits`,
    );
    return response.data;
  }

  async canAddUser(tenantId: string): Promise<boolean> {
    const response = await apiClient.get<{ canAdd: boolean }>(
      `/tenant/${tenantId}/can-add-user`,
    );
    return response.data.canAdd;
  }

  async canAddField(tenantId: string): Promise<boolean> {
    const response = await apiClient.get<{ canAdd: boolean }>(
      `/tenant/${tenantId}/can-add-field`,
    );
    return response.data.canAdd;
  }

  // ==================== LEGACY FORMAT METHODS ====================
  // For backwards compatibility with existing components

  async getUserTenantsLegacy(
    userId: string,
  ): Promise<{ success: boolean; data?: Tenant[]; error?: string }> {
    try {
      const tenants = await this.getUserTenants();
      return { success: true, data: tenants };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al obtener tenants';
      return { success: false, error: message };
    }
  }

  async getTenantBySlugLegacy(
    slug: string,
  ): Promise<{ success: boolean; data?: Tenant | null; error?: string }> {
    try {
      const tenant = await this.getTenantBySlug(slug);
      return { success: true, data: tenant };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al obtener tenant';
      return { success: false, error: message };
    }
  }

  async getTenantModulesLegacy(
    tenantId: string,
  ): Promise<{ success: boolean; data?: TenantModule[]; error?: string }> {
    try {
      const modules = await this.getTenantModules(tenantId);
      return { success: true, data: modules };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al obtener módulos';
      return { success: false, error: message };
    }
  }

  async isSlugAvailableLegacy(
    slug: string,
  ): Promise<{ success: boolean; data?: boolean; error?: string }> {
    try {
      const available = await this.isSlugAvailable(slug);
      return { success: true, data: available };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al verificar slug';
      return { success: false, error: message };
    }
  }

  async getUserMembershipLegacy(
    tenantId: string,
  ): Promise<{ success: boolean; data?: TenantMembership | null; error?: string }> {
    try {
      const membership = await this.getUserMembership(tenantId);
      return { success: true, data: membership };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al obtener membresía';
      return { success: false, error: message };
    }
  }

  async getTenantLimitsLegacy(
    tenantId: string,
  ): Promise<{ success: boolean; data?: TenantLimits; error?: string }> {
    try {
      const limits = await this.getTenantLimits(tenantId);
      return { success: true, data: limits };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al obtener límites';
      return { success: false, error: message };
    }
  }
}

export const tenantService = new TenantService();
