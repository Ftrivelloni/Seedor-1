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
  // LemonSqueezy integration fields (using existing column names)
  lemon_customer_id?: string
  lemon_subscription_id?: string
  lemon_variant_id?: string  // Already existed
  lemon_order_id?: string     // Already existed
  lemon_checkout_id?: string  // Already existed
  payment_status?: 'pending' | 'active' | 'past_due' | 'cancelled' | 'expired' | 'legacy'  // Already existed
  payment_provider?: string   // Already existed
  payment_reference?: string  // Already existed
  payment_collected_at?: string  // Already existed (subscription start date)
  subscription_renews_at?: string
  subscription_ends_at?: string
  payment_failed_at?: string
  last_webhook_at?: string
  trial_ends_at?: string     // Already existed
  billing_status?: string    // Deprecated - use payment_status instead
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
  lemon_subscription_id?: string
  lemon_order_id?: string
}

// LemonSqueezy specific types
export interface LemonSqueezyCheckout {
  id: string
  checkout_id: string
  checkout_url: string
  variant_id: string
  plan_name: string
  tenant_name: string
  tenant_slug: string
  contact_name: string
  contact_email: string
  owner_phone?: string
  expires_at: string
  completed: boolean
  completed_at?: string
  tenant_id?: string
  created_at: string
}

export interface LemonSqueezyWebhookEvent {
  id: string
  event_id: string
  event_type: string
  payload: Record<string, any>
  processed: boolean
  processed_at?: string
  error?: string
  retry_count: number
  tenant_id?: string
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

// ==========================
// Tipos para Tasks (Campo)
// ==========================

export interface Task {
  id: string
  tenant_id: string
  farm_id?: string
  lot_id: string
  title: string
  description?: string
  type_code: string
  status_code: string // 'pendiente' | 'en_curso' | 'completada' | ...
  scheduled_date?: string | null
  responsible_membership_id?: string | null
  worker_id?: string | null
  created_at?: string
}

export interface TaskType {
  code: string
  name: string
}

export interface TaskStatus {
  code: string
  name: string
}

export interface CreateTaskData {
  farm_id?: string
  lot_id: string
  title: string
  description?: string
  type_code?: string
  status_code: string
  scheduled_date?: string | null
  responsible_membership_id?: string | null
  worker_id?: string | null
}

// =============================
// Tipos para Asistencias (RRHH)
// =============================

export interface AttendanceRecord {
  id: string
  tenant_id: string
  worker_id: string
  date: string
  status: string // 'present' | 'absent' | 'sick' | ...
  reason?: string | null
}

export interface CreateAttendanceData {
  worker_id: string
  date: string
  status: string
  reason?: string
}

export interface AttendanceStatus {
  code: string
  name: string
}

// =============================
// Tipos para Inventario
// =============================

export interface InventoryItem {
  id: string
  tenant_id: string
  name: string
  category_id: string
  location_id: string
  unit: string
  min_stock: number
  current_stock: number
  created_at: string
  category_name?: string
  location_name?: string
}

export interface InventoryCategory {
  id: string
  tenant_id: string
  name: string
}

export interface InventoryLocation {
  id: string
  tenant_id: string
  name: string
}

export type MovementTypeCode = 'IN' | 'OUT'

export interface InventoryMovementType {
  code: MovementTypeCode
  name: string
}

export interface InventoryMovement {
  id: string
  tenant_id: string
  item_id: string
  date: string
  type: MovementTypeCode
  quantity: number
  unit_cost?: number | null
  reason: string
  ref_module?: string | null
  ref_id?: string | null
  created_by?: string | null
  created_at: string
  item_name?: string
}

export interface InventorySummary {
  totalItems: number
  lowStockItems: number
  lastMovementDate?: string
}

export interface CreateItemPayload {
  name: string
  category_id: string
  location_id: string
  unit: string
  min_stock: number
  current_stock?: number
}

export interface UpdateItemPayload {
  name?: string
  category_id?: string
  location_id?: string
  unit?: string
  min_stock?: number
}

export interface CreateMovementPayload {
  item_id: string
  date: string
  type: MovementTypeCode
  quantity: number
  unit_cost?: number
  reason: string
  ref_module?: string
  ref_id?: string
  created_by?: string
}

export interface ListItemsParams {
  tenantId: string
  search?: string
  categoryId?: string
  locationId?: string
  limit?: number
  offset?: number
}

export interface ListMovementsParams {
  tenantId: string
  itemId?: string
  limit?: number
  offset?: number
}
