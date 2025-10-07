"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import { Button } from "./ui/button"
import { cn } from "../lib/utils"
import type { AuthUser } from "../lib/auth"
import { useEffect } from "react"
import { useFeatures, ModuleGate } from "../lib/features-context"
import {
  LayoutDashboard,
  Sprout,
  Package,
  Warehouse,
  DollarSign,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Users,
  Contact2,
  UserPlus,
  Crown,
} from "lucide-react"

interface SidebarProps {
  user: AuthUser
  onLogout: () => void
  onNavigate: (page: string) => void
  currentPage: string
}

interface NavItem {
  title: string
  icon: React.ComponentType<{ className?: string }>
  page: string
  module: string
  requiresFeature?: string
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    page: "dashboard",
    module: "dashboard"
  },
  {
    title: "Empaque",
    icon: Package,
    page: "empaque",
    module: "empaque"
  },
  {
    title: "Inventario",
    icon: Warehouse,
    page: "inventario",
    module: "inventario"
  },
  {
    title: "Trabajadores",
    icon: Users,
    page: "trabajadores",
    module: "trabajadores"
  },
  {
    title: "Usuarios",
    icon: UserPlus,
    page: "usuarios",
    module: "user_management",
    adminOnly: true
  },
  {
    title: "Campo",
    icon: Sprout,
    page: "campo",
    module: "campo"
  },
  {
    title: "Finanzas",
    icon: DollarSign,
    page: "finanzas",
    module: "finanzas"
  },
  {
    title: "Contactos",
    icon: Contact2,
    page: "contactos",
    module: "contactos"
  },
  {
    title: "Ajustes",
    icon: Settings,
    page: "ajustes",
    module: "ajustes"
  },
]

export function Sidebar({ user, onLogout, onNavigate, currentPage }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { canAccessModule, planInfo } = useFeatures()

  // Log when user or user.rol is undefined
  useEffect(() => {
    if (!user) {
      console.log("Sidebar: user is undefined");
    } else if (!user.rol) {
      console.log("Sidebar: user.rol is undefined", user);
    }
  }, [user]);

  // Si no hay usuario, mostrar una versión simplificada del sidebar
  if (!user || !user.rol) {
    // Es posible que estemos en proceso de logout, mostrar un sidebar mínimo
    console.log("Sidebar: Rendering simplified version due to missing user or role");
    return (
      <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-300 w-64">
        <div className="p-4 border-b border-sidebar-border">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <Image
              src="/seedor-logo-no-bg.png"
              alt="Seedor"
              width={40}
              height={40}
              className="rounded"
            />
            <span className="text-xl font-semibold text-sidebar-foreground">
              Seedor
            </span>
          </div>
        </div>
        <div className="flex-1"></div>
        <div className="p-4 border-t border-sidebar-border">
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4 mr-3" />
            <span>Cerrar sesión</span>
          </Button>
        </div>
      </div>
    )
  }
  
  // Ensure user and user.rol are defined before filtering (extra defensive check)
  const userRole = user?.rol?.toLowerCase() || 'admin';
  
  // Filtrar elementos que el usuario no puede ver por su rol
  const filteredNavItems = navItems.filter((item) => {
    try {
      // Check admin-only restrictions first
      if (item.adminOnly && userRole !== 'admin') {
        return false
      }
      
      // Check if the user role allows access to this module
      const roleKey = userRole;
      const moduleKey = item.module.toLowerCase()
      
      // Get module access based on role - defining the permissions here ensures we have a fallback
      // even if the context provider fails
      const roleModuleAccess: Record<string, string[]> = {
        admin: ['dashboard', 'campo', 'empaque', 'finanzas', 'inventario', 'trabajadores', 'contactos', 'ajustes', 'user_management'],
        campo: ['dashboard', 'campo', 'inventario', 'trabajadores', 'ajustes'],
        empaque: ['dashboard', 'empaque', 'inventario', 'trabajadores', 'ajustes'],
        finanzas: ['dashboard', 'finanzas', 'inventario', 'trabajadores', 'ajustes']
      }
      
      return roleModuleAccess[roleKey]?.includes(moduleKey) || false
    } catch (e) {
      console.error("Error filtering nav item:", e);
      return false;
    }
  })

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!isCollapsed && (
          <div className="flex items-center space-x-3">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-Di7jTOuyhExHDeoZxfX2tUDW0x6CK7.png"
              alt="Seedor"
              className="h-8 w-auto"
            />
            <div>
              <h2 className="font-semibold text-sidebar-foreground">{user.tenant?.nombre || "Mi Empresa"}</h2>
              <p className="text-xs text-sidebar-foreground/70">{user.nombre}</p>
              {planInfo && (
                <div className="flex items-center gap-1 mt-1">
                  <Crown className="h-3 w-3 text-yellow-500" />
                  <span className="text-xs text-sidebar-foreground/60">
                    {planInfo.plan_display_name}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {filteredNavItems.map((item) => {
          const Icon = item.icon
          const isActive = currentPage === item.page
          // Verificar si el módulo está habilitado en el plan actual
          const isFeatureEnabled = canAccessModule(item.module, user.rol)

          return (
            <div key={item.page} className="relative group">
              <Button
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isCollapsed && "px-2",
                  !isFeatureEnabled && "opacity-50 cursor-not-allowed hover:bg-transparent pointer-events-none",
                )}
                onClick={() => isFeatureEnabled && onNavigate(item.page)}
                disabled={!isFeatureEnabled}
              >
                <Icon className={cn("h-4 w-4", !isCollapsed && "mr-3")} />
                {!isCollapsed && <span>{item.title}</span>}
              </Button>
              
              {/* Tooltip para funcionalidades no disponibles */}
              {!isFeatureEnabled && (
                <div className="absolute left-full ml-2 top-0 transform -translate-y-1/4 invisible group-hover:visible bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50">
                  {!isCollapsed ? (
                    <div className="flex items-center gap-1">
                      <Crown className="h-3 w-3 text-yellow-400" />
                      <span>Requiere plan superior</span>
                    </div>
                  ) : (
                    <div>
                      <p>{item.title}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Crown className="h-3 w-3 text-yellow-400" />
                        <span>Requiere plan superior</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <Button
          variant="ghost"
          className={cn("w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent", isCollapsed && "px-2")}
          onClick={onLogout}
        >
          <LogOut className={cn("h-4 w-4", !isCollapsed && "mr-3")} />
          {!isCollapsed && <span>Cerrar Sesión</span>}
        </Button>
      </div>
    </div>
  )
}
