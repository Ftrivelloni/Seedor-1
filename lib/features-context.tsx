import { useEffect, useState } from 'react'
import type { AuthUser } from '../lib/supabaseAuth'

// Function to get features based on plan
function getPlanFeatures(planName: string): TenantFeature[] {
  const plan = planName.toLowerCase()
  
  const baseFeatures: TenantFeature[] = [
    { feature_code: 'dashboard', feature_name: 'Dashboard', is_enabled: true },
    { feature_code: 'empaque', feature_name: 'Gestión de Empaque', is_enabled: true },
    { feature_code: 'inventario', feature_name: 'Gestión de Inventario', is_enabled: true },
    { feature_code: 'ajustes', feature_name: 'Configuración', is_enabled: true },
    { feature_code: 'user_management', feature_name: 'Gestión de Usuarios', is_enabled: true },
    { feature_code: 'trabajadores', feature_name: 'Gestión de Trabajadores', is_enabled: true, limit_value: 3 },
  ]

  if (plan === 'basic' || plan === 'basico') {
    return [
      ...baseFeatures,
      { feature_code: 'campo', feature_name: 'Gestión de Campo', is_enabled: false },
      { feature_code: 'finanzas', feature_name: 'Gestión de Finanzas', is_enabled: false },
      { feature_code: 'contactos', feature_name: 'Gestión de Contactos', is_enabled: false },
    ]
  }

  if (plan === 'pro') {
    return [
      ...baseFeatures,
      { feature_code: 'campo', feature_name: 'Gestión de Campo', is_enabled: true },
      { feature_code: 'finanzas', feature_name: 'Gestión de Finanzas', is_enabled: false },
      { feature_code: 'contactos', feature_name: 'Gestión de Contactos', is_enabled: false },
    ]
  }

  if (plan === 'enterprise' || plan === 'empresarial') {
    return [
      ...baseFeatures,
      { feature_code: 'campo', feature_name: 'Gestión de Campo', is_enabled: true },
      { feature_code: 'finanzas', feature_name: 'Gestión de Finanzas', is_enabled: true },
      { feature_code: 'contactos', feature_name: 'Gestión de Contactos', is_enabled: true },
    ]
  }

  // Default to basic plan features
  return [
    ...baseFeatures,
    { feature_code: 'campo', feature_name: 'Gestión de Campo', is_enabled: false },
    { feature_code: 'finanzas', feature_name: 'Gestión de Finanzas', is_enabled: false },
    { feature_code: 'contactos', feature_name: 'Gestión de Contactos', is_enabled: false },
  ]
}

export interface TenantFeature {
  feature_code: string
  feature_name: string
  is_enabled: boolean
  limit_value?: number
}

export interface PlanInfo {
  plan_name: string
  plan_display_name: string
  price_monthly: number
  price_yearly: number
  current_users: number
  max_users: number
  plan_expires_at?: string
  plan_active: boolean
}

interface FeatureContextType {
  features: TenantFeature[]
  planInfo: PlanInfo | null
  hasFeature: (featureCode: string) => boolean
  canAccessModule: (module: string, userRole: string) => boolean
  isLoading: boolean
  refreshFeatures: () => Promise<void>
}

import { createContext, useContext } from 'react'

const FeatureContext = createContext<FeatureContextType | null>(null)

export function useFeatures() {
  const context = useContext(FeatureContext)
  if (!context) {
    throw new Error('useFeatures must be used within a FeatureProvider')
  }
  return context
}

interface FeatureProviderProps {
  children: React.ReactNode
  user: AuthUser
}

export function FeatureProvider({ children, user }: FeatureProviderProps) {
  const [features, setFeatures] = useState<TenantFeature[]>([])
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadFeatures = async () => {
    try {
      setIsLoading(true)
      
      // Use tenant plan from user object instead of API call
      const tenantPlan = user.tenant?.plan || 'basic'
      
      // Load tenant features based on plan
      const planFeatures = getPlanFeatures(tenantPlan)
      setFeatures(planFeatures)

      // Set plan info based on tenant plan
      const planDisplayNames = {
        'basic': 'Plan Básico',
        'basico': 'Plan Básico', 
        'pro': 'Plan Profesional',
        'enterprise': 'Plan Empresarial',
        'empresarial': 'Plan Empresarial'
      }
      
      const planPrices = {
        'basic': 29.99,
        'basico': 29.99,
        'pro': 79.99, 
        'enterprise': 199.99,
        'empresarial': 199.99
      }

      setPlanInfo({
        plan_name: tenantPlan,
        plan_display_name: planDisplayNames[tenantPlan as keyof typeof planDisplayNames] || 'Plan Básico',
        price_monthly: planPrices[tenantPlan as keyof typeof planPrices] || 29.99,
        price_yearly: (planPrices[tenantPlan as keyof typeof planPrices] || 29.99) * 10,
        current_users: 1,
        max_users: tenantPlan === 'enterprise' || tenantPlan === 'empresarial' ? -1 : (tenantPlan === 'pro' ? 10 : 3),
        plan_active: true
      })
    } catch (error) {
      console.error('Error loading features:', error)
      // Set minimal fallback features
      setFeatures([
        { feature_code: 'campo', feature_name: 'Gestión de Campo', is_enabled: true },
        { feature_code: 'inventario', feature_name: 'Gestión de Inventario', is_enabled: true }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      loadFeatures()
    }
  }, [user])

  const hasFeature = (featureCode: string): boolean => {
    const feature = features.find(f => f.feature_code === featureCode)
    return feature?.is_enabled || false
  }

  // Role-based access control matrix
  const roleModuleAccess: Record<string, string[]> = {
    admin: ['dashboard', 'campo', 'empaque', 'finanzas', 'inventario', 'trabajadores', 'contactos', 'ajustes', 'user_management'],
    campo: ['dashboard', 'campo', 'inventario', 'trabajadores', 'ajustes'],
    empaque: ['dashboard', 'empaque', 'inventario', 'trabajadores', 'ajustes'],
    finanzas: ['dashboard', 'finanzas', 'inventario', 'trabajadores', 'ajustes']
  }

  const canAccessModule = (module: string, userRole: string): boolean => {
    const moduleKey = module.toLowerCase()
    const userRoleKey = userRole.toLowerCase()
    
    // First check if user role allows access to this module
    const roleAllowed = roleModuleAccess[userRoleKey]?.includes(moduleKey) || false
    
    // Then check if tenant plan includes this feature
    const featureEnabled = hasFeature(moduleKey)
    
    // Special case: user_management is only for admins
    if (moduleKey === 'user_management') {
      return userRoleKey === 'admin' && featureEnabled
    }
    
    // Both role and plan must allow access
    return roleAllowed && featureEnabled
  }

  const refreshFeatures = async () => {
    await loadFeatures()
  }

  const value: FeatureContextType = {
    features,
    planInfo,
    hasFeature,
    canAccessModule,
    isLoading,
    refreshFeatures
  }

  return (
    <FeatureContext.Provider value={value}>
      {children}
    </FeatureContext.Provider>
  )
}

// Hook for checking specific feature access
export function useFeatureAccess(featureCode: string) {
  const { hasFeature, isLoading } = useFeatures()
  return {
    hasAccess: hasFeature(featureCode),
    isLoading
  }
}

// Hook for checking module access based on user role and plan
export function useModuleAccess(module: string, userRole: string) {
  const { canAccessModule, isLoading } = useFeatures()
  return {
    hasAccess: canAccessModule(module, userRole),
    isLoading
  }
}

// Component for conditionally rendering based on features
interface FeatureGateProps {
  feature: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function FeatureGate({ feature, children, fallback = null }: FeatureGateProps) {
  const { hasFeature, isLoading } = useFeatures()

  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 h-4 w-full rounded"></div>
  }

  return hasFeature(feature) ? <>{children}</> : <>{fallback}</>
}

// Component for role + feature based rendering
interface ModuleGateProps {
  module: string
  userRole: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ModuleGate({ module, userRole, children, fallback = null }: ModuleGateProps) {
  const { canAccessModule, isLoading } = useFeatures()

  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 h-4 w-full rounded"></div>
  }

  return canAccessModule(module, userRole) ? <>{children}</> : <>{fallback}</>
}

// Component for displaying plan upgrade prompts
interface PlanUpgradePromptProps {
  feature: string
  children?: React.ReactNode
}

export function PlanUpgradePrompt({ feature, children }: PlanUpgradePromptProps) {
  const { hasFeature, planInfo } = useFeatures()

  if (hasFeature(feature)) {
    return <>{children}</>
  }

  const featureNames: Record<string, string> = {
    empaque: 'Gestión de Empaque',
    finanzas: 'Gestión de Finanzas',
    advanced_reports: 'Reportes Avanzados',
    api_access: 'Acceso API',
    custom_integrations: 'Integraciones Personalizadas'
  }

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
      <div className="max-w-sm mx-auto">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {featureNames[feature] || feature} no disponible
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Esta funcionalidad requiere un plan superior. Tu plan actual es {planInfo?.plan_display_name || 'Básico'}.
        </p>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
          Actualizar Plan
        </button>
      </div>
    </div>
  )
}