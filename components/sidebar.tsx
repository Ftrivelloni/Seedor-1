"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "./ui/button"
import { cn } from "../lib/utils"
import type { AuthUser } from "../lib/auth"
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
  roles: string[]
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    page: "dashboard",
    roles: ["Admin", "Campo", "Empaque", "Finanzas"],
  },
  {
    title: "Campo",
    icon: Sprout,
    page: "campo",
    roles: ["Admin", "Campo"],
  },
  {
    title: "Empaque",
    icon: Package,
    page: "empaque",
    roles: ["Admin", "Empaque"],
  },
  {
    title: "Inventario",
    icon: Warehouse,
    page: "inventario",
    roles: ["Admin", "Campo", "Empaque"],
  },
  {
    title: "Finanzas",
    icon: DollarSign,
    page: "finanzas",
    roles: ["Admin", "Finanzas"],
  },
  {
    title: "Ajustes",
    icon: Settings,
    page: "ajustes",
    roles: ["Admin", "Campo", "Empaque", "Finanzas"],
  },
]

export function Sidebar({ user, onLogout, onNavigate, currentPage }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const filteredNavItems = navItems.filter((item) => item.roles.includes(user.rol))

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
              <h2 className="font-semibold text-sidebar-foreground">{user.tenant.nombre}</h2>
              <p className="text-xs text-sidebar-foreground/70">{user.nombre}</p>
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
