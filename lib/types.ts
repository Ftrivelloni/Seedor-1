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
  plan_id?: string
  plan_expires_at?: string
  billing_cycle?: 'monthly' | 'yearly'
}

export interface Plan {
  id: string
  name: string
  display_name: string
  description: string
  price_monthly: number
  price_yearly: number
  max_users: number
  max_storage_gb: number
  features: Record<string, boolean | number>
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface PlanFeature {
  id: string
  plan_id: string
  feature_code: string
  feature_name: string
  is_enabled: boolean
  limit_value?: number
  created_at: string
}

export interface SubscriptionHistory {
  id: string
  tenant_id: string
  from_plan_id?: string
  to_plan_id: string
  change_type: 'upgrade' | 'downgrade' | 'renewal' | 'cancellation'
  effective_date: string
  billing_amount?: number
  notes?: string
  created_by?: string
  created_at: string
}

// Tipos para autenticación
export interface AuthUser {
  id: string
  email: string
  nombre: string
  tenantId: string
  rol: string
  tenant: {
    id: string
    name: string
    [key: string]: any
  }
  profile?: any
  memberships?: any[]
}

export interface TenantMembership {
  id: string
  tenant_id: string
  user_id: string
  role_code: string // 'admin' | 'campo' | 'empaque' | 'finanzas'
  status: string // 'active' | 'pending' | 'inactive'
  invited_by?: string
  accepted_at?: string
}

export interface Worker {
  id: string
  tenant_id: string
  full_name: string
  document_id: string
  email: string
  phone?: string
  area_module: string // 'campo' | 'empaque' | 'finanzas' | 'admin'
  membership_id?: string // References tenant_memberships.id
  status: string // 'active' | 'inactive'
  created_at?: string
  updated_at?: string
}

export interface CreateWorkerRequest {
  email: string
  password: string
  full_name: string
  document_id: string
  phone: string
  role: 'admin' | 'campo' | 'empaque' | 'finanzas'
  tenant_id: string
}

// Tipos para Farms (Campos)
export interface Farm {
  id: string
  tenant_id: string
  name: string
  location: string | null
  area_ha: number | null
  default_crop: string | null
  notes: string | null
  created_at: string
  created_by: string
}

export interface CreateFarmData {
  name: string
  location?: string
  area_ha?: number
  default_crop?: string
  notes?: string
}

// Tipos para Lots (Lotes)
export interface Lot {
  id: string
  tenant_id: string
  farm_id: string
  code: string
  crop: string
  variety: string | null
  area_ha: number | null
  plant_date: string | null
  status: string
  created_at: string
}

export interface CreateLotData {
  farm_id: string
  code: string
  crop: string
  variety?: string
  area_ha?: number
  plant_date?: string
  status: string
}

export interface TenantModule {
  tenant_id: string
  module_code: string
  enabled: boolean
  created_at?: string
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
  bin_intermedio_I: number
  bin_intermedio_II: number
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
