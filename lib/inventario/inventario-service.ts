import { apiClient } from '../auth/api-client';
import { isDemoModeClient } from '../demo/utils';
import {
  demoInventoryListItems,
  demoInventoryGetItemById,
  demoInventoryCreateItem,
  demoInventoryUpdateItem,
  demoInventoryDeleteItem,
  demoInventoryListCategories,
  demoInventoryCreateCategory,
  demoInventoryDeleteCategory,
  demoInventoryListLocations,
  demoInventoryCreateLocation,
  demoInventoryDeleteLocation,
  demoInventoryListMovements,
  demoInventoryCreateMovement,
  demoInventoryDeleteMovement,
  demoInventoryMovementTypes,
  demoInventorySummary,
} from '../demo/store';

// ==================== Types ====================

export interface InventoryItem {
  id: string;
  tenant_id: string;
  name: string;
  category_id: string;
  location_id: string;
  unit: string;
  min_stock: number;
  current_stock: number;
  created_at?: string;
  category_name?: string;
  location_name?: string;
}

export interface InventoryCategory {
  id: string;
  tenant_id: string;
  name: string;
}

export interface InventoryLocation {
  id: string;
  tenant_id: string;
  name: string;
}

export type MovementTypeCode = 'IN' | 'OUT';

export interface InventoryMovementType {
  code: MovementTypeCode;
  name: string;
}

export interface InventoryMovement {
  id: string;
  tenant_id: string;
  item_id: string;
  date: string;
  type: MovementTypeCode;
  quantity: number;
  unit_cost: number | null;
  reason: string;
  ref_module: string | null;
  ref_id: string | null;
  created_by: string | null;
  created_at: string;
  item_name?: string;
}

export interface InventorySummary {
  totalItems: number;
  lowStockItems: number;
  lastMovementDate?: string;
}

// ==================== Create DTOs ====================

export interface CreateItemData {
  name: string;
  categoryId: string;
  locationId: string;
  unit: string;
  minStock: number;
  currentStock?: number;
}

export interface UpdateItemData {
  name?: string;
  categoryId?: string;
  locationId?: string;
  unit?: string;
  minStock?: number;
}

export interface CreateMovementData {
  itemId: string;
  date: string;
  type: MovementTypeCode;
  quantity: number;
  unitCost?: number;
  reason: string;
  refModule?: string;
  refId?: string;
  createdBy?: string;
}

export interface ListItemsParams {
  tenantId: string;
  search?: string;
  categoryId?: string;
  locationId?: string;
  limit?: number;
  offset?: number;
}

export interface ListMovementsParams {
  tenantId: string;
  itemId?: string;
  limit?: number;
  offset?: number;
}

// ==================== ITEMS API ====================

export const inventoryItemsApiService = {
  async listItems(params: ListItemsParams): Promise<InventoryItem[]> {
    if (isDemoModeClient()) {
      return demoInventoryListItems(params);
    }

    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append('search', params.search);
    if (params.categoryId) queryParams.append('categoryId', params.categoryId);
    if (params.locationId) queryParams.append('locationId', params.locationId);
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());

    const queryString = queryParams.toString();
    const url = `/inventario/items/tenant/${params.tenantId}${queryString ? `?${queryString}` : ''}`;

    const response = await apiClient.get(url);
    return response.data.items;
  },

  async getItemById(id: string): Promise<InventoryItem | null> {
    if (isDemoModeClient()) {
      return null;
    }

    const response = await apiClient.get(`/inventario/items/${id}`);
    return response.data.item;
  },

  async createItem(
    tenantId: string,
    data: CreateItemData,
  ): Promise<InventoryItem> {
    if (isDemoModeClient()) {
      return demoInventoryCreateItem(tenantId, {
        name: data.name,
        category_id: data.categoryId,
        location_id: data.locationId,
        unit: data.unit,
        min_stock: data.minStock,
        current_stock: data.currentStock,
      });
    }

    const response = await apiClient.post(
      `/inventario/items/tenant/${tenantId}`,
      data,
    );
    return response.data.item;
  },

  async updateItem(id: string, data: UpdateItemData): Promise<InventoryItem> {
    if (isDemoModeClient()) {
      throw new Error('Not implemented in demo mode');
    }

    const response = await apiClient.put(`/inventario/items/${id}`, data);
    return response.data.item;
  },

  async deleteItem(id: string): Promise<void> {
    if (isDemoModeClient()) {
      return;
    }

    await apiClient.delete(`/inventario/items/${id}`);
  },
};

// ==================== CATEGORIES API ====================

export const inventoryCategoriesApiService = {
  async listCategories(tenantId: string): Promise<InventoryCategory[]> {
    if (isDemoModeClient()) {
      return demoInventoryListCategories(tenantId);
    }

    const response = await apiClient.get(
      `/inventario/categories/tenant/${tenantId}`,
    );
    return response.data.categories;
  },

  async createCategory(
    tenantId: string,
    data: { name: string },
  ): Promise<InventoryCategory> {
    if (isDemoModeClient()) {
      return demoInventoryCreateCategory(tenantId, data.name);
    }

    const response = await apiClient.post(
      `/inventario/categories/tenant/${tenantId}`,
      data,
    );
    return response.data.category;
  },

  async deleteCategory(id: string): Promise<void> {
    if (isDemoModeClient()) {
      return;
    }

    await apiClient.delete(`/inventario/categories/${id}`);
  },
};

// ==================== LOCATIONS API ====================

export const inventoryLocationsApiService = {
  async listLocations(tenantId: string): Promise<InventoryLocation[]> {
    if (isDemoModeClient()) {
      return demoInventoryListLocations(tenantId);
    }

    const response = await apiClient.get(
      `/inventario/locations/tenant/${tenantId}`,
    );
    return response.data.locations;
  },

  async createLocation(
    tenantId: string,
    data: { name: string },
  ): Promise<InventoryLocation> {
    if (isDemoModeClient()) {
      return demoInventoryCreateLocation(tenantId, data.name);
    }

    const response = await apiClient.post(
      `/inventario/locations/tenant/${tenantId}`,
      data,
    );
    return response.data.location;
  },

  async deleteLocation(id: string): Promise<void> {
    if (isDemoModeClient()) {
      return;
    }

    await apiClient.delete(`/inventario/locations/${id}`);
  },
};

// ==================== MOVEMENTS API ====================

export const inventoryMovementsApiService = {
  async listMovementTypes(): Promise<InventoryMovementType[]> {
    if (isDemoModeClient()) {
      return [
        { code: 'IN', name: 'Entrada' },
        { code: 'OUT', name: 'Salida' },
      ];
    }

    const response = await apiClient.get('/inventario/movement-types');
    return response.data.types;
  },

  async listMovements(params: ListMovementsParams): Promise<InventoryMovement[]> {
    if (isDemoModeClient()) {
      return demoInventoryListMovements(params);
    }

    const queryParams = new URLSearchParams();
    if (params.itemId) queryParams.append('itemId', params.itemId);
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());

    const queryString = queryParams.toString();
    const url = `/inventario/movements/tenant/${params.tenantId}${queryString ? `?${queryString}` : ''}`;

    const response = await apiClient.get(url);
    return response.data.movements;
  },

  async createMovement(
    tenantId: string,
    data: CreateMovementData,
  ): Promise<InventoryMovement> {
    if (isDemoModeClient()) {
      return demoInventoryCreateMovement(tenantId, {
        item_id: data.itemId,
        type: data.type,
        quantity: data.quantity,
        unit_cost: data.unitCost,
        reason: data.reason,
        date: data.date,
        created_by: data.createdBy,
      });
    }

    const response = await apiClient.post(
      `/inventario/movements/tenant/${tenantId}`,
      data,
    );
    return response.data.movement;
  },

  async deleteMovement(movementId: string): Promise<void> {
    if (isDemoModeClient()) {
      return;
    }

    await apiClient.delete(`/inventario/movements/${movementId}`);
  },
};

// ==================== SUMMARY API ====================

export const inventorySummaryApiService = {
  async getSummary(tenantId: string): Promise<InventorySummary> {
    if (isDemoModeClient()) {
      return demoInventorySummary(tenantId);
    }

    const response = await apiClient.get(
      `/inventario/summary/tenant/${tenantId}`,
    );
    return response.data.summary;
  },
};

// Combined API object for easier import
export const inventoryApiService = {
  items: inventoryItemsApiService,
  categories: inventoryCategoriesApiService,
  locations: inventoryLocationsApiService,
  movements: inventoryMovementsApiService,
  summary: inventorySummaryApiService,
};
