// /lib/features.ts
export type Feature = {
    id: string;
    title: string;
    module: string;          // grupo / acordeón
    required: boolean;       // amarillas = obligatorias, verdes = opcionales
  };
  
  export const FEATURES: Feature[] = [
    // Gestión de usuarios
    { id: "roles",                title: "Asignación de roles/áreas.",                    module: "Gestión de usuarios", required: true },
    { id: "acceso_roles",         title: "Control de acceso por roles.",                  module: "Gestión de usuarios", required: true },
  
    // Gestión de campo
    { id: "rendimiento_lotes",    title: "Cálculo de rendimientos por lotes.",            module: "Gestión de campo",     required: true },
    { id: "tareas_campo",         title: "Creación y asignación de tareas de campo.",     module: "Gestión de campo",     required: false },
    { id: "calendario_campo",     title: "Calendario de actividades y recordatorios.",    module: "Gestión de campo",     required: false },
    { id: "seguimiento_tareas",   title: "Seguimiento de estado de tareas.",              module: "Gestión de campo",     required: false },
  
    // Gestión de empaque
    { id: "registro_procesada",   title: "Registro de fruta/cosecha procesada.",          module: "Gestión de empaque",    required: true },
    { id: "clasificacion_mercado",title: "Clasificación de mercado vs. descarte.",        module: "Gestión de empaque",    required: true },
    { id: "control_lotes_emp",    title: "Control de lotes.",                             module: "Gestión de empaque",    required: true },
    { id: "export_excel",         title: "Exportación de datos a Excel.",                 module: "Gestión de empaque",    required: false },
    { id: "control_pallets",      title: "Control de pallets (código de barras/QR).",     module: "Gestión de empaque",    required: false },
  
    // Módulo de inventario
    { id: "registro_insumos",     title: "Registro de insumos, pallets, cajas, repuestos.", module: "Módulo de inventario", required: true },
    { id: "ajustes_stock",        title: "Ajustes rápidos de stock (+, −).",              module: "Módulo de inventario", required: true },
    { id: "alertas_stock",        title: "Alertas de bajo stock.",                        module: "Módulo de inventario", required: false },
  
    // Gestión de finanzas
    { id: "ingresos_egresos",     title: "Registro de ingresos y egresos.",               module: "Gestión de finanzas",  required: true },
    { id: "caja_chica",           title: "Manejo de la caja chica.",                      module: "Gestión de finanzas",  required: false },
  
    // Gestión de trabajadores
    { id: "creacion_trab",        title: "Creación de trabajadores.",                     module: "Gestión de trabajadores", required: true },
    { id: "rol_trabajador",       title: "Asignación de rol del trabajador.",             module: "Gestión de trabajadores", required: true },
    { id: "stats_asistencia",     title: "Stats de asistencia.",                          module: "Gestión de trabajadores", required: false },
  
    // Apartado de contactos
    { id: "contactos_crm",        title: "Registrar y consultar contactos asociados.",    module: "Apartado de contactos", required: false },
  ];
  
  export const MODULES = Array.from(new Set(FEATURES.map(f => f.module)));
  
  export const REQUIRED_IDS = FEATURES.filter(f => f.required).map(f => f.id);
  