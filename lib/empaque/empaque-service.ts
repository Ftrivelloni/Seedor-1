import { apiClient } from '../auth/api-client';
import { isDemoModeClient } from '../demo/utils';
import {
  demoEmpaqueIngresos,
  demoEmpaqueCreateIngreso,
  demoEmpaquePreprocesos,
  demoEmpaqueCreatePreproceso,
  demoEmpaquePallets,
  demoEmpaqueCreatePallet,
  demoEmpaqueDespachos,
  demoEmpaqueCreateDespacho,
  demoEmpaqueEgresos,
  demoEmpaqueCreateEgreso,
} from '../demo/store';

// ==================== Tipos ====================

export interface IngresoFrutaRow {
  id: string;
  tenant_id: string;
  fecha: string;
  estado_liquidacion: boolean;
  num_ticket: number | null;
  num_remito: number | null;
  productor: string;
  finca: string | null;
  producto: string;
  lote: number | null;
  contratista: string | null;
  tipo_cosecha: string | null;
  cant_bin: number;
  tipo_bin: string;
  peso_neto: number;
  transporte: string | null;
  chofer: string | null;
  chasis: string | null;
  acoplado: string | null;
  operario: string | null;
  created_at?: string;
}

export interface PreprocesoRow {
  id: string;
  tenant_id: string;
  semana: number;
  fecha: string;
  duracion: number;
  bin_volcados: number;
  ritmo_maquina: number;
  duracion_proceso: number;
  bin_pleno: number;
  bin_intermedio_I: number;
  bin_intermedio_II: number;
  bin_incipiente: number;
  cant_personal: number;
  created_at?: string;
}

export interface PalletRow {
  id: string;
  tenant_id: string;
  semana: number | null;
  fecha: string | null;
  num_pallet: string | null;
  producto: string | null;
  productor: string | null;
  categoria: string | null;
  cod_envase: string | null;
  destino: string | null;
  kilos: number | null;
  cant_cajas: number | null;
  peso: number | null;
  estado: string;
  ubicacion: string | null;
  temperatura: number | null;
  vencimiento: string | null;
  lote_origen: string | null;
  created_at?: string;
}

export interface DespachoRow {
  id: string;
  tenant_id: string;
  fecha: string;
  num_remito: string | null;
  cliente: string | null;
  DTV: string | null;
  codigo_cierre: string | null;
  termografo: string | null;
  DTC: string | null;
  destino: string | null;
  transporte: string | null;
  total_pallets: number | null;
  total_cajas: number | null;
  cuit: string | null;
  chasis: string | null;
  acoplado: string | null;
  chofer: string | null;
  dni: string | null;
  celular: string | null;
  operario: string | null;
  created_at?: string;
}

export interface EgresoFrutaRow {
  id: string;
  tenant_id: string;
  fecha: string;
  num_remito: string | null;
  cliente: string | null;
  finca: string | null;
  producto: string | null;
  DTV: string | null;
  tara: number | null;
  peso_neto: number | null;
  transporte: string | null;
  chasis: string | null;
  acoplado: string | null;
  chofer: string | null;
  created_at?: string;
}

// ==================== Create DTOs ====================

export interface CreateIngresoFrutaData {
  fecha: string;
  estadoLiquidacion?: boolean;
  numTicket?: number;
  numRemito?: number;
  productor: string;
  finca?: string;
  producto: string;
  lote?: number;
  contratista?: string;
  tipoCosecha?: string;
  cantBin: number;
  tipoBin: string;
  pesoNeto: number;
  transporte?: string;
  chofer?: string;
  chasis?: string;
  acoplado?: string;
  operario?: string;
  tenant_id?: string;
}

export interface CreatePreprocesoData {
  semana: number;
  fecha: string;
  duracion: number;
  binVolcados: number;
  ritmoMaquina: number;
  duracionProceso: number;
  binPleno: number;
  binIntermedioI: number;
  binIntermedioII: number;
  binIncipiente: number;
  cantPersonal: number;
  tenant_id?: string;
}

export interface CreatePalletData {
  semana?: number;
  fecha?: string;
  numPallet?: string;
  producto?: string;
  productor?: string;
  categoria?: string;
  codEnvase?: string;
  destino?: string;
  kilos?: number;
  cantCajas?: number;
  peso?: number;
  estado?: string;
  ubicacion?: string;
  temperatura?: number;
  vencimiento?: string;
  loteOrigen?: string;
  tenant_id?: string;
}

export interface CreateDespachoData {
  fecha: string;
  numRemito?: string;
  cliente?: string;
  DTV?: string;
  codigoCierre?: string;
  termografo?: string;
  DTC?: string;
  destino?: string;
  transporte?: string;
  totalPallets?: number;
  totalCajas?: number;
  cuit?: string;
  chasis?: string;
  acoplado?: string;
  chofer?: string;
  dni?: string;
  celular?: string;
  operario?: string;
  tenant_id?: string;
}

export interface CreateEgresoFrutaData {
  fecha: string;
  numRemito?: string;
  cliente?: string;
  finca?: string;
  producto?: string;
  DTV?: string;
  tara?: number;
  pesoNeto?: number;
  transporte?: string;
  chasis?: string;
  acoplado?: string;
  chofer?: string;
  tenant_id?: string;
}

// ==================== INGRESO FRUTA API ====================

export const ingresoFrutaApiService = {
  async getIngresos(tenantId: string): Promise<IngresoFrutaRow[]> {
    if (isDemoModeClient()) {
      return demoEmpaqueIngresos(tenantId);
    }

    const response = await apiClient.get(`/empaque/ingreso-fruta/tenant/${tenantId}`);
    return response.data.ingresos;
  },

  async getIngresoById(id: string): Promise<IngresoFrutaRow | null> {
    if (isDemoModeClient()) {
      return null;
    }

    const response = await apiClient.get(`/empaque/ingreso-fruta/${id}`);
    return response.data.ingreso;
  },

  async createIngreso(tenantId: string, data: CreateIngresoFrutaData): Promise<IngresoFrutaRow> {
    if (isDemoModeClient()) {
      return demoEmpaqueCreateIngreso({
        ...data,
        tenantId,
        tenant_id: tenantId,
      } as any);
    }

    const response = await apiClient.post(`/empaque/ingreso-fruta/tenant/${tenantId}`, {
      fecha: data.fecha,
      estadoLiquidacion: data.estadoLiquidacion,
      numTicket: data.numTicket,
      numRemito: data.numRemito,
      productor: data.productor,
      finca: data.finca,
      producto: data.producto,
      lote: data.lote,
      contratista: data.contratista,
      tipoCosecha: data.tipoCosecha,
      cantBin: data.cantBin,
      tipoBin: data.tipoBin,
      pesoNeto: data.pesoNeto,
      transporte: data.transporte,
      chofer: data.chofer,
      chasis: data.chasis,
      acoplado: data.acoplado,
      operario: data.operario,
    });
    return response.data.ingreso;
  },

  async updateIngreso(id: string, data: Partial<CreateIngresoFrutaData>): Promise<IngresoFrutaRow> {
    if (isDemoModeClient()) {
      throw new Error('Not implemented in demo mode');
    }

    const response = await apiClient.put(`/empaque/ingreso-fruta/${id}`, data);
    return response.data.ingreso;
  },

  async deleteIngreso(id: string): Promise<void> {
    if (isDemoModeClient()) {
      return;
    }

    await apiClient.delete(`/empaque/ingreso-fruta/${id}`);
  },
};

// ==================== PREPROCESO API ====================

export const preprocesoApiService = {
  async getPreprocesos(tenantId: string): Promise<PreprocesoRow[]> {
    if (isDemoModeClient()) {
      return demoEmpaquePreprocesos(tenantId);
    }

    const response = await apiClient.get(`/empaque/preproceso/tenant/${tenantId}`);
    return response.data.preprocesos;
  },

  async getPreprocesoById(id: string): Promise<PreprocesoRow | null> {
    if (isDemoModeClient()) {
      return null;
    }

    const response = await apiClient.get(`/empaque/preproceso/${id}`);
    return response.data.preproceso;
  },

  async createPreproceso(tenantId: string, data: CreatePreprocesoData): Promise<PreprocesoRow> {
    if (isDemoModeClient()) {
      return demoEmpaqueCreatePreproceso({
        ...data,
        tenantId,
        tenant_id: tenantId,
      } as any);
    }

    const response = await apiClient.post(`/empaque/preproceso/tenant/${tenantId}`, {
      semana: data.semana,
      fecha: data.fecha,
      duracion: data.duracion,
      binVolcados: data.binVolcados,
      ritmoMaquina: data.ritmoMaquina,
      duracionProceso: data.duracionProceso,
      binPleno: data.binPleno,
      binIntermedioI: data.binIntermedioI,
      binIntermedioII: data.binIntermedioII,
      binIncipiente: data.binIncipiente,
      cantPersonal: data.cantPersonal,
    });
    return response.data.preproceso;
  },

  async updatePreproceso(id: string, data: Partial<CreatePreprocesoData>): Promise<PreprocesoRow> {
    if (isDemoModeClient()) {
      throw new Error('Not implemented in demo mode');
    }

    const response = await apiClient.put(`/empaque/preproceso/${id}`, data);
    return response.data.preproceso;
  },

  async deletePreproceso(id: string): Promise<void> {
    if (isDemoModeClient()) {
      return;
    }

    await apiClient.delete(`/empaque/preproceso/${id}`);
  },
};

// ==================== PALLETS API ====================

export const palletsApiService = {
  async getPallets(tenantId: string): Promise<PalletRow[]> {
    if (isDemoModeClient()) {
      return demoEmpaquePallets(tenantId);
    }

    const response = await apiClient.get(`/empaque/pallets/tenant/${tenantId}`);
    return response.data.pallets;
  },

  async getPalletById(id: string): Promise<PalletRow | null> {
    if (isDemoModeClient()) {
      return null;
    }

    const response = await apiClient.get(`/empaque/pallets/${id}`);
    return response.data.pallet;
  },

  async createPallet(tenantId: string, data: CreatePalletData): Promise<PalletRow> {
    if (isDemoModeClient()) {
      return demoEmpaqueCreatePallet({
        ...data,
        tenantId,
        tenant_id: tenantId,
      } as any);
    }

    const response = await apiClient.post(`/empaque/pallets/tenant/${tenantId}`, {
      semana: data.semana,
      fecha: data.fecha,
      numPallet: data.numPallet,
      producto: data.producto,
      productor: data.productor,
      categoria: data.categoria,
      codEnvase: data.codEnvase,
      destino: data.destino,
      kilos: data.kilos,
      cantCajas: data.cantCajas,
      peso: data.peso,
      estado: data.estado,
      ubicacion: data.ubicacion,
      temperatura: data.temperatura,
      vencimiento: data.vencimiento,
      loteOrigen: data.loteOrigen,
    });
    return response.data.pallet;
  },

  async updatePallet(id: string, data: Partial<CreatePalletData>): Promise<PalletRow> {
    if (isDemoModeClient()) {
      throw new Error('Not implemented in demo mode');
    }

    const response = await apiClient.put(`/empaque/pallets/${id}`, data);
    return response.data.pallet;
  },

  async deletePallet(id: string): Promise<void> {
    if (isDemoModeClient()) {
      return;
    }

    await apiClient.delete(`/empaque/pallets/${id}`);
  },
};

// ==================== DESPACHO API ====================

export const despachoApiService = {
  async getDespachos(tenantId: string): Promise<DespachoRow[]> {
    if (isDemoModeClient()) {
      return demoEmpaqueDespachos(tenantId);
    }

    const response = await apiClient.get(`/empaque/despacho/tenant/${tenantId}`);
    return response.data.despachos;
  },

  async getDespachoById(id: string): Promise<DespachoRow | null> {
    if (isDemoModeClient()) {
      return null;
    }

    const response = await apiClient.get(`/empaque/despacho/${id}`);
    return response.data.despacho;
  },

  async createDespacho(tenantId: string, data: CreateDespachoData): Promise<DespachoRow> {
    if (isDemoModeClient()) {
      return demoEmpaqueCreateDespacho({
        ...data,
        tenantId,
        tenant_id: tenantId,
      } as any);
    }

    const response = await apiClient.post(`/empaque/despacho/tenant/${tenantId}`, {
      fecha: data.fecha,
      numRemito: data.numRemito,
      cliente: data.cliente,
      DTV: data.DTV,
      codigoCierre: data.codigoCierre,
      termografo: data.termografo,
      DTC: data.DTC,
      destino: data.destino,
      transporte: data.transporte,
      totalPallets: data.totalPallets,
      totalCajas: data.totalCajas,
      cuit: data.cuit,
      chasis: data.chasis,
      acoplado: data.acoplado,
      chofer: data.chofer,
      dni: data.dni,
      celular: data.celular,
      operario: data.operario,
    });
    return response.data.despacho;
  },

  async updateDespacho(id: string, data: Partial<CreateDespachoData>): Promise<DespachoRow> {
    if (isDemoModeClient()) {
      throw new Error('Not implemented in demo mode');
    }

    const response = await apiClient.put(`/empaque/despacho/${id}`, data);
    return response.data.despacho;
  },

  async deleteDespacho(id: string): Promise<void> {
    if (isDemoModeClient()) {
      return;
    }

    await apiClient.delete(`/empaque/despacho/${id}`);
  },
};

// ==================== EGRESO FRUTA API ====================

export const egresoFrutaApiService = {
  async getEgresos(tenantId: string): Promise<EgresoFrutaRow[]> {
    if (isDemoModeClient()) {
      return demoEmpaqueEgresos(tenantId);
    }

    const response = await apiClient.get(`/empaque/egreso-fruta/tenant/${tenantId}`);
    return response.data.egresos;
  },

  async getEgresoById(id: string): Promise<EgresoFrutaRow | null> {
    if (isDemoModeClient()) {
      return null;
    }

    const response = await apiClient.get(`/empaque/egreso-fruta/${id}`);
    return response.data.egreso;
  },

  async createEgreso(tenantId: string, data: CreateEgresoFrutaData): Promise<EgresoFrutaRow> {
    if (isDemoModeClient()) {
      return demoEmpaqueCreateEgreso({
        ...data,
        tenantId,
        tenant_id: tenantId,
      } as any);
    }

    const response = await apiClient.post(`/empaque/egreso-fruta/tenant/${tenantId}`, {
      fecha: data.fecha,
      numRemito: data.numRemito,
      cliente: data.cliente,
      finca: data.finca,
      producto: data.producto,
      DTV: data.DTV,
      tara: data.tara,
      pesoNeto: data.pesoNeto,
      transporte: data.transporte,
      chasis: data.chasis,
      acoplado: data.acoplado,
      chofer: data.chofer,
    });
    return response.data.egreso;
  },

  async updateEgreso(id: string, data: Partial<CreateEgresoFrutaData>): Promise<EgresoFrutaRow> {
    if (isDemoModeClient()) {
      throw new Error('Not implemented in demo mode');
    }

    const response = await apiClient.put(`/empaque/egreso-fruta/${id}`, data);
    return response.data.egreso;
  },

  async deleteEgreso(id: string): Promise<void> {
    if (isDemoModeClient()) {
      return;
    }

    await apiClient.delete(`/empaque/egreso-fruta/${id}`);
  },
};
