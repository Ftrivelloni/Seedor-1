export interface Tenant {
  id: string
  nombre: string
  tipo: string
}

export interface Usuario {
  id: string
  email: string
  nombre: string
  tenantId: string
  rol: "Admin" | "Campo" | "Empaque" | "Finanzas"
}

export interface TareaCampo {
  id: string
  tenantId: string
  lote: string
  cultivo: string
  tipo: "insecticida" | "fertilizante" | "poda" | "riego" | "cosecha"
  descripcion: string
  fechaProgramada: string
  responsable: string
  estado: "pendiente" | "en-curso" | "completada"
  notas?: string
  fechaCreacion: string
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

export interface ItemInventario {
  id: string
  tenantId: string
  nombre: string
  categoria: "insumos" | "pallets" | "cajas" | "maquinaria" | "herramientas"
  stock: number
  stockMinimo: number
  unidad: string
  ubicacion?: string
}

export interface MovimientoCaja {
  id: string
  tenantId: string
  fecha: string
  tipo: "ingreso" | "egreso"
  monto: number
  concepto: string
  comprobante?: string
  categoria: string
}

// Mock data
export const tenants: Tenant[] = [
  { id: "t-la-toma", nombre: "La Toma S.A.", tipo: "citricos" },
  { id: "t-campo-norte", nombre: "Campo Norte", tipo: "cereales" },
]

export const usuarios: Usuario[] = [
  { id: "u1", email: "admin@latoma.com", nombre: "Carlos Mendoza", tenantId: "t-la-toma", rol: "Admin" },
  { id: "u2", email: "campo@latoma.com", nombre: "María García", tenantId: "t-la-toma", rol: "Campo" },
  { id: "u3", email: "empaque@latoma.com", nombre: "José Rodríguez", tenantId: "t-la-toma", rol: "Empaque" },
  { id: "u4", email: "finanzas@latoma.com", nombre: "Ana López", tenantId: "t-la-toma", rol: "Finanzas" },
  { id: "u5", email: "admin@camponorte.com", nombre: "Pedro Sánchez", tenantId: "t-campo-norte", rol: "Admin" },
]

export const tareasCampo: TareaCampo[] = [
  {
    id: "tc1",
    tenantId: "t-la-toma",
    lote: "Lote A-1",
    cultivo: "Naranjas",
    tipo: "fertilizante",
    descripcion: "Aplicación de fertilizante NPK",
    fechaProgramada: "2024-01-15",
    responsable: "María García",
    estado: "pendiente",
    notas: "Aplicar en horas de la mañana",
    fechaCreacion: "2024-01-10",
  },
  {
    id: "tc2",
    tenantId: "t-la-toma",
    lote: "Lote B-2",
    cultivo: "Limones",
    tipo: "poda",
    descripcion: "Poda de formación",
    fechaProgramada: "2024-01-12",
    responsable: "Juan Pérez",
    estado: "en-curso",
    fechaCreacion: "2024-01-08",
  },
  // Tasks for the actual current tenant
  {
    id: "tc3",
    tenantId: "3cf2ce34-75e0-46f9-96e3-928391552291",
    lote: "Campo Norte",
    cultivo: "Frutillas",
    tipo: "riego",
    descripcion: "Riego profundo sector norte",
    fechaProgramada: "2025-09-23",
    responsable: "Juan Perez",
    estado: "pendiente",
    notas: "Verificar presión de agua",
    fechaCreacion: "2025-09-22",
  },
  {
    id: "tc4",
    tenantId: "3cf2ce34-75e0-46f9-96e3-928391552291",
    lote: "Campo Sur",
    cultivo: "Frutillas",
    tipo: "fertilizante",
    descripcion: "Aplicación de fertilizante orgánico",
    fechaProgramada: "2025-09-24",
    responsable: "Juan Perez",
    estado: "pendiente",
    fechaCreacion: "2025-09-22",
  },
  {
    id: "tc5",
    tenantId: "3cf2ce34-75e0-46f9-96e3-928391552291",
    lote: "Invernadero 1",
    cultivo: "Frutillas",
    tipo: "poda",
    descripcion: "Poda sanitaria y de formación",
    fechaProgramada: "2025-09-22",
    responsable: "Juan Perez",
    estado: "completada",
    fechaCreacion: "2025-09-20",
  },
  {
    id: "tc6",
    tenantId: "3cf2ce34-75e0-46f9-96e3-928391552291",
    lote: "Campo Este",
    cultivo: "Frutillas",
    tipo: "insecticida",
    descripcion: "Control preventivo de plagas",
    fechaProgramada: "2025-09-25",
    responsable: "Juan Perez",
    estado: "pendiente",
    notas: "Aplicar en horas tempranas",
    fechaCreacion: "2025-09-22",
  },
]

export const registrosEmpaque: RegistroEmpaque[] = [
  {
    id: "re1",
    tenantId: "t-la-toma",
    fecha: "2024-01-10",
    cultivo: "Naranjas",
    kgEntraron: 1000,
    kgSalieron: 850,
    kgDescartados: 150,
    notas: "Descarte por tamaño pequeño",
  },
]

export const inventario: ItemInventario[] = [
  {
    id: "inv1",
    tenantId: "t-la-toma",
    nombre: "Fertilizante NPK",
    categoria: "insumos",
    stock: 50,
    stockMinimo: 20,
    unidad: "kg",
    ubicacion: "Bodega A",
  },
  {
    id: "inv2",
    tenantId: "t-la-toma",
    nombre: "Cajas de cartón",
    categoria: "cajas",
    stock: 5,
    stockMinimo: 50,
    unidad: "unidades",
    ubicacion: "Bodega B",
  },
]

export const movimientosCaja: MovimientoCaja[] = [
  {
    id: "mc1",
    tenantId: "t-la-toma",
    fecha: "2024-01-10",
    tipo: "egreso",
    monto: 25000,
    concepto: "Compra de fertilizante",
    categoria: "Insumos",
    comprobante: "factura-001.pdf",
  },
  {
    id: "mc2",
    tenantId: "t-la-toma",
    fecha: "2024-01-09",
    tipo: "ingreso",
    monto: 150000,
    concepto: "Venta de naranjas",
    categoria: "Ventas",
  },
]
