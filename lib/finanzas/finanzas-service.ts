import { apiClient } from '../auth/api-client';
import { isDemoModeClient } from '../demo/utils';
import {
  demoFinanzasGetMovimientos,
  demoFinanzasGetCategorias,
  demoFinanzasCreateCategoria,
  demoFinanzasCreateMovimiento,
} from '../demo/store';

// ==================== Types ====================

export interface MovimientoCaja {
  id: string;
  tenantId: string;
  fecha: string;
  tipo: 'ingreso' | 'egreso';
  monto: number;
  concepto: string;
  categoria: string;
  comprobante?: string;
}

export interface CashMovementRow {
  id: string;
  tenant_id: string;
  date: string;
  kind: 'ingreso' | 'egreso';
  amount: number;
  notes?: string;
  category_id?: string;
  receipt?: string;
  created_by?: string;
  created_at?: string;
  category_name?: string;
}

export interface FinanceCategory {
  id: string;
  tenant_id: string;
  name: string;
  kind: 'ingreso' | 'egreso';
  created_at?: string;
}

export interface FinanceKind {
  code: 'ingreso' | 'egreso';
  name: string;
}

export interface FinanceSummary {
  totalIngresos: number;
  totalEgresos: number;
  balance: number;
  movementsCount: number;
  ingresoCount: number;
  egresoCount: number;
  categorySummary: CategorySummaryItem[];
}

export interface CategorySummaryItem {
  categoryId: string;
  categoryName: string;
  kind: 'ingreso' | 'egreso';
  total: number;
  count: number;
}

export interface PeriodBalance {
  startDate: string;
  endDate: string;
  openingBalance: number;
  totalIngresos: number;
  totalEgresos: number;
  closingBalance: number;
  movements: CashMovementRow[];
}

export interface CreateMovementData {
  date: string;
  kind: 'ingreso' | 'egreso';
  amount: number;
  notes?: string;
  categoryId?: string;
  categoryName?: string;
  receipt?: string;
  createdBy?: string;
}

export interface UpdateMovementData {
  date?: string;
  kind?: 'ingreso' | 'egreso';
  amount?: number;
  notes?: string;
  categoryId?: string;
  receipt?: string;
}

export interface CreateCategoryData {
  name: string;
  kind: 'ingreso' | 'egreso';
}

export interface ListMovementsParams {
  tenantId: string;
  kind?: 'ingreso' | 'egreso';
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

// ==================== Helper Functions ====================

// Convierte de formato API (snake_case) a formato frontend (camelCase)
function mapMovementToFrontend(row: CashMovementRow): MovimientoCaja {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    fecha: row.date,
    tipo: row.kind,
    monto: row.amount,
    concepto: row.notes || '',
    categoria: row.category_name || '',
    comprobante: row.receipt,
  };
}

// ==================== MOVEMENTS API ====================

export const finanzasMovementsApiService = {
  async listMovements(params: ListMovementsParams): Promise<MovimientoCaja[]> {
    if (isDemoModeClient()) {
      return demoFinanzasGetMovimientos(params.tenantId);
    }

    const queryParams = new URLSearchParams();
    if (params.kind) queryParams.append('kind', params.kind);
    if (params.categoryId) queryParams.append('categoryId', params.categoryId);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());

    const queryString = queryParams.toString();
    const url = `/finanzas/movements/tenant/${params.tenantId}${queryString ? `?${queryString}` : ''}`;

    const response = await apiClient.get(url);
    return (response.data.movements || []).map(mapMovementToFrontend);
  },

  async getMovementById(id: string): Promise<MovimientoCaja | null> {
    if (isDemoModeClient()) {
      return null;
    }

    const response = await apiClient.get(`/finanzas/movements/${id}`);
    if (!response.data.movement) return null;
    return mapMovementToFrontend(response.data.movement);
  },

  async createMovement(
    tenantId: string,
    data: CreateMovementData,
  ): Promise<MovimientoCaja> {
    if (isDemoModeClient()) {
      return demoFinanzasCreateMovimiento(tenantId, {
        fecha: data.date,
        tipo: data.kind,
        monto: data.amount,
        concepto: data.notes || '',
        categoria: data.categoryName || '',
        comprobante: data.receipt,
      });
    }

    const response = await apiClient.post(
      `/finanzas/movements/tenant/${tenantId}`,
      data,
    );
    return mapMovementToFrontend(response.data.movement);
  },

  async updateMovement(
    id: string,
    data: UpdateMovementData,
  ): Promise<MovimientoCaja> {
    if (isDemoModeClient()) {
      throw new Error('Not implemented in demo mode');
    }

    const response = await apiClient.put(`/finanzas/movements/${id}`, data);
    return mapMovementToFrontend(response.data.movement);
  },

  async deleteMovement(id: string): Promise<void> {
    if (isDemoModeClient()) {
      return;
    }

    await apiClient.delete(`/finanzas/movements/${id}`);
  },
};

// ==================== CATEGORIES API ====================

export const finanzasCategoriesApiService = {
  async listCategories(
    tenantId: string,
    kind?: 'ingreso' | 'egreso',
  ): Promise<FinanceCategory[]> {
    if (isDemoModeClient()) {
      const categories = demoFinanzasGetCategorias(tenantId, kind);
      return categories;
    }

    const queryParams = kind ? `?kind=${kind}` : '';
    const response = await apiClient.get(
      `/finanzas/categories/tenant/${tenantId}${queryParams}`,
    );
    return response.data.categories || [];
  },

  async createCategory(
    tenantId: string,
    data: CreateCategoryData,
  ): Promise<FinanceCategory> {
    if (isDemoModeClient()) {
      return demoFinanzasCreateCategoria(tenantId, data.name, data.kind);
    }

    const response = await apiClient.post(
      `/finanzas/categories/tenant/${tenantId}`,
      data,
    );
    return response.data.category;
  },

  async updateCategory(
    id: string,
    data: { name: string },
  ): Promise<FinanceCategory> {
    if (isDemoModeClient()) {
      throw new Error('Not implemented in demo mode');
    }

    const response = await apiClient.put(`/finanzas/categories/${id}`, data);
    return response.data.category;
  },

  async deleteCategory(id: string): Promise<void> {
    if (isDemoModeClient()) {
      return;
    }

    await apiClient.delete(`/finanzas/categories/${id}`);
  },
};

// ==================== KINDS API ====================

export const finanzasKindsApiService = {
  async listKinds(): Promise<FinanceKind[]> {
    if (isDemoModeClient()) {
      return [
        { code: 'ingreso', name: 'Ingreso' },
        { code: 'egreso', name: 'Egreso' },
      ];
    }

    const response = await apiClient.get('/finanzas/kinds');
    return response.data.kinds || [
      { code: 'ingreso', name: 'Ingreso' },
      { code: 'egreso', name: 'Egreso' },
    ];
  },
};

// ==================== SUMMARY API ====================

export const finanzasSummaryApiService = {
  async getSummary(
    tenantId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<FinanceSummary> {
    if (isDemoModeClient()) {
      // Calcular summary desde los movimientos demo
      const movements = demoFinanzasGetMovimientos(tenantId);
      let totalIngresos = 0;
      let totalEgresos = 0;
      let ingresoCount = 0;
      let egresoCount = 0;

      movements.forEach((m) => {
        if (m.tipo === 'ingreso') {
          totalIngresos += m.monto;
          ingresoCount++;
        } else {
          totalEgresos += m.monto;
          egresoCount++;
        }
      });

      return {
        totalIngresos,
        totalEgresos,
        balance: totalIngresos - totalEgresos,
        movementsCount: movements.length,
        ingresoCount,
        egresoCount,
        categorySummary: [],
      };
    }

    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);

    const queryString = queryParams.toString();
    const url = `/finanzas/summary/tenant/${tenantId}${queryString ? `?${queryString}` : ''}`;

    const response = await apiClient.get(url);
    return response.data.summary;
  },

  async getPeriodBalance(
    tenantId: string,
    startDate: string,
    endDate: string,
    openingBalance?: number,
  ): Promise<PeriodBalance> {
    if (isDemoModeClient()) {
      throw new Error('Not implemented in demo mode');
    }

    const queryParams = new URLSearchParams();
    queryParams.append('startDate', startDate);
    queryParams.append('endDate', endDate);
    if (openingBalance !== undefined) {
      queryParams.append('openingBalance', openingBalance.toString());
    }

    const response = await apiClient.get(
      `/finanzas/balance/tenant/${tenantId}?${queryParams.toString()}`,
    );
    return response.data.balance;
  },
};

// Combined API object for easier import
export const finanzasApiService = {
  movements: finanzasMovementsApiService,
  categories: finanzasCategoriesApiService,
  kinds: finanzasKindsApiService,
  summary: finanzasSummaryApiService,
};
