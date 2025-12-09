import { DEMO_TENANT } from "./shared";
import type {
  MovimientoCaja,
  Worker,
  AttendanceRecord,
  CreateAttendanceData,
  InventoryCategory,
  InventoryItem,
  InventoryLocation,
  InventoryMovement,
  InventorySummary,
  ListItemsParams,
  ListMovementsParams,
  TareaCampo,
  RegistroEmpaque,
  Farm,
  Lot,
  CreateFarmData,
  CreateLotData,
  Task,
  TaskStatus,
  TaskType,
  CreateTaskData,
} from "../types";

type FinanceCategory = {
  id: string;
  tenant_id: string;
  name: string;
  kind: "ingreso" | "egreso";
};

interface DemoStore {
  initializedAt: number;
  tenants: Array<{
    id: string;
    name: string;
    slug: string;
    plan: string;
    primary_crop: string;
    contact_email: string;
    created_by: string;
    created_at: string;
  }>;
  memberships: Array<{
    id: string;
    tenant_id: string;
    user_id: string;
    role_code: string;
    status: string;
    accepted_at: string;
  }>;
  tenantModules: Array<{
    tenant_id: string;
    module_code: string;
    enabled: boolean;
  }>;
  finanzas: {
    categories: FinanceCategory[];
    movements: MovimientoCaja[];
  };
  trabajadores: Worker[];
  attendance: {
    records: AttendanceRecord[];
    statuses: Array<{ code: string; name: string }>;
  };
  inventory: {
    categories: InventoryCategory[];
    locations: InventoryLocation[];
    items: InventoryItem[];
    movements: InventoryMovement[];
    movementTypes: Array<{ code: "IN" | "OUT"; name: string }>;
  };
  empaque: {
    registros: RegistroEmpaque[];
    ingresos: any[];
    egresos: any[];
    pallets: any[];
    despachos: any[];
    preprocesos: any[];
  };
  campo: {
    tareas: TareaCampo[];
    farms: Farm[];
    lots: Lot[];
    lotStatuses: Array<{ code: string; name: string }>;
    tasks: Task[];
    taskStatuses: TaskStatus[];
    taskTypes: TaskType[];
  };
}

const STORE_KEY = "__SEEDOR_DEMO_STORE__";

const clone = <T>(value: T): T => {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
};

const generateId = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36)}`;

const nowIso = () => new Date().toISOString();

const createInitialStore = (): DemoStore => {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  return {
    initializedAt: Date.now(),
    tenants: [
      {
        id: DEMO_TENANT.id,
        name: DEMO_TENANT.name,
        slug: DEMO_TENANT.slug,
        plan: DEMO_TENANT.plan,
        primary_crop: DEMO_TENANT.primary_crop,
        contact_email: DEMO_TENANT.contact_email,
        created_by: DEMO_TENANT.created_by,
        created_at: DEMO_TENANT.created_at,
      },
    ],
    memberships: [
      {
        id: "demo-membership",
        tenant_id: DEMO_TENANT.id,
        user_id: "demo-admin",
        role_code: "admin",
        status: "active",
        accepted_at: "2024-01-01T00:00:00.000Z",
      },
    ],
    tenantModules: [
      "dashboard",
      "campo",
      "empaque",
      "inventario",
      "finanzas",
      "trabajadores",
      "contactos",
      "ajustes",
      "user_management",
    ].map((module) => ({
      tenant_id: DEMO_TENANT.id,
      module_code: module,
      enabled: true,
    })),
    finanzas: {
      categories: [
        {
          id: "demo-fin-cat-1",
          tenant_id: DEMO_TENANT.id,
          name: "Ventas de fruta",
          kind: "ingreso",
        },
        {
          id: "demo-fin-cat-2",
          tenant_id: DEMO_TENANT.id,
          name: "Gastos operativos",
          kind: "egreso",
        },
      ],
      movements: [
        {
          id: "demo-mov-1",
          tenantId: DEMO_TENANT.id,
          fecha: yesterday,
          tipo: "ingreso",
          monto: 4800,
          concepto: "Venta mayorista",
          categoria: "Ventas de fruta",
        },
        {
          id: "demo-mov-2",
          tenantId: DEMO_TENANT.id,
          fecha: todayStr,
          tipo: "egreso",
          monto: 950,
          concepto: "Compra de bins plásticos",
          categoria: "Gastos operativos",
        },
      ],
    },
    trabajadores: [
      {
        id: "demo-worker-1",
        tenant_id: DEMO_TENANT.id,
        full_name: "María López",
        document_id: "DNI 12345678",
        email: "maria.campo@demo.com",
        phone: "+54 11 5555-1111",
        area_module: "campo",
        membership_id: "demo-membership",
        status: "active",
        created_at: nowIso(),
      },
      {
        id: "demo-worker-2",
        tenant_id: DEMO_TENANT.id,
        full_name: "Juan Rodríguez",
        document_id: "DNI 23456789",
        email: "juan.empaque@demo.com",
        phone: "+54 11 5555-2222",
        area_module: "empaque",
        membership_id: "demo-membership",
        status: "active",
        created_at: nowIso(),
      },
      {
        id: "demo-worker-3",
        tenant_id: DEMO_TENANT.id,
        full_name: "Ana Martínez",
        document_id: "DNI 34567890",
        email: "ana.finanzas@demo.com",
        phone: "+54 11 5555-3333",
        area_module: "finanzas",
        membership_id: "demo-membership",
        status: "active",
        created_at: nowIso(),
      },
    ],
    attendance: {
      records: [
        {
          id: "demo-att-1",
          tenant_id: DEMO_TENANT.id,
          worker_id: "demo-worker-1",
          date: yesterday,
          status: "PRE",
          reason: null,
        },
        {
          id: "demo-att-2",
          tenant_id: DEMO_TENANT.id,
          worker_id: "demo-worker-2",
          date: yesterday,
          status: "PRE",
          reason: null,
        },
      ],
      statuses: [
        { code: "PRE", name: "Presente" },
        { code: "AUS", name: "Ausente" },
        { code: "TAR", name: "Tardanza" },
        { code: "LIC", name: "Licencia" },
        { code: "VAC", name: "Vacaciones" },
      ],
    },
    inventory: {
      categories: [
        { id: "demo-inv-cat-1", tenant_id: DEMO_TENANT.id, name: "Insumos" },
        { id: "demo-inv-cat-2", tenant_id: DEMO_TENANT.id, name: "Embalajes" },
      ],
      locations: [
        { id: "demo-inv-loc-1", tenant_id: DEMO_TENANT.id, name: "Depósito central" },
        { id: "demo-inv-loc-2", tenant_id: DEMO_TENANT.id, name: "Planta de empaque" },
      ],
      items: [
        {
          id: "demo-inv-item-1",
          tenant_id: DEMO_TENANT.id,
          name: "Caja plástica azul",
          category_id: "demo-inv-cat-2",
          location_id: "demo-inv-loc-2",
          unit: "unidad",
          min_stock: 50,
          current_stock: 180,
          created_at: nowIso(),
        },
        {
          id: "demo-inv-item-2",
          tenant_id: DEMO_TENANT.id,
          name: "Fertilizante orgánico",
          category_id: "demo-inv-cat-1",
          location_id: "demo-inv-loc-1",
          unit: "kg",
          min_stock: 40,
          current_stock: 65,
          created_at: nowIso(),
        },
      ],
      movements: [
        {
          id: "demo-inv-mov-1",
          tenant_id: DEMO_TENANT.id,
          item_id: "demo-inv-item-1",
          date: yesterday,
          type: "IN",
          quantity: 200,
          reason: "Reposición de pallets",
          created_at: nowIso(),
        },
        {
          id: "demo-inv-mov-2",
          tenant_id: DEMO_TENANT.id,
          item_id: "demo-inv-item-2",
          date: todayStr,
          type: "OUT",
          quantity: 15,
          reason: "Aplicación campo norte",
          created_at: nowIso(),
        },
      ],
      movementTypes: [
        { code: "IN", name: "Ingreso" },
        { code: "OUT", name: "Salida" },
      ],
    },
    empaque: {
      registros: [
        {
          id: "demo-emp-1",
          tenantId: DEMO_TENANT.id,
          fecha: yesterday,
          cultivo: "Naranja",
          kgEntraron: 12000,
          kgSalieron: 10850,
          kgDescartados: 1150,
          notas: "Descartes por calibre",
        },
        {
          id: "demo-emp-2",
          tenantId: DEMO_TENANT.id,
          fecha: todayStr,
          cultivo: "Mandarina",
          kgEntraron: 8000,
          kgSalieron: 7200,
          kgDescartados: 800,
          notas: "Buen rendimiento",
        },
      ],
      ingresos: [
        {
          id: "demo-ing-1",
          tenant_id: DEMO_TENANT.id,
          tenantId: DEMO_TENANT.id,
          fecha: yesterday,
          estado_liquidacion: false,
          num_ticket: 120,
          num_remito: 4501,
          productor: "Finca Santa Rita",
          finca: "Lote Norte",
          producto: "Naranja Valencia",
          lote: 102,
          contratista: "Campo Norte SRL",
          tipo_cosecha: "Manual",
          cant_bin: 42,
          tipo_bin: "Plástico",
          peso_neto: 9800,
          transporte: "Camión 123",
          chofer: "Luis Franco",
          chasis: "AB123CD",
          acoplado: "XY987ZT",
          operario: "Roberto Díaz",
        },
      ],
      egresos: [
        {
          id: "demo-egr-1",
          tenant_id: DEMO_TENANT.id,
          tenantId: DEMO_TENANT.id,
          fecha: yesterday,
          producto: "Naranja Valencia",
          peso_neto: 8200,
          cliente: "Distribuidora La Costa",
          finca: "Lote Norte",
          num_remito: 2101,
          chofer: "Gustavo Pérez",
          transporte: "Transporte Ruta Sur",
          chasis: "CD321BA",
          acoplado: "ZT789XY",
        },
      ],
      pallets: [
        {
          id: "demo-pallet-1",
          tenant_id: DEMO_TENANT.id,
          tenantId: DEMO_TENANT.id,
          codigo: "PAL-0001",
          fechaCreacion: yesterday,
          tipoFruta: "Naranja",
          cantidadCajas: 56,
          pesoTotal: 1120,
          loteOrigen: "Lote Norte",
          destino: "Cámara fría 1",
          ubicacion: "Depósito",
          estado: "en_camara",
        },
      ],
      despachos: [
        {
          id: "demo-despacho-1",
          tenant_id: DEMO_TENANT.id,
          tenantId: DEMO_TENANT.id,
          fecha: todayStr,
          numeroGuia: "GUIA-4587",
          cliente: "Frutas del Sur",
          transportista: "Transporte Ruta Sur",
          pallets: ["demo-pallet-1"],
          destino: "Mercado Central",
          fechaEntregaEstimada: todayStr,
          responsable: "Juan Gómez",
          estado: "en_transito",
        },
      ],
      preprocesos: [
        {
          id: "demo-pre-1",
          tenant_id: DEMO_TENANT.id,
          tenantId: DEMO_TENANT.id,
          fecha: yesterday,
          semana: "2024-W22",
          loteIngreso: "demo-ing-1",
          tipoFruta: "Naranja",
          cantidadInicial: 9800,
          cantidadProcesada: 8550,
          cantidadDescarte: 1250,
          motivoDescarte: "Calibre fuera de rango",
          responsable: "Claudia Núñez",
          controlCalidad: true,
          temperatura: 7,
          humedad: 65,
          observaciones: "Proceso dentro de parámetros",
          estado: "completado",
          duracion: 4,
          bin_volcados: 40,
          ritmo_maquina: 120,
          duracion_proceso: 3.5,
          bin_pleno: 5,
          bin_intermedio_I: 2,
          bin_intermedio_II: 1,
          bin_incipiente: 0,
          cant_personal: 6,
        },
      ],
    },
    campo: {
      tareas: [
        {
          id: "demo-task-1",
          tenantId: DEMO_TENANT.id,
          lote: "Lote Norte",
          cultivo: "Naranja",
          tipo: "fertilizante",
          descripcion: "Aplicación de fertilizante orgánico",
          fechaProgramada: todayStr,
          fechaCreacion: yesterday,
          responsable: "María López",
          estado: "pendiente",
          notas: "Realizar durante la mañana",
        },
        {
          id: "demo-task-2",
          tenantId: DEMO_TENANT.id,
          lote: "Lote Sur",
          cultivo: "Mandarina",
          tipo: "poda",
          descripcion: "Poda sanitaria de árboles jóvenes",
          fechaProgramada: todayStr,
          fechaCreacion: yesterday,
          responsable: "Juan Rodríguez",
          estado: "en-curso",
        },
      ],
      farms: [
        {
          id: "demo-farm-1",
          tenant_id: DEMO_TENANT.id,
          name: "Campo Norte",
          location: "Ruta 5 Km 12, Mendoza",
          area_ha: 45,
          default_crop: "Frutillas",
          notes: "Campo principal con riego por goteo.",
          created_at: nowIso(),
          created_by: "demo-admin",
        },
        {
          id: "demo-farm-2",
          tenant_id: DEMO_TENANT.id,
          name: "Campo Sur",
          location: "Ruta 33 Km 8, San Rafael",
          area_ha: 32,
          default_crop: "Mandarina",
          notes: "Zona con pendiente suave y suelos arenosos.",
          created_at: nowIso(),
          created_by: "demo-admin",
        },
      ],
      lots: [
        {
          id: "demo-lot-1",
          tenant_id: DEMO_TENANT.id,
          farm_id: "demo-farm-1",
          code: "NORTE-1",
          crop: "Frutillas",
          variety: "Albion",
          area_ha: 12,
          plant_date: yesterday,
          status: "activo",
          created_at: nowIso(),
        },
        {
          id: "demo-lot-2",
          tenant_id: DEMO_TENANT.id,
          farm_id: "demo-farm-1",
          code: "NORTE-2",
          crop: "Arándanos",
          variety: "Emerald",
          area_ha: 8,
          plant_date: todayStr,
          status: "preparacion",
          created_at: nowIso(),
        },
        {
          id: "demo-lot-3",
          tenant_id: DEMO_TENANT.id,
          farm_id: "demo-farm-2",
          code: "SUR-1",
          crop: "Mandarina",
          variety: "Oronules",
          area_ha: 10,
          plant_date: yesterday,
          status: "en_descanso",
          created_at: nowIso(),
        },
      ],
      lotStatuses: [
        { code: "activo", name: "Activo" },
        { code: "en_descanso", name: "En descanso" },
        { code: "preparacion", name: "En preparación" },
      ],
      tasks: [
        {
          id: "demo-task-field-1",
          tenant_id: DEMO_TENANT.id,
          farm_id: "demo-farm-1",
          lot_id: "demo-lot-1",
          title: "Revisión de riego",
          description: "Verificar presión en líneas de goteo",
          type_code: "riego",
          status_code: "pendiente",
          scheduled_date: todayStr,
          responsible_membership_id: null,
          worker_id: "demo-worker-1",
          created_at: nowIso(),
        },
        {
          id: "demo-task-field-2",
          tenant_id: DEMO_TENANT.id,
          farm_id: "demo-farm-1",
          lot_id: "demo-lot-2",
          title: "Aplicación de bioestimulante",
          description: "Preparar mezcla 1.5% y aplicar por la tarde",
          type_code: "fertilizante",
          status_code: "en_curso",
          scheduled_date: todayStr,
          responsible_membership_id: null,
          worker_id: null,
          created_at: nowIso(),
        },
        {
          id: "demo-task-field-3",
          tenant_id: DEMO_TENANT.id,
          farm_id: "demo-farm-2",
          lot_id: "demo-lot-3",
          title: "Desmalezado manual",
          description: "Retirar malezas en bordes del lote",
          type_code: "mantenimiento",
          status_code: "completada",
          scheduled_date: yesterday,
          responsible_membership_id: null,
          worker_id: "demo-worker-2",
          created_at: nowIso(),
        },
      ],
      taskStatuses: [
        { code: "pendiente", name: "Pendiente" },
        { code: "en_curso", name: "En curso" },
        { code: "completada", name: "Completada" },
      ],
      taskTypes: [
        { code: "riego", name: "Riego" },
        { code: "fertilizante", name: "Fertilización" },
        { code: "mantenimiento", name: "Mantenimiento" },
        { code: "sanitario", name: "Control sanitario" },
      ],
    },
  };
};

export const getDemoStore = (): DemoStore => {
  if (typeof window === "undefined") {
    throw new Error("Demo store is only available in the browser");
  }

  const win = window as unknown as Record<string, DemoStore>;
  if (!win[STORE_KEY]) {
    win[STORE_KEY] = createInitialStore();
  }
  return win[STORE_KEY];
};

// Tenant helpers
export const demoTenantGetTenants = () => {
  const store = getDemoStore();
  return clone(store.tenants);
};

export const demoTenantGetModules = () => {
  const store = getDemoStore();
  return clone(store.tenantModules);
};

export const demoTenantMemberships = () => {
  const store = getDemoStore();
  return clone(store.memberships);
};

// Finanzas helpers
export const demoFinanzasGetMovimientos = (tenantId: string): MovimientoCaja[] => {
  const store = getDemoStore();
  return clone(store.finanzas.movements.filter((m) => m.tenantId === tenantId));
};

export const demoFinanzasGetCategorias = (
  tenantId: string,
  kind?: "ingreso" | "egreso",
): Array<{ id: string; name: string; tenant_id: string; kind: "ingreso" | "egreso" }> => {
  const store = getDemoStore();
  let categories = store.finanzas.categories.filter((c) => c.tenant_id === tenantId);
  if (kind) {
    categories = categories.filter((c) => c.kind === kind);
  }
  return clone(categories);
};

const ensureFinanceCategory = (
  tenantId: string,
  name: string,
  kind: "ingreso" | "egreso",
) => {
  const store = getDemoStore();
  const existing = store.finanzas.categories.find(
    (c) => c.tenant_id === tenantId && c.name.toLowerCase() === name.toLowerCase(),
  );
  if (existing) {
    return existing;
  }
  const category: FinanceCategory = {
    id: generateId("demo-fin-cat"),
    tenant_id: tenantId,
    name,
    kind,
  };
  store.finanzas.categories.push(category);
  return category;
};

export const demoFinanzasCreateCategoria = (
  tenantId: string,
  name: string,
  kind: "ingreso" | "egreso",
) => {
  return clone(ensureFinanceCategory(tenantId, name, kind));
};

export const demoFinanzasCreateMovimiento = (
  tenantId: string,
  data: Omit<MovimientoCaja, "id">,
): MovimientoCaja => {
  const store = getDemoStore();
  const categoryName = data.categoria || "Sin categoría";
  ensureFinanceCategory(tenantId, categoryName, data.tipo === "ingreso" ? "ingreso" : "egreso");

  const movimiento: MovimientoCaja = {
    ...data,
    id: generateId("demo-mov"),
    tenantId,
    categoria: categoryName,
  };

  store.finanzas.movements.unshift(movimiento);
  return clone(movimiento);
};

// Trabajadores helpers
export const demoWorkersList = (tenantId: string, includeInactive = false): Worker[] => {
  const store = getDemoStore();
  return clone(
    store.trabajadores.filter(
      (worker) => worker.tenant_id === tenantId && (includeInactive || worker.status === "active"),
    ),
  );
};

export const demoWorkersCreate = (
  tenantId: string,
  workerData: {
    full_name: string;
    document_id: string;
    email: string;
    phone?: string;
    area_module: string;
    membership_id?: string;
  },
): Worker => {
  const store = getDemoStore();
  const worker: Worker = {
    id: generateId("demo-worker"),
    tenant_id: tenantId,
    status: "active",
    created_at: nowIso(),
    ...workerData,
  };
  store.trabajadores.push(worker);
  return clone(worker);
};

export const demoWorkersUpdate = (workerId: string, updates: Partial<Worker>): Worker => {
  const store = getDemoStore();
  const index = store.trabajadores.findIndex((w) => w.id === workerId);
  if (index === -1) {
    throw new Error("Trabajador no encontrado");
  }
  store.trabajadores[index] = {
    ...store.trabajadores[index],
    ...updates,
    updated_at: nowIso(),
  };
  return clone(store.trabajadores[index]);
};

export const demoWorkersSoftDelete = (workerId: string) => {
  demoWorkersUpdate(workerId, { status: "inactive" } as Partial<Worker>);
};

export const demoWorkersHardDelete = (workerId: string) => {
  const store = getDemoStore();
  store.attendance.records = store.attendance.records.filter((r) => r.worker_id !== workerId);
  store.trabajadores = store.trabajadores.filter((w) => w.id !== workerId);
};

// Attendance helpers
export const demoAttendanceGetByTenant = (tenantId: string): AttendanceRecord[] => {
  const store = getDemoStore();
  return clone(store.attendance.records.filter((r) => r.tenant_id === tenantId));
};

export const demoAttendanceGetByDate = (tenantId: string, date: string): AttendanceRecord[] => {
  return demoAttendanceGetByTenant(tenantId).filter((r) => r.date === date);
};

export const demoAttendanceCreate = (
  tenantId: string,
  data: CreateAttendanceData,
): AttendanceRecord => {
  const store = getDemoStore();
  store.attendance.records = store.attendance.records.filter(
    (r) => !(r.tenant_id === tenantId && r.worker_id === data.worker_id && r.date === data.date),
  );

  const record: AttendanceRecord = {
    id: generateId("demo-att"),
    tenant_id: tenantId,
    worker_id: data.worker_id,
    date: data.date,
    status: data.status,
    reason: data.reason ?? null,
  };
  store.attendance.records.push(record);
  return clone(record);
};

export const demoAttendanceUpdate = (
  recordId: string,
  updates: Partial<AttendanceRecord>,
): AttendanceRecord => {
  const store = getDemoStore();
  const index = store.attendance.records.findIndex((r) => r.id === recordId);
  if (index === -1) {
    throw new Error("Registro de asistencia no encontrado");
  }
  store.attendance.records[index] = {
    ...store.attendance.records[index],
    ...updates,
  };
  return clone(store.attendance.records[index]);
};

export const demoAttendanceDelete = (recordId: string) => {
  const store = getDemoStore();
  store.attendance.records = store.attendance.records.filter((r) => r.id !== recordId);
};

export const demoAttendanceStatuses = () => {
  const store = getDemoStore();
  return clone(store.attendance.statuses);
};

// Inventory helpers
export const demoInventoryListItems = (params: ListItemsParams): InventoryItem[] => {
  const store = getDemoStore();
  let items = store.inventory.items.filter((item) => item.tenant_id === params.tenantId);

  if (params.search) {
    const term = params.search.toLowerCase();
    items = items.filter((item) => item.name.toLowerCase().includes(term));
  }

  if (params.categoryId) {
    items = items.filter((item) => item.category_id === params.categoryId);
  }

  if (params.locationId) {
    items = items.filter((item) => item.location_id === params.locationId);
  }

  items = [...items].sort((a, b) => a.name.localeCompare(b.name));

  if (typeof params.offset === "number" && typeof params.limit === "number") {
    items = items.slice(params.offset, params.offset + params.limit);
  } else if (typeof params.limit === "number") {
    items = items.slice(0, params.limit);
  }

  return clone(items);
};

export const demoInventoryGetItemById = (
  itemId: string,
  tenantId: string,
): InventoryItem | null => {
  const store = getDemoStore();
  const item = store.inventory.items.find(
    (i) => i.id === itemId && i.tenant_id === tenantId,
  );
  return item ? clone(item) : null;
};

export const demoInventoryCreateItem = (
  tenantId: string,
  payload: {
    name: string;
    category_id: string;
    location_id: string;
    unit: string;
    min_stock: number;
    current_stock?: number;
  },
): InventoryItem => {
  const store = getDemoStore();
  const item: InventoryItem = {
    id: generateId("demo-inv-item"),
    tenant_id: tenantId,
    name: payload.name,
    category_id: payload.category_id,
    location_id: payload.location_id,
    unit: payload.unit,
    min_stock: payload.min_stock,
    current_stock: payload.current_stock ?? payload.min_stock,
    created_at: nowIso(),
  };
  store.inventory.items.push(item);
  return clone(item);
};

export const demoInventoryUpdateItem = (
  itemId: string,
  tenantId: string,
  payload: Partial<InventoryItem>,
): InventoryItem => {
  const store = getDemoStore();
  const index = store.inventory.items.findIndex(
    (item) => item.id === itemId && item.tenant_id === tenantId,
  );
  if (index === -1) {
    throw new Error("Item no encontrado");
  }
  store.inventory.items[index] = {
    ...store.inventory.items[index],
    ...payload,
  };
  return clone(store.inventory.items[index]);
};

export const demoInventoryDeleteItem = (itemId: string, tenantId: string) => {
  const store = getDemoStore();
  store.inventory.items = store.inventory.items.filter(
    (item) => !(item.id === itemId && item.tenant_id === tenantId),
  );
  store.inventory.movements = store.inventory.movements.filter(
    (movement) => movement.item_id !== itemId || movement.tenant_id !== tenantId,
  );
};

export const demoInventoryListCategories = (tenantId: string): InventoryCategory[] => {
  const store = getDemoStore();
  return clone(store.inventory.categories.filter((c) => c.tenant_id === tenantId));
};

export const demoInventoryCreateCategory = (tenantId: string, name: string): InventoryCategory => {
  const store = getDemoStore();
  const existing = store.inventory.categories.find(
    (c) => c.tenant_id === tenantId && c.name.toLowerCase() === name.toLowerCase(),
  );
  if (existing) {
    return clone(existing);
  }
  const category: InventoryCategory = {
    id: generateId("demo-inv-cat"),
    tenant_id: tenantId,
    name,
  };
  store.inventory.categories.push(category);
  return clone(category);
};

export const demoInventoryDeleteCategory = (categoryId: string, tenantId: string) => {
  const store = getDemoStore();
  store.inventory.categories = store.inventory.categories.filter(
    (c) => !(c.id === categoryId && c.tenant_id === tenantId),
  );
  store.inventory.items = store.inventory.items.map((item) =>
    item.category_id === categoryId && item.tenant_id === tenantId
      ? { ...item, category_id: "" }
      : item,
  );
};

export const demoInventoryListLocations = (tenantId: string): InventoryLocation[] => {
  const store = getDemoStore();
  return clone(store.inventory.locations.filter((l) => l.tenant_id === tenantId));
};

export const demoInventoryCreateLocation = (
  tenantId: string,
  name: string,
): InventoryLocation => {
  const store = getDemoStore();
  const existing = store.inventory.locations.find(
    (l) => l.tenant_id === tenantId && l.name.toLowerCase() === name.toLowerCase(),
  );
  if (existing) {
    return clone(existing);
  }
  const location: InventoryLocation = {
    id: generateId("demo-inv-loc"),
    tenant_id: tenantId,
    name,
  };
  store.inventory.locations.push(location);
  return clone(location);
};

export const demoInventoryDeleteLocation = (locationId: string, tenantId: string) => {
  const store = getDemoStore();
  store.inventory.locations = store.inventory.locations.filter(
    (l) => !(l.id === locationId && l.tenant_id === tenantId),
  );
  store.inventory.items = store.inventory.items.map((item) =>
    item.location_id === locationId && item.tenant_id === tenantId
      ? { ...item, location_id: "" }
      : item,
  );
};

export const demoInventoryListMovements = (
  params: ListMovementsParams,
): InventoryMovement[] => {
  const store = getDemoStore();
  let movements = store.inventory.movements.filter(
    (movement) => movement.tenant_id === params.tenantId,
  );

  if (params.itemId) {
    movements = movements.filter((movement) => movement.item_id === params.itemId);
  }

  movements = [...movements].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  if (typeof params.offset === "number" && typeof params.limit === "number") {
    movements = movements.slice(params.offset, params.offset + params.limit);
  } else if (typeof params.limit === "number") {
    movements = movements.slice(0, params.limit);
  }

  return clone(movements);
};

const adjustItemStock = (itemId: string, tenantId: string, delta: number) => {
  const store = getDemoStore();
  const item = store.inventory.items.find(
    (i) => i.id === itemId && i.tenant_id === tenantId,
  );
  if (!item) {
    throw new Error("Item no encontrado para actualizar stock");
  }
  item.current_stock = Math.max(0, (item.current_stock || 0) + delta);
};

export const demoInventoryCreateMovement = (
  tenantId: string,
  payload: {
    item_id: string;
    type: "IN" | "OUT";
    quantity: number;
    unit_cost?: number;
    reason: string;
    date: string;
    created_by?: string;
  },
): InventoryMovement => {
  if (payload.type === "OUT") {
    adjustItemStock(payload.item_id, tenantId, -Math.abs(payload.quantity));
  } else {
    adjustItemStock(payload.item_id, tenantId, Math.abs(payload.quantity));
  }

  const movement: InventoryMovement = {
    id: generateId("demo-inv-mov"),
    tenant_id: tenantId,
    item_id: payload.item_id,
    date: payload.date,
    type: payload.type,
    quantity: payload.quantity,
    unit_cost: payload.unit_cost ?? null,
    reason: payload.reason,
    ref_module: null,
    ref_id: null,
    created_by: payload.created_by ?? null,
    created_at: nowIso(),
  };

  const store = getDemoStore();
  store.inventory.movements.unshift(movement);
  return clone(movement);
};

export const demoInventoryDeleteMovement = (movementId: string, tenantId: string) => {
  const store = getDemoStore();
  const index = store.inventory.movements.findIndex(
    (movement) => movement.id === movementId && movement.tenant_id === tenantId,
  );
  if (index === -1) {
    return;
  }

  const movement = store.inventory.movements[index];
  const delta = movement.type === "IN" ? -movement.quantity : movement.quantity;
  adjustItemStock(movement.item_id, tenantId, delta);

  store.inventory.movements.splice(index, 1);
};

export const demoInventoryMovementTypes = () => {
  const store = getDemoStore();
  return clone(store.inventory.movementTypes);
};

export const demoInventorySummary = (tenantId: string): InventorySummary => {
  const store = getDemoStore();
  const items = store.inventory.items.filter((item) => item.tenant_id === tenantId);
  const totalItems = items.length;
  const lowStockItems = items.filter((item) => item.current_stock <= item.min_stock).length;

  const lastMovement = store.inventory.movements
    .filter((movement) => movement.tenant_id === tenantId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

  return {
    totalItems,
    lowStockItems,
    lastMovementDate: lastMovement?.date,
  };
};

// Empaque helpers
export const demoEmpaqueRegistros = (tenantId: string): RegistroEmpaque[] => {
  const store = getDemoStore();
  return clone(store.empaque.registros.filter((r) => r.tenantId === tenantId));
};

export const demoEmpaqueCreateRegistro = (
  registro: Omit<RegistroEmpaque, "id" | "kgDescartados">,
): RegistroEmpaque => {
  const store = getDemoStore();
  const nuevo: RegistroEmpaque = {
    ...registro,
    id: generateId("demo-emp"),
    kgDescartados: registro.kgEntraron - registro.kgSalieron,
  };
  store.empaque.registros.push(nuevo);
  return clone(nuevo);
};

export const demoEmpaqueIngresos = (tenantId: string) => {
  const store = getDemoStore();
  return clone(store.empaque.ingresos.filter((i: any) => i.tenant_id === tenantId));
};

export const demoEmpaqueCreateIngreso = (data: any) => {
  const store = getDemoStore();
  const tenantId = data.tenant_id || data.tenantId;
  const ingreso = {
    ...data,
    id: generateId("demo-ing"),
    tenant_id: tenantId,
    tenantId,
  };
  store.empaque.ingresos.unshift(ingreso);
  return clone(ingreso);
};

export const demoEmpaqueEgresos = (tenantId: string) => {
  const store = getDemoStore();
  return clone(store.empaque.egresos.filter((i: any) => i.tenant_id === tenantId));
};

export const demoEmpaqueCreateEgreso = (data: any) => {
  const store = getDemoStore();
  const tenantId = data.tenant_id || data.tenantId;
  const egreso = {
    ...data,
    id: generateId("demo-egr"),
    tenant_id: tenantId,
    tenantId,
  };
  store.empaque.egresos.unshift(egreso);
  return clone(egreso);
};

export const demoEmpaquePallets = (tenantId: string) => {
  const store = getDemoStore();
  return clone(store.empaque.pallets.filter((p: any) => p.tenant_id === tenantId));
};

export const demoEmpaqueCreatePallet = (data: any) => {
  const store = getDemoStore();
  const tenantId = data.tenant_id || data.tenantId;
  const pallet = {
    ...data,
    id: generateId("demo-pallet"),
    tenant_id: tenantId,
    tenantId,
  };
  store.empaque.pallets.unshift(pallet);
  return clone(pallet);
};

export const demoEmpaqueDespachos = (tenantId: string) => {
  const store = getDemoStore();
  return clone(store.empaque.despachos.filter((p: any) => p.tenant_id === tenantId));
};

export const demoEmpaqueCreateDespacho = (data: any) => {
  const store = getDemoStore();
  const tenantId = data.tenant_id || data.tenantId;
  const despacho = {
    ...data,
    id: generateId("demo-despacho"),
    tenant_id: tenantId,
    tenantId,
  };
  store.empaque.despachos.unshift(despacho);
  return clone(despacho);
};

export const demoEmpaquePreprocesos = (tenantId: string) => {
  const store = getDemoStore();
  return clone(store.empaque.preprocesos.filter((p: any) => p.tenant_id === tenantId));
};

export const demoEmpaqueCreatePreproceso = (data: any) => {
  const store = getDemoStore();
  const tenantId = data.tenant_id || data.tenantId;
  const preproceso = {
    ...data,
    id: generateId("demo-pre"),
    tenant_id: tenantId,
    tenantId,
  };
  store.empaque.preprocesos.unshift(preproceso);
  return clone(preproceso);
};

export const demoCampoTareas = (tenantId: string) => {
  const store = getDemoStore();
  return clone(store.campo.tareas.filter((t) => t.tenantId === tenantId));
};

export const demoFarmsList = (tenantId: string): Farm[] => {
  const store = getDemoStore();
  return clone(store.campo.farms.filter((farm) => farm.tenant_id === tenantId));
};

export const demoFarmsGetById = (farmId: string): Farm | null => {
  const store = getDemoStore();
  const farm = store.campo.farms.find((f) => f.id === farmId);
  return farm ? clone(farm) : null;
};

export const demoFarmsCreate = (
  tenantId: string,
  farmData: CreateFarmData,
  userId?: string,
): Farm => {
  const store = getDemoStore();
  const farm: Farm = {
    id: generateId("demo-farm"),
    tenant_id: tenantId,
    name: farmData.name,
    location: farmData.location || null,
    area_ha: farmData.area_ha ?? null,
    default_crop: farmData.default_crop || null,
    notes: farmData.notes || null,
    created_at: nowIso(),
    created_by: userId || "demo-admin",
  };
  store.campo.farms.unshift(farm);
  return clone(farm);
};

export const demoFarmsUpdate = (
  farmId: string,
  updates: Partial<CreateFarmData>,
): Farm => {
  const store = getDemoStore();
  const index = store.campo.farms.findIndex((farm) => farm.id === farmId);
  if (index === -1) {
    throw new Error("Campo no encontrado");
  }
  const current = store.campo.farms[index];
  const next: Farm = { ...current };
  if (updates.name !== undefined) next.name = updates.name;
  if (updates.location !== undefined) next.location = updates.location || null;
  if (updates.area_ha !== undefined) next.area_ha = updates.area_ha ?? null;
  if (updates.default_crop !== undefined) next.default_crop = updates.default_crop || null;
  if (updates.notes !== undefined) next.notes = updates.notes || null;
  store.campo.farms[index] = next;
  return clone(next);
};

export const demoFarmsDelete = (farmId: string) => {
  const store = getDemoStore();
  const lotsToRemove = store.campo.lots.filter((lot) => lot.farm_id === farmId).map((lot) => lot.id);
  store.campo.farms = store.campo.farms.filter((farm) => farm.id !== farmId);
  store.campo.lots = store.campo.lots.filter((lot) => lot.farm_id !== farmId);
  if (lotsToRemove.length > 0) {
    store.campo.tasks = store.campo.tasks.filter((task) => !lotsToRemove.includes(task.lot_id));
  }
};

export const demoLotsByFarm = (farmId: string): Lot[] => {
  const store = getDemoStore();
  return clone(store.campo.lots.filter((lot) => lot.farm_id === farmId));
};

export const demoLotsGetById = (lotId: string): Lot | null => {
  const store = getDemoStore();
  const lot = store.campo.lots.find((l) => l.id === lotId);
  return lot ? clone(lot) : null;
};

export const demoLotsCreate = (
  tenantId: string,
  lotData: CreateLotData,
): Lot => {
  const store = getDemoStore();
  const lot: Lot = {
    id: generateId("demo-lot"),
    tenant_id: tenantId,
    farm_id: lotData.farm_id,
    code: lotData.code,
    crop: lotData.crop,
    variety: lotData.variety || null,
    area_ha: lotData.area_ha ?? null,
    plant_date: lotData.plant_date || null,
    status: lotData.status,
    created_at: nowIso(),
  };
  store.campo.lots.unshift(lot);
  return clone(lot);
};

export const demoLotsUpdate = (
  lotId: string,
  updates: Partial<CreateLotData>,
): Lot => {
  const store = getDemoStore();
  const index = store.campo.lots.findIndex((lot) => lot.id === lotId);
  if (index === -1) {
    throw new Error("Lote no encontrado");
  }
  const current = store.campo.lots[index];
  const next: Lot = { ...current };
  if (updates.farm_id !== undefined) next.farm_id = updates.farm_id;
  if (updates.code !== undefined) next.code = updates.code;
  if (updates.crop !== undefined) next.crop = updates.crop;
  if (updates.variety !== undefined) next.variety = updates.variety || null;
  if (updates.area_ha !== undefined) next.area_ha = updates.area_ha ?? null;
  if (updates.plant_date !== undefined) next.plant_date = updates.plant_date || null;
  if (updates.status !== undefined) next.status = updates.status;
  store.campo.lots[index] = next;
  return clone(next);
};

export const demoLotsDelete = (lotId: string) => {
  const store = getDemoStore();
  store.campo.lots = store.campo.lots.filter((lot) => lot.id !== lotId);
  store.campo.tasks = store.campo.tasks.filter((task) => task.lot_id !== lotId);
};

export const demoLotStatuses = () => {
  const store = getDemoStore();
  return clone(store.campo.lotStatuses);
};

export const demoTasksByLot = (lotId: string): Task[] => {
  const store = getDemoStore();
  const tasks = store.campo.tasks
    .filter((task) => task.lot_id === lotId)
    .sort((a, b) => {
      const aDate = a.scheduled_date ? new Date(a.scheduled_date).getTime() : Number.MAX_SAFE_INTEGER;
      const bDate = b.scheduled_date ? new Date(b.scheduled_date).getTime() : Number.MAX_SAFE_INTEGER;
      return aDate - bDate;
    });
  return clone(tasks);
};

export const demoTasksGetById = (taskId: string): Task | null => {
  const store = getDemoStore();
  const task = store.campo.tasks.find((t) => t.id === taskId);
  return task ? clone(task) : null;
};

export const demoTasksCreate = (
  tenantId: string,
  taskData: CreateTaskData,
  userId?: string,
): Task => {
  const store = getDemoStore();
  const task: Task = {
    id: generateId("demo-task"),
    tenant_id: tenantId,
    farm_id: taskData.farm_id,
    lot_id: taskData.lot_id,
    title: taskData.title,
    description: taskData.description || '',
    type_code: taskData.type_code || 'otro',
    status_code: taskData.status_code || 'pendiente',
    scheduled_date: taskData.scheduled_date || null,
    responsible_membership_id: taskData.responsible_membership_id || null,
    worker_id: taskData.worker_id || null,
    created_at: nowIso(),
  };
  store.campo.tasks.unshift(task);
  return clone(task);
};

export const demoTasksUpdate = (taskId: string, updates: Partial<CreateTaskData>): Task => {
  const store = getDemoStore();
  const index = store.campo.tasks.findIndex((task) => task.id === taskId);
  if (index === -1) {
    throw new Error('Tarea no encontrada');
  }
  const current = store.campo.tasks[index];
  const next: Task = { ...current };
  if (updates.farm_id !== undefined) next.farm_id = updates.farm_id;
  if (updates.lot_id !== undefined) next.lot_id = updates.lot_id;
  if (updates.title !== undefined) next.title = updates.title;
  if (updates.description !== undefined) next.description = updates.description || '';
  if (updates.type_code !== undefined) next.type_code = updates.type_code || 'otro';
  if (updates.status_code !== undefined) next.status_code = updates.status_code;
  if (updates.scheduled_date !== undefined) next.scheduled_date = updates.scheduled_date || null;
  if (updates.responsible_membership_id !== undefined) next.responsible_membership_id = updates.responsible_membership_id || null;
  if (updates.worker_id !== undefined) next.worker_id = updates.worker_id || null;
  store.campo.tasks[index] = next;
  return clone(next);
};

export const demoTasksDelete = (taskId: string) => {
  const store = getDemoStore();
  store.campo.tasks = store.campo.tasks.filter((task) => task.id !== taskId);
};

export const demoTaskStatuses = () => {
  const store = getDemoStore();
  return clone(store.campo.taskStatuses);
};

export const demoTaskTypes = () => {
  const store = getDemoStore();
  return clone(store.campo.taskTypes);
};
