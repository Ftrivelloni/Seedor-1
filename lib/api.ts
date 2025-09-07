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
import { supabase } from './supabaseClient'

// Simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Campo API
export const campoApi = {
  async getTareas(tenantId: string): Promise<TareaCampo[]> {
    try {
      const { data, error } = await supabase
        .from('tareas_campo')
        .select('*')
        .eq('tenantId', tenantId);
      
      if (error) {
        console.error('Error fetching tareas:', error);
        // Fallback to mock data if there's an error
        await delay(500);
        return tareasCampo.filter((t) => t.tenantId === tenantId);
      }
      
      return data as TareaCampo[];
    } catch (error) {
      console.error('Error connecting to Supabase:', error);
      // Fallback to mock data
      await delay(500);
      return tareasCampo.filter((t) => t.tenantId === tenantId);
    }
  },

  async createTarea(tarea: Omit<TareaCampo, "id" | "fechaCreacion">): Promise<TareaCampo> {
    try {
      const newTarea: TareaCampo = {
        ...tarea,
        id: `tc${Date.now()}`,
        fechaCreacion: new Date().toISOString().split("T")[0],
      }
      
      const { data, error } = await supabase
        .from('tareas_campo')
        .insert(newTarea)
        .select();
      
      if (error) {
        console.error('Error creating tarea:', error);
        // Fallback to mock data
        await delay(800);
        tareasCampo.push(newTarea);
        return newTarea;
      }
      
      return data[0] as TareaCampo;
    } catch (error) {
      console.error('Error connecting to Supabase:', error);
      // Fallback to mock data
      const newTarea: TareaCampo = {
        ...tarea,
        id: `tc${Date.now()}`,
        fechaCreacion: new Date().toISOString().split("T")[0],
      }
      await delay(800);
      tareasCampo.push(newTarea);
      return newTarea;
    }
  },

  async updateTarea(id: string, updates: Partial<TareaCampo>): Promise<TareaCampo> {
    try {
      const { data, error } = await supabase
        .from('tareas_campo')
        .update(updates)
        .eq('id', id)
        .select();
      
      if (error) {
        console.error('Error updating tarea:', error);
        // Fallback to mock data
        await delay(600);
        const index = tareasCampo.findIndex((t) => t.id === id);
        if (index === -1) throw new Error("Tarea no encontrada");
        
        tareasCampo[index] = { ...tareasCampo[index], ...updates };
        return tareasCampo[index];
      }
      
      return data[0] as TareaCampo;
    } catch (error) {
      console.error('Error connecting to Supabase:', error);
      // Fallback to mock data
      await delay(600);
      const index = tareasCampo.findIndex((t) => t.id === id);
      if (index === -1) throw new Error("Tarea no encontrada");
      
      tareasCampo[index] = { ...tareasCampo[index], ...updates };
      return tareasCampo[index];
    }
  },

  async deleteTarea(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('tareas_campo')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting tarea:', error);
        // Fallback to mock data
        await delay(400);
        const index = tareasCampo.findIndex((t) => t.id === id);
        if (index === -1) throw new Error("Tarea no encontrada");
        
        tareasCampo.splice(index, 1);
      }
    } catch (error) {
      console.error('Error connecting to Supabase:', error);
      // Fallback to mock data
      await delay(400);
      const index = tareasCampo.findIndex((t) => t.id === id);
      if (index === -1) throw new Error("Tarea no encontrada");
      
      tareasCampo.splice(index, 1);
    }
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
