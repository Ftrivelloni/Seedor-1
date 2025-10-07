// lib/plan-features.ts
export interface PlanFeatureConfig {
  planId: string
  planName: string
  price: number
  includedFeatures: string[] // Feature IDs that are included in this plan
  maxUsers: number
  maxFields: number
}

export const PLAN_FEATURE_CONFIGS: PlanFeatureConfig[] = [
  {
    planId: "basic",
    planName: "Básico",
    price: 29.99,
    maxUsers: 3,
    maxFields: 5,
    includedFeatures: [
      // Basic Plan: Dashboard, Empaque, Inventario, Settings, User Management
      "dashboard",
      "empaque",
      "inventario", 
      "ajustes",
      "user_management",
      // Specific empaque features
      "registro_procesada",
      "clasificacion_mercado", 
      "control_lotes_emp",
      // Specific inventario features
      "registro_insumos",
      "ajustes_stock",
      // User management features
      "creacion_trab",
      "rol_trabajador"
    ]
  },
  {
    planId: "pro",
    planName: "Profesional", 
    price: 79.99,
    maxUsers: 10,
    maxFields: 20,
    includedFeatures: [
      // All basic features
      "dashboard",
      "empaque", 
      "inventario",
      "ajustes",
      "user_management",
      "registro_procesada",
      "clasificacion_mercado",
      "control_lotes_emp", 
      "registro_insumos",
      "ajustes_stock",
      "creacion_trab",
      "rol_trabajador",
      // Pro adds Campo functionality
      "campo",
      "tareas_campo",
      "calendario_campo",
      "seguimiento_tareas",
      "rendimiento_lotes",
      // Enhanced features
      "export_excel",
      "control_pallets",
      "alertas_stock",
      "stats_asistencia"
    ]
  },
  {
    planId: "enterprise",
    planName: "Empresarial",
    price: 199.99,
    maxUsers: -1, // Unlimited
    maxFields: -1, // Unlimited
    includedFeatures: [
      // All pro features  
      "dashboard",
      "empaque",
      "inventario", 
      "ajustes",
      "user_management",
      "registro_procesada",
      "clasificacion_mercado",
      "control_lotes_emp",
      "registro_insumos", 
      "ajustes_stock",
      "creacion_trab",
      "rol_trabajador",
      "campo",
      "tareas_campo",
      "calendario_campo", 
      "seguimiento_tareas",
      "rendimiento_lotes",
      "export_excel",
      "control_pallets",
      "alertas_stock",
      "stats_asistencia",
      // Enterprise adds Finanzas functionality
      "finanzas",
      "ingresos_egresos",
      "caja_chica",
      "reportes_financieros",
      // Additional enterprise features
      "contactos",
      "contactos_crm",
      "trabajadores_advanced"
    ]
  }
]

// Helper function to get plan configuration by ID
export function getPlanConfig(planId: string): PlanFeatureConfig | null {
  return PLAN_FEATURE_CONFIGS.find(config => config.planId === planId) || null
}

// Helper function to check if a feature is included in a plan
export function isFeatureIncludedInPlan(featureId: string, planId: string): boolean {
  const config = getPlanConfig(planId)
  return config ? config.includedFeatures.includes(featureId) : false
}

// Helper function to get available upgrade plans
export function getUpgradePlans(currentPlanId: string): PlanFeatureConfig[] {
  const currentIndex = PLAN_FEATURE_CONFIGS.findIndex(p => p.planId === currentPlanId)
  if (currentIndex === -1) return PLAN_FEATURE_CONFIGS
  
  return PLAN_FEATURE_CONFIGS.slice(currentIndex + 1)
}

// Helper function to get the next recommended plan
export function getRecommendedUpgrade(currentPlanId: string): PlanFeatureConfig | null {
  const upgrades = getUpgradePlans(currentPlanId)
  return upgrades.length > 0 ? upgrades[0] : null
}