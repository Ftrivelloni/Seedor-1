// Constants for Campo module

import type { TareaCampo } from "../types"

// Task types with labels for display
export const TASK_TYPES = [
  { value: "insecticida", label: "Insecticida" },
  { value: "fertilizante", label: "Fertilizante" },
  { value: "poda", label: "Poda" },
  { value: "riego", label: "Riego" },
  { value: "cosecha", label: "Cosecha" },
] as const

// Task states with labels for display
export const TASK_STATES = [
  { value: "pendiente", label: "Pendiente" },
  { value: "en-curso", label: "En Curso" },
  { value: "completada", label: "Completada" },
] as const

// Badge variant mappings for different task states
export const TASK_STATE_BADGES = {
  pendiente: "secondary",
  "en-curso": "default", 
  completada: "default",
} as const

// Badge variant mappings for different task types
export const TASK_TYPE_BADGES = {
  insecticida: "destructive",
  fertilizante: "default",
  poda: "secondary",
  riego: "default",
  cosecha: "default",
} as const

// Permission roles that can access campo functionality
export const CAMPO_PERMISSION_ROLES = ["Admin", "Campo"] as const

// Utility functions to get labels and check values
export const getTaskTypeLabel = (tipo: TareaCampo["tipo"]): string => {
  const taskType = TASK_TYPES.find(t => t.value === tipo)
  return taskType?.label || tipo
}

export const getTaskStateLabel = (estado: TareaCampo["estado"]): string => {
  const taskState = TASK_STATES.find(s => s.value === estado)
  return taskState?.label || estado
}

export const getTaskStateBadgeVariant = (estado: TareaCampo["estado"]) => {
  return TASK_STATE_BADGES[estado as keyof typeof TASK_STATE_BADGES] || "default"
}

export const getTaskTypeBadgeVariant = (tipo: TareaCampo["tipo"]) => {
  return TASK_TYPE_BADGES[tipo as keyof typeof TASK_TYPE_BADGES] || "default"
}

export const hasFieldPermission = (userRoles: string[]): boolean => {
  return CAMPO_PERMISSION_ROLES.some(role => userRoles.includes(role))
}

// Extract unique task types and states from tasks data (for dynamic filtering)
export const getUniqueTaskTypes = (tasks: TareaCampo[]): Array<{ value: string; label: string }> => {
  const uniqueTypes = [...new Set(tasks.map(task => task.tipo))]
  return uniqueTypes.map(tipo => ({
    value: tipo,
    label: getTaskTypeLabel(tipo)
  }))
}

export const getUniqueTaskStates = (tasks: TareaCampo[]): Array<{ value: string; label: string }> => {
  const uniqueStates = [...new Set(tasks.map(task => task.estado))]
  return uniqueStates.map(estado => ({
    value: estado,
    label: getTaskStateLabel(estado)
  }))
}