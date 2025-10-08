"use client"
//prueba a ver si estoy en repo bien
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { Clock, Wrench, Sprout, Plus } from "lucide-react"

export function CampoEnProcesoPage() {
  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="relative">
                <Sprout className="h-16 w-16 text-green-500" />
                <Clock className="h-6 w-6 text-orange-600 absolute -bottom-1 -right-1" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-green-700">
              Módulo Campo en Desarrollo
            </CardTitle>
            <CardDescription className="text-lg mt-2">
              Gestión de Campos y Lotes
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 px-4 py-2">
              <Wrench className="h-4 w-4 mr-2" />
              Configurando Base de Datos
            </Badge>
            <p className="text-muted-foreground max-w-md mx-auto">
              Estamos configurando las tablas de la base de datos y las APIs necesarias 
              para gestionar campos, lotes y cultivos. Este módulo permitirá:
            </p>
            <div className="text-left max-w-md mx-auto space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Plus className="h-3 w-3 text-green-600" />
                Crear y gestionar campos
              </div>
              <div className="flex items-center gap-2">
                <Plus className="h-3 w-3 text-green-600" />
                Organizar lotes por campo
              </div>
              <div className="flex items-center gap-2">
                <Plus className="h-3 w-3 text-green-600" />
                Planificar cultivos y rotaciones
              </div>
              <div className="flex items-center gap-2">
                <Plus className="h-3 w-3 text-green-600" />
                Seguimiento de actividades agrícolas
              </div>
            </div>
            <div className="pt-4">
              <p className="text-sm text-muted-foreground">
                ¿Tienes sugerencias para el módulo de campo?{" "}
                <a 
                  href="/contactenos" 
                  className="text-green-600 hover:text-green-700 underline"
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