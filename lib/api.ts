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
import type { IngresoFruta, Preproceso, Pallet, Despacho, EgresoFruta } from './types'

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

// Ingreso Fruta API
export const ingresoFrutaApi = {
  async getIngresos(tenantId: string): Promise<any[]> {
    // Traer todos los ingresos de fruta para el tenant, omitiendo campos técnicos
    try {
      const { data, error } = await supabase
        .from('ingreso_fruta')
        .select(`
          fecha,
          estado_liquidacion,
          num_ticket,
          num_remito,
          productor,
          finca,
          producto,
          lote,
          contratista,
          tipo_cosecha,
          cant_bin,
          tipo_bin,
          peso_neto,
          transporte,
          chofer,
          chasis,
          acoplado,
          operario
        `)
        .eq('tennant_id', tenantId)
        .order('fecha', { ascending: false });

      if (error) {
        console.error('Error fetching ingresos_fruta:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Error connecting to Supabase:', error);
      return [];
    }
  },

  async createIngreso(ingreso: Omit<IngresoFruta, "id">): Promise<IngresoFruta> {
    await delay(800)
    const newIngreso: IngresoFruta = {
      ...ingreso,
      id: `if${Date.now()}`,
    }
    return newIngreso
  },

  async updateIngreso(id: string, updates: Partial<IngresoFruta>): Promise<IngresoFruta> {
    await delay(600)
    // TODO: Implement actual update logic
    throw new Error("Ingreso no encontrado")
  },

  async deleteIngreso(id: string): Promise<void> {
    await delay(400)
    // TODO: Implement actual delete logic
  },
}

// Preproceso API
export const preprocesoApi = {
  async getPreprocesos(tenantId: string): Promise<Preproceso[]> {
    await delay(500)
    // TODO: Implement actual Supabase integration
    return []
  },

  async createPreproceso(preproceso: Omit<Preproceso, "id">): Promise<Preproceso> {
    await delay(800)
    const newPreproceso: Preproceso = {
      ...preproceso,
      id: `pp${Date.now()}`,
    }
    return newPreproceso
  },

  async updatePreproceso(id: string, updates: Partial<Preproceso>): Promise<Preproceso> {
    await delay(600)
    // TODO: Implement actual update logic
    throw new Error("Preproceso no encontrado")
  },

  async deletePreproceso(id: string): Promise<void> {
    await delay(400)
    // TODO: Implement actual delete logic
  },
}

// Pallets API
export const palletsApi = {
  async getPallets(tenantId: string): Promise<Pallet[]> {
    await delay(500)
    // TODO: Implement actual Supabase integration
    return []
  },

  async createPallet(pallet: Omit<Pallet, "id">): Promise<Pallet> {
    await delay(800)
    const newPallet: Pallet = {
      ...pallet,
      id: `plt${Date.now()}`,
    }
    return newPallet
  },

  async updatePallet(id: string, updates: Partial<Pallet>): Promise<Pallet> {
    await delay(600)
    // TODO: Implement actual update logic
    throw new Error("Pallet no encontrado")
  },

  async deletePallet(id: string): Promise<void> {
    await delay(400)
    // TODO: Implement actual delete logic
  },
}

// Despacho API
export const despachoApi = {
  async getDespachos(tenantId: string): Promise<Despacho[]> {
    await delay(500)
    // TODO: Implement actual Supabase integration
    return []
  },

  async createDespacho(despacho: Omit<Despacho, "id">): Promise<Despacho> {
    await delay(800)
    const newDespacho: Despacho = {
      ...despacho,
      id: `dsp${Date.now()}`,
    }
    return newDespacho
  },

  async updateDespacho(id: string, updates: Partial<Despacho>): Promise<Despacho> {
    await delay(600)
    // TODO: Implement actual update logic
    throw new Error("Despacho no encontrado")
  },

  async deleteDespacho(id: string): Promise<void> {
    await delay(400)
    // TODO: Implement actual delete logic
  },
}

// Egreso Fruta API
export const egresoFrutaApi = {
  async getEgresos(tenantId: string): Promise<EgresoFruta[]> {
    await delay(500)
    // TODO: Implement actual Supabase integration
    return []
  },

  async createEgreso(egreso: Omit<EgresoFruta, "id">): Promise<EgresoFruta> {
    await delay(800)
    const newEgreso: EgresoFruta = {
      ...egreso,
      id: `ef${Date.now()}`,
    }
    return newEgreso
  },

  async updateEgreso(id: string, updates: Partial<EgresoFruta>): Promise<EgresoFruta> {
    await delay(600)
    // TODO: Implement actual update logic
    throw new Error("Egreso no encontrado")
  },

  async deleteEgreso(id: string): Promise<void> {
    await delay(400)
    // TODO: Implement actual delete logic
  },
}
