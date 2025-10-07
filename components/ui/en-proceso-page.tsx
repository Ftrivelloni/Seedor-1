"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Clock, Wrench } from "lucide-react"

interface EnProcesoPageProps {
  moduleName: string
  description?: string
}

export function EnProcesoPage({ moduleName, description }: EnProcesoPageProps) {
  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="relative">
                <Wrench className="h-16 w-16 text-orange-500" />
                <Clock className="h-6 w-6 text-orange-600 absolute -bottom-1 -right-1" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-orange-700">
              Módulo en Proceso
            </CardTitle>
            <CardDescription className="text-lg mt-2">
              {moduleName}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 px-4 py-2">
              <Clock className="h-4 w-4 mr-2" />
              En Desarrollo
            </Badge>
            <p className="text-muted-foreground max-w-md mx-auto">
              {description || 
                `Estamos trabajando en este módulo para brindarte la mejor experiencia. 
                 Pronto estará disponible con todas sus funcionalidades.`
              }
            </p>
            <div className="pt-4">
              <p className="text-sm text-muted-foreground">
                ¿Tienes alguna sugerencia para este módulo?{" "}
                <a 
                  href="/contactenos" 
                  className="text-orange-600 hover:text-orange-700 underline"
                >
                  Contáctanos
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}