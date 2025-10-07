"use client"
import { useState } from "react"
import { Check, Crown, Star, Zap } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"

export interface SubscriptionPlan {
  id: string
  name: string
  price: number
  description: string
  features: string[]
  maxUsers: number
  maxFields: number
  icon: React.ReactNode
  popular?: boolean
  enterprise?: boolean
}

const PLANS: SubscriptionPlan[] = [
  {
    id: "basic",
    name: "Básico",
    price: 29.99,
    description: "Perfecto para pequeños productores que recién comienzan",
    maxUsers: 3,
    maxFields: 5,
    icon: <Star className="h-5 w-5" />,
    features: [
      "Gestión básica de campo",
      "Control de inventario",
      "Registro de trabajadores",
      "Hasta 3 usuarios",
      "Hasta 5 campos/lotes",
      "Reportes básicos",
      "Soporte por email"
    ]
  },
  {
    id: "pro",
    name: "Profesional",
    price: 79.99,
    description: "Para productores medianos que buscan mayor control y análisis",
    maxUsers: 10,
    maxFields: 20,
    icon: <Zap className="h-5 w-5" />,
    popular: true,
    features: [
      "Todo lo del plan Básico",
      "Gestión avanzada de empaque",
      "Control de pallets con códigos QR",
      "Gestión de finanzas completa",
      "Hasta 10 usuarios",
      "Hasta 20 campos/lotes",
      "Calendario y recordatorios",
      "Exportación avanzada",
      "Reportes detallados",
      "Soporte prioritario"
    ]
  },
  {
    id: "enterprise",
    name: "Empresarial",
    price: 199.99,
    description: "Para grandes operaciones que necesitan funcionalidades empresariales",
    maxUsers: -1, 
    maxFields: -1, 
    icon: <Crown className="h-5 w-5" />,
    enterprise: true,
    features: [
      "Todo lo del plan Profesional",
      "Usuarios ilimitados",
      "Campos/lotes ilimitados",
      "CRM de contactos avanzado",
      "Alertas automáticas de stock",
      "Estadísticas de asistencia",
      "API personalizada",
      "Integraciones avanzadas",
      "Soporte telefónico 24/7",
      "Onboarding personalizado"
    ]
  }
]

interface PlanSelectorProps {
  selectedPlan: string
  onPlanSelect: (planId: string) => void
}

export function PlanSelector({ selectedPlan, onPlanSelect }: PlanSelectorProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(price)
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Selecciona tu plan</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Puedes cambiar de plan después de registrarte
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((plan) => (
          <Card 
            key={plan.id}
            className={`relative cursor-pointer transition-all hover:shadow-md ${
              selectedPlan === plan.id 
                ? 'ring-2 ring-primary shadow-md' 
                : 'hover:border-primary/50'
            } ${plan.popular ? 'border-primary' : ''}`}
            onClick={() => onPlanSelect(plan.id)}
          >
            {plan.popular && (
              <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary">
                Más Popular
              </Badge>
            )}
            
            <CardHeader className="text-center pb-3">
              <div className={`mx-auto w-10 h-10 rounded-full flex items-center justify-center ${
                plan.enterprise ? 'bg-purple-100 text-purple-600' :
                plan.popular ? 'bg-primary/10 text-primary' :
                'bg-blue-100 text-blue-600'
              }`}>
                {plan.icon}
              </div>
              
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <div className="space-y-1">
                <div className="text-2xl font-bold">
                  {formatPrice(plan.price)}
                  <span className="text-sm font-normal text-muted-foreground">/mes</span>
                </div>
                <CardDescription className="text-xs">
                  {plan.description}
                </CardDescription>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-2">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>Usuarios: {plan.maxUsers === -1 ? 'Ilimitados' : plan.maxUsers}</div>
                  <div>Campos: {plan.maxFields === -1 ? 'Ilimitados' : plan.maxFields}</div>
                </div>
              </div>

              <Button 
                type="button"
                variant={selectedPlan === plan.id ? "default" : "outline"}
                className="w-full mt-4"
                onClick={(e) => {
                  e.stopPropagation()
                  onPlanSelect(plan.id)
                }}
              >
                {selectedPlan === plan.id ? 'Seleccionado' : 'Seleccionar'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="text-center text-xs text-muted-foreground">
        <p>Todos los planes incluyen soporte técnico y actualizaciones gratuitas</p>
        <p className="mt-1">Precios en USD. Contacta con ventas para cotizaciones personalizadas.</p>
      </div>
    </div>
  )
}

export { PLANS }