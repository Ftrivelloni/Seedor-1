"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "./ui/button"
import { cn } from "../lib/utils"
import type { AuthUser } from "../lib/types"
import { useFeatures, ModuleGate } from "../lib/features-context"
import TenantSelector from './tenant-selector'
import { useIsMobile } from "../hooks/use-mobile"
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
  Menu,
  X,
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
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const { canAccessModule, planInfo } = useFeatures()
  const isMobile = useIsMobile()

  let filteredNavItems = navItems

  // If the user has not selected a tenant/role yet, only show Ajustes
  if (!user.tenantId || user.tenantId === '') {
    filteredNavItems = navItems.filter((i) => i.module === 'ajustes')
  } else {
    filteredNavItems = navItems.filter((item) => {
      if (!canAccessModule(item.module, user.rol || '')) {
        return false
      }

      if (item.adminOnly && user.rol?.toLowerCase() !== 'admin') {
        return false
      }

      return true
    })
  }

  // Mobile Bottom Navigation
  if (isMobile) {
    // Main navigation items for bottom bar (limit to 5 most important)
    const mainNavItems = filteredNavItems.filter(item => 
      ['dashboard', 'empaque', 'inventario', 'trabajadores', 'ajustes'].includes(item.page)
    ).slice(0, 5)

    return (
      <>
        {/* Mobile Top Header */}
        <div className="fixed top-0 left-0 right-0 z-40 bg-sidebar border-b border-sidebar-border">
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-2">
              <img src="/logo-seedor.png" alt="Seedor" className="h-8 w-auto" />
              <div>
                <TenantSelector />
                <p className="text-xs text-sidebar-foreground/70">{user.nombre}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="text-sidebar-foreground"
            >
              {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {showMobileMenu && (
          <div 
            className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowMobileMenu(false)}
          >
            <div 
              className="absolute top-14 right-0 left-0 mx-4 bg-sidebar border border-sidebar-border rounded-lg shadow-xl max-h-[70vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 space-y-2">
                {filteredNavItems.map((item) => {
                  const Icon = item.icon
                  const isActive = currentPage === item.page
                  return (
                    <Button
                      key={item.page}
                      variant={isActive ? "default" : "ghost"}
                      className={cn(
                        "w-full justify-start transition-colors",
                        isActive
                          ? "text-white"
                          : "text-sidebar-foreground"
                      )}
                      style={isActive ? {background: '#63bd0a'} : {}}
                      onMouseEnter={(e) => {
                        if (isActive) {
                          e.currentTarget.style.background = '#8bc34a'
                        } else {
                          e.currentTarget.style.background = '#f0f7ea'
                          e.currentTarget.style.color = '#1a1a1a'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (isActive) {
                          e.currentTarget.style.background = '#63bd0a'
                        } else {
                          e.currentTarget.style.background = 'transparent'
                          e.currentTarget.style.color = ''
                        }
                      }}
                      onClick={() => {
                        onNavigate(item.page)
                        setShowMobileMenu(false)
                      }}
                    >
                      <Icon className="h-4 w-4 mr-3" />
                      <span>{item.title}</span>
                    </Button>
                  )
                })}
                <div className="pt-2 border-t border-sidebar-border">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
                    onClick={onLogout}
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    <span>Cerrar Sesión</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-sidebar border-t border-sidebar-border safe-area-inset-bottom">
          <nav className="flex items-center justify-around px-2 py-2">
            {mainNavItems.map((item) => {
              const Icon = item.icon
              const isActive = currentPage === item.page
              return (
                <button
                  key={item.page}
                  onClick={() => onNavigate(item.page)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-0 flex-1",
                    isActive
                      ? "text-white"
                      : "text-sidebar-foreground hover:bg-sidebar-accent"
                  )}
                  style={isActive ? {background: '#63bd0a'} : {}}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="text-[10px] font-medium truncate w-full text-center">
                    {item.title}
                  </span>
                </button>
              )
            })}
          </nav>
        </div>
      </>
    )
  }

  // Desktop Sidebar
  return (
    <div
      className={cn(
        "flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!isCollapsed && (
          <div className="flex items-center space-x-3">
            <img
              src="/logo-seedor.png"
              alt="Seedor"
              className="h-8 w-auto"
            />
            <div>
              {/* Tenant selector replaces static tenant name */}
              <div className="flex items-center gap-2">
                <TenantSelector />
              </div>

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

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const Icon = item.icon
          const isActive = currentPage === item.page

          return (
            <Button
              key={item.page}
              variant={isActive ? "default" : "ghost"}
              className={cn(
                "w-full justify-start transition-colors",
                isActive
                  ? "text-white"
                  : "text-sidebar-foreground",
                isCollapsed && "px-2",
              )}
              style={isActive ? {background: '#63bd0a'} : {}}
              onMouseEnter={(e) => {
                if (isActive) {
                  e.currentTarget.style.background = '#8bc34a'
                } else {
                  e.currentTarget.style.background = '#f0f7ea'
                  e.currentTarget.style.color = '#1a1a1a'
                }
              }}
              onMouseLeave={(e) => {
                if (isActive) {
                  e.currentTarget.style.background = '#63bd0a'
                } else {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = ''
                }
              }}
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
