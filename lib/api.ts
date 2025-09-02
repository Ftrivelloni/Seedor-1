import {
  tareasCampo,
  registrosEmpaque,
  inventario,
  movimientosCaja,
  type TareaCampo,
  type RegistroEmpaque,
  type ItemInventario,
  type MovimientoCaja,
} from "./mocks"

// Simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Campo API
export const campoApi = {
  async getTareas(tenantId: string): Promise<TareaCampo[]> {
    await delay(500)
    return tareasCampo.filter((t) => t.tenantId === tenantId)
  },

  async createTarea(tarea: Omit<TareaCampo, "id" | "fechaCreacion">): Promise<TareaCampo> {
    await delay(800)
    const newTarea: TareaCampo = {
      ...tarea,
      id: `tc${Date.now()}`,
      fechaCreacion: new Date().toISOString().split("T")[0],
    }
    tareasCampo.push(newTarea)
    return newTarea
  },

  async updateTarea(id: string, updates: Partial<TareaCampo>): Promise<TareaCampo> {
    await delay(600)
    const index = tareasCampo.findIndex((t) => t.id === id)
    if (index === -1) throw new Error("Tarea no encontrada")

    tareasCampo[index] = { ...tareasCampo[index], ...updates }
    return tareasCampo[index]
  },

  async deleteTarea(id: string): Promise<void> {
    await delay(400)
    const index = tareasCampo.findIndex((t) => t.id === id)
    if (index === -1) throw new Error("Tarea no encontrada")

    tareasCampo.splice(index, 1)
  },
}

// Empaque API
export const empaqueApi = {
  async getRegistros(tenantId: string): Promise<RegistroEmpaque[]> {
    await delay(500)
    return registrosEmpaque.filter((r) => r.tenantId === tenantId)
  },

  async createRegistro(registro: Omit<RegistroEmpaque, "id" | "kgDescartados">): Promise<RegistroEmpaque> {
    await delay(800)
    const newRegistro: RegistroEmpaque = {
      ...registro,
      id: `re${Date.now()}`,
      kgDescartados: registro.kgEntraron - registro.kgSalieron,
    }
    registrosEmpaque.push(newRegistro)
    return newRegistro
  },
}

// Inventario API
export const inventarioApi = {
  async getItems(tenantId: string): Promise<ItemInventario[]> {
    await delay(500)
    return inventario.filter((i) => i.tenantId === tenantId)
  },

  async updateStock(id: string, newStock: number): Promise<ItemInventario> {
    await delay(400)
    const index = inventario.findIndex((i) => i.id === id)
    if (index === -1) throw new Error("Item no encontrado")

    inventario[index].stock = newStock
    return inventario[index]
  },
}

// Finanzas API
export const finanzasApi = {
  async getMovimientos(tenantId: string): Promise<MovimientoCaja[]> {
    await delay(500)
    return movimientosCaja.filter((m) => m.tenantId === tenantId)
  },

  async createMovimiento(movimiento: Omit<MovimientoCaja, "id">): Promise<MovimientoCaja> {
    await delay(800)
    const newMovimiento: MovimientoCaja = {
      ...movimiento,
      id: `mc${Date.now()}`,
    }
    movimientosCaja.push(newMovimiento)
    return newMovimiento
  },
}
