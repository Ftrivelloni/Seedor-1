import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { Alert, AlertDescription } from '../ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { Crown, Check, X, Users, HardDrive, Zap, ArrowUp, ArrowDown, Calendar, DollarSign } from 'lucide-react'
import { toast } from '../../hooks/use-toast'
import type { AuthUser } from '../../lib/supabaseAuth'
import { useFeatures, type PlanInfo, type TenantFeature } from '../../lib/features-context'

interface Plan {
  id: string
  name: string
  display_name: string
  description: string
  price_monthly: number
  price_yearly: number
  max_users: number
  max_storage_gb: number
  is_active: boolean
  sort_order: number
}

interface PlanManagementProps {
  currentUser: AuthUser
}

const planColors = {
  basic: 'bg-gray-100 text-gray-800 border-gray-200',
  pro: 'bg-blue-100 text-blue-800 border-blue-200',
  enterprise: 'bg-purple-100 text-purple-800 border-purple-200'
}

const planIcons = {
  basic: Crown,
  pro: Zap,
  enterprise: Crown
}

export function PlanManagement({ currentUser }: PlanManagementProps) {
  const { planInfo, features, refreshFeatures } = useFeatures()
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [isUpgradeLoading, setIsUpgradeLoading] = useState(false)

  useEffect(() => {
    loadAvailablePlans()
  }, [])

  const loadAvailablePlans = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/plans')
      if (response.ok) {
        const data = await response.json()
        setAvailablePlans(data.plans || [])
      } else {
        setAvailablePlans([
          {
            id: '1',
            name: 'basic',
            display_name: 'Plan Básico',
            description: 'Plan básico para pequeñas operaciones agrícolas. Incluye gestión de campo e inventario.',
            price_monthly: 29.99,
            price_yearly: 299.99,
            max_users: 3,
            max_storage_gb: 5,
            is_active: true,
            sort_order: 1
          },
          {
            id: '2',
            name: 'pro',
            display_name: 'Plan Profesional',
            description: 'Plan completo para medianas empresas agrícolas. Incluye todas las funcionalidades.',
            price_monthly: 79.99,
            price_yearly: 799.99,
            max_users: 10,
            max_storage_gb: 50,
            is_active: true,
            sort_order: 2
          },
          {
            id: '3',
            name: 'enterprise',
            display_name: 'Plan Empresarial',
            description: 'Plan avanzado para grandes operaciones con integraciones personalizadas.',
            price_monthly: 199.99,
            price_yearly: 1999.99,
            max_users: 999,
            max_storage_gb: 500,
            is_active: true,
            sort_order: 3
          }
        ])
      }
    } catch (error) {
      console.error('Error loading plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePlanUpgrade = async (plan: Plan) => {
    setIsUpgradeLoading(true)
    
    try {
      const response = await fetch(`/api/tenants/${currentUser.tenantId}/upgrade-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          plan_id: plan.id,
          billing_cycle: billingCycle
        })
      })

      if (response.ok) {
        toast({
          title: "Plan actualizado",
          description: `Tu plan ha sido actualizado a ${plan.display_name} exitosamente.`
        })
        setUpgradeModalOpen(false)
        await refreshFeatures()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || "Error al actualizar el plan",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error upgrading plan:', error)
      toast({
        title: "Error",
        description: "Error de conexión al actualizar el plan",
        variant: "destructive"
      })
    } finally {
      setIsUpgradeLoading(false)
    }
  }

  const getCurrentPlan = () => {
    return availablePlans.find(plan => plan.name === planInfo?.plan_name)
  }

  const getFeaturesByModule = () => {
    const modules: Record<string, TenantFeature[]> = {}
    
    features.forEach(feature => {
      const moduleName = feature.feature_name.split(' ')[2] || 'General' // Extract module from name
      if (!modules[moduleName]) {
        modules[moduleName] = []
      }
      modules[moduleName].push(feature)
    })
    
    return modules
  }

  const isPlanUpgrade = (targetPlan: Plan) => {
    const currentPlan = getCurrentPlan()
    return currentPlan ? targetPlan.sort_order > currentPlan.sort_order : true
  }

  const isPlanDowngrade = (targetPlan: Plan) => {
    const currentPlan = getCurrentPlan()
    return currentPlan ? targetPlan.sort_order < currentPlan.sort_order : false
  }

  const currentPlan = getCurrentPlan()
  const featuresByModule = getFeaturesByModule()

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Current Plan Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Plan Actual
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {planInfo && currentPlan ? (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{planInfo.plan_display_name}</h3>
                  <Badge className={planColors[currentPlan.name as keyof typeof planColors]}>
                    {currentPlan.name.toUpperCase()}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Usuarios:</span>
                    <span>{planInfo.current_users} / {planInfo.max_users}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Precio mensual:</span>
                    <span className="font-medium">${currentPlan.price_monthly}/mes</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Estado:</span>
                    <Badge variant={planInfo.plan_active ? 'default' : 'destructive'}>
                      {planInfo.plan_active ? 'Activo' : 'Expirado'}
                    </Badge>
                  </div>
                  
                  {planInfo.plan_expires_at && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Renovación:</span>
                      <span>{new Date(planInfo.plan_expires_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">Información del plan no disponible</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Uso de Recursos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {planInfo ? (
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Usuarios</span>
                    <span>{planInfo.current_users}/{planInfo.max_users}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(planInfo.current_users / planInfo.max_users) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Almacenamiento</span>
                    <span>2.3/{currentPlan?.max_storage_gb || 5} GB</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${(2.3 / (currentPlan?.max_storage_gb || 5)) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Información de uso no disponible</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Funcionalidades Incluidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.feature_code} className="flex items-center gap-2">
                {feature.is_enabled ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <X className="h-4 w-4 text-red-600" />
                )}
                <span className={`text-sm ${feature.is_enabled ? 'text-gray-900' : 'text-gray-400'}`}>
                  {feature.feature_name}
                  {feature.limit_value && (
                    <span className="text-xs text-muted-foreground ml-1">
                      (máx {feature.limit_value})
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Planes Disponibles</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant={billingCycle === 'monthly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setBillingCycle('monthly')}
            >
              Mensual
            </Button>
            <Button
              variant={billingCycle === 'yearly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setBillingCycle('yearly')}
            >
              Anual <Badge variant="secondary" className="ml-1">-17%</Badge>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {availablePlans.map((plan) => {
              const PlanIcon = planIcons[plan.name as keyof typeof planIcons] || Crown
              const isCurrentPlan = plan.name === planInfo?.plan_name
              const price = billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly / 12
              
              return (
                <Card key={plan.id} className={`relative ${isCurrentPlan ? 'ring-2 ring-blue-500' : ''}`}>
                  {isCurrentPlan && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      <Badge>Plan Actual</Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center">
                    <div className="flex justify-center mb-2">
                      <PlanIcon className="h-8 w-8 text-blue-600" />
                    </div>
                    <CardTitle className="text-lg">{plan.display_name}</CardTitle>
                    <div className="text-2xl font-bold">
                      ${price.toFixed(2)}
                      <span className="text-base font-normal text-muted-foreground">/mes</span>
                    </div>
                    {billingCycle === 'yearly' && (
                      <p className="text-sm text-green-600">
                        Facturado anualmente (${plan.price_yearly})
                      </p>
                    )}
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4" />
                        <span>Hasta {plan.max_users === 999 ? 'ilimitados' : plan.max_users} usuarios</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <HardDrive className="h-4 w-4" />
                        <span>{plan.max_storage_gb} GB de almacenamiento</span>
                      </div>
                    </div>
                    
                    {!isCurrentPlan && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            className="w-full" 
                            variant={isPlanUpgrade(plan) ? 'default' : 'outline'}
                            onClick={() => setSelectedPlan(plan)}
                          >
                            {isPlanUpgrade(plan) && <ArrowUp className="h-4 w-4 mr-2" />}
                            {isPlanDowngrade(plan) && <ArrowDown className="h-4 w-4 mr-2" />}
                            {isPlanUpgrade(plan) ? 'Actualizar' : isPlanDowngrade(plan) ? 'Cambiar' : 'Seleccionar'}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>
                              {isPlanUpgrade(plan) ? 'Actualizar' : 'Cambiar'} a {plan.display_name}
                            </DialogTitle>
                          </DialogHeader>
                          
                          <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                              {isPlanUpgrade(plan) 
                                ? `¿Estás seguro de que quieres actualizar a ${plan.display_name}?`
                                : `¿Estás seguro de que quieres cambiar a ${plan.display_name}?`
                              }
                            </p>
                            
                            <div className="border rounded-lg p-4 space-y-2">
                              <div className="flex justify-between">
                                <span>Plan:</span>
                                <span className="font-medium">{plan.display_name}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Precio:</span>
                                <span className="font-medium">
                                  ${billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly}
                                  /{billingCycle === 'monthly' ? 'mes' : 'año'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Usuarios:</span>
                                <span className="font-medium">
                                  {plan.max_users === 999 ? 'Ilimitados' : plan.max_users}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => setUpgradeModalOpen(false)}
                              >
                                Cancelar
                              </Button>
                              <Button
                                className="flex-1"
                                onClick={() => handlePlanUpgrade(plan)}
                                disabled={isUpgradeLoading}
                              >
                                {isUpgradeLoading ? 'Procesando...' : 'Confirmar'}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {planInfo && planInfo.current_users >= planInfo.max_users && (
        <Alert>
          <Users className="h-4 w-4" />
          <AlertDescription>
            Has alcanzado el límite de usuarios para tu plan actual ({planInfo.max_users} usuarios). 
            Considera actualizar tu plan para agregar más usuarios.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}