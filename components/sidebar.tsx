"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "./ui/button"
import { cn } from "../lib/utils"
import type { AuthUser } from "../lib/supabaseAuth"
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

  const filteredNavItems = navItems.filter((item) => {
    if (!canAccessModule(item.module, user.rol)) {
      return false
    }
    
    if (item.adminOnly && user.rol.toLowerCase() !== 'admin') {
      return false
    }
    
    return true
  })

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!isCollapsed && (
          <div className="flex items-center space-x-3">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-Di7jTOuyhExHDeoZxfX2tUDW0x6CK7.png"
              alt="Seedor"
              className="h-8 w-auto"
            />
            <div>
              <h2 className="font-semibold text-sidebar-foreground">{user.tenant.name}</h2>
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

      <nav className="flex-1 p-4 space-y-2">
        {filteredNavItems.map((item) => {
          const Icon = item.icon
          const isActive = currentPage === item.page

          return (
            <Button
              key={item.page}
              variant={isActive ? "default" : "ghost"}
              className={cn(
                "w-full justify-start",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isCollapsed && "px-2",
              )}
              onClick={() => onNavigate(item.page)}
            >
              <Icon className={cn("h-4 w-4", !isCollapsed && "mr-3")} />
              {!isCollapsed && <span>{item.title}</span>}
            </Button>
          )
        })}
      </nav>

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
