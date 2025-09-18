// Tipos globales para el sistema agrícola multi-tenant

// Tipos para el sistema multi-tenant
export interface Tenant {
  id: string
  name: string
  slug: string
  plan: string
  primary_crop: string
  contact_email: string
  created_by: string
  created_at: string
}

export interface TenantMembership {
  id: string
  tenant_id: string
  user_id: string
  role_code: 'admin' | 'user' | 'viewer'
  status: 'active' | 'pending' | 'inactive'
  invited_by?: string
  accepted_at?: string
}

export interface TenantModule {
  tenant_id: string
  module_code: string
  enabled: boolean
  created_at: string
}

export interface CreateTenantRequest {
  name: string
  slug: string
  plan: string
  primary_crop: string
  contact_email: string
  admin_user: {
    email: string
    password: string
    full_name: string
  }
}

export interface TareaCampo {
  id: string
  tenantId: string
  lote: string
  cultivo: string
  tipo: "insecticida" | "fertilizante" | "poda" | "riego" | "cosecha"
  descripcion: string
  fechaProgramada: string
  fechaCreacion: string
  responsable: string
  estado: "pendiente" | "en-curso" | "completada"
  notas?: string
}

export interface RegistroEmpaque {
  id: string
  tenantId: string
  fecha: string
  cultivo: string
  kgEntraron: number
  kgSalieron: number
  kgDescartados: number
  notas?: string
}

export interface MovimientoCaja {
  id: string
  tenantId: string
  fecha: string
  tipo: "ingreso" | "egreso"
  monto: number
  concepto: string
  categoria: string
  comprobante?: string
}

export interface ItemInventario {
  id: string
  tenantId: string
  nombre: string
  categoria: "insumos" | "pallets" | "cajas" | "maquinaria" | "herramientas"
  stock: number
  stockMinimo: number
  unidad: string
  descripcion?: string
  ubicacion?: string
}

// Nuevos tipos para el módulo de empaque

export interface IngresoFruta {
  id: string
  tenantId: string
  fecha: string
  proveedor: string
  tipoFruta: string
  cantidad: number
  unidad: string
  calidad: "A" | "B" | "C"
  precioUnitario: number
  total: number
  numeroLote: string
  transportista?: string
  observaciones?: string
  estado: "recibido" | "rechazado" | "en_revision"
}

export interface Preproceso {
  id: string
  tenantId: string
  fecha: string
  semana: string
  loteIngreso: string
  tipoFruta: string
  cantidadInicial: number
  cantidadProcesada: number
  cantidadDescarte: number
  motivoDescarte?: string
  responsable: string
  controlCalidad: boolean
  temperatura?: number
  humedad?: number
  observaciones?: string
  estado: "pendiente" | "en_proceso" | "completado"
  duracion: number
  bin_volcados: number
  ritmo_maquina: number
  duracion_proceso: number
  bin_pleno: number
  bin_intermedio_l: number
  bin_intermedio_ll: number
  bin_incipiente: number
  cant_personal: number
}

export interface Pallet {
  id: string
  tenantId: string
  codigo: string
  fechaCreacion: string
  tipoFruta: string
  cantidadCajas: number
  pesoTotal: number
  loteOrigen: string
  destino?: string
  ubicacion: string
  estado: "armado" | "en_camara" | "listo_despacho" | "despachado"
  temperaturaAlmacen?: number
  fechaVencimiento?: string
  observaciones?: string
}

export interface Despacho {
  id: string
  tenantId: string
  fecha: string
  numeroGuia: string
  cliente: string
  transportista: string
  pallets: string[] // IDs de pallets
  destino: string
  fechaEntregaEstimada: string
  responsable: string
  estado: "preparando" | "en_transito" | "entregado" | "devuelto"
  observaciones?: string
  documentos?: string[]
}

export interface EgresoFruta {
  id: string
  tenantId: string
  fecha: string
  tipoMovimiento: "venta" | "merma" | "devolucion" | "regalo"
  tipoFruta: string
  cantidad: number
  unidad: string
  destino: string
  motivo?: string
  valorUnitario?: number
  valorTotal?: number
  responsable: string
  documentoReferencia?: string
  observaciones?: string
}
