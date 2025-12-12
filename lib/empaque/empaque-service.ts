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

    // Remove undefined fields to avoid API validation errors
    const payload: Record<string, any> = {
      fecha: data.fecha,
      productor: data.productor,
      producto: data.producto,
      cantBin: data.cantBin,
      tipoBin: data.tipoBin,
      pesoNeto: data.pesoNeto,
    };
    if (data.estadoLiquidacion !== undefined) payload.estadoLiquidacion = data.estadoLiquidacion;
    if (data.numTicket !== undefined) payload.numTicket = data.numTicket;
    if (data.numRemito !== undefined) payload.numRemito = data.numRemito;
    if (data.finca !== undefined) payload.finca = data.finca;
    if (data.lote !== undefined) payload.lote = data.lote;
    if (data.contratista !== undefined) payload.contratista = data.contratista;
    if (data.tipoCosecha !== undefined) payload.tipoCosecha = data.tipoCosecha;
    if (data.transporte !== undefined) payload.transporte = data.transporte;
    if (data.chofer !== undefined) payload.chofer = data.chofer;
    if (data.chasis !== undefined) payload.chasis = data.chasis;
    if (data.acoplado !== undefined) payload.acoplado = data.acoplado;
    if (data.operario !== undefined) payload.operario = data.operario;

    const response = await apiClient.post(`/empaque/ingreso-fruta/tenant/${tenantId}`, payload);
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

    // Remove undefined fields to avoid API validation errors
    const payload: Record<string, any> = {};
    if (data.semana !== undefined) payload.semana = data.semana;
    if (data.fecha !== undefined) payload.fecha = data.fecha;
    if (data.numPallet !== undefined) payload.numPallet = data.numPallet;
    if (data.producto !== undefined) payload.producto = data.producto;
    if (data.productor !== undefined) payload.productor = data.productor;
    if (data.categoria !== undefined) payload.categoria = data.categoria;
    if (data.codEnvase !== undefined) payload.codEnvase = data.codEnvase;
    if (data.destino !== undefined) payload.destino = data.destino;
    if (data.kilos !== undefined) payload.kilos = data.kilos;
    if (data.cantCajas !== undefined) payload.cantCajas = data.cantCajas;
    if (data.peso !== undefined) payload.peso = data.peso;
    if (data.estado !== undefined) payload.estado = data.estado;
    if (data.ubicacion !== undefined) payload.ubicacion = data.ubicacion;
    if (data.temperatura !== undefined) payload.temperatura = data.temperatura;
    if (data.vencimiento !== undefined) payload.vencimiento = data.vencimiento;
    if (data.loteOrigen !== undefined) payload.loteOrigen = data.loteOrigen;

    const response = await apiClient.post(`/empaque/pallets/tenant/${tenantId}`, payload);
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

    // Remove undefined fields to avoid API validation errors
    const payload: Record<string, any> = { fecha: data.fecha };
    if (data.numRemito !== undefined) payload.numRemito = data.numRemito;
    if (data.cliente !== undefined) payload.cliente = data.cliente;
    if (data.DTV !== undefined) payload.DTV = data.DTV;
    if (data.codigoCierre !== undefined) payload.codigoCierre = data.codigoCierre;
    if (data.termografo !== undefined) payload.termografo = data.termografo;
    if (data.DTC !== undefined) payload.DTC = data.DTC;
    if (data.destino !== undefined) payload.destino = data.destino;
    if (data.transporte !== undefined) payload.transporte = data.transporte;
    if (data.totalPallets !== undefined) payload.totalPallets = data.totalPallets;
    if (data.totalCajas !== undefined) payload.totalCajas = data.totalCajas;
    if (data.cuit !== undefined) payload.cuit = data.cuit;
    if (data.chasis !== undefined) payload.chasis = data.chasis;
    if (data.acoplado !== undefined) payload.acoplado = data.acoplado;
    if (data.chofer !== undefined) payload.chofer = data.chofer;
    if (data.dni !== undefined) payload.dni = data.dni;
    if (data.celular !== undefined) payload.celular = data.celular;
    if (data.operario !== undefined) payload.operario = data.operario;

    const response = await apiClient.post(`/empaque/despacho/tenant/${tenantId}`, payload);
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

    // Remove undefined fields to avoid API validation errors
    const payload: Record<string, any> = { fecha: data.fecha };
    if (data.numRemito !== undefined) payload.numRemito = data.numRemito;
    if (data.cliente !== undefined) payload.cliente = data.cliente;
    if (data.finca !== undefined) payload.finca = data.finca;
    if (data.producto !== undefined) payload.producto = data.producto;
    if (data.DTV !== undefined) payload.DTV = data.DTV;
    if (data.tara !== undefined) payload.tara = data.tara;
    if (data.pesoNeto !== undefined) payload.pesoNeto = data.pesoNeto;
    if (data.transporte !== undefined) payload.transporte = data.transporte;
    if (data.chasis !== undefined) payload.chasis = data.chasis;
    if (data.acoplado !== undefined) payload.acoplado = data.acoplado;
    if (data.chofer !== undefined) payload.chofer = data.chofer;

    const response = await apiClient.post(`/empaque/egreso-fruta/tenant/${tenantId}`, payload);
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
