// Egreso Fruta API
export const egresoFrutaApi = {
  async getEgresos(tenantId: string): Promise<any[]> {
    try {
      // First verify the tenant exists to prevent orphaned reference errors
      const { data: tenantCheck } = await supabase
        .from('tenants')
        .select('id')
        .eq('id', tenantId)
        .single();
      
      if (!tenantCheck) {
        console.warn(`Tenant ${tenantId} not found, returning empty array`);
        return [];
      }

      const { data, error } = await supabase
        .from('egreso_fruta')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('fecha', { ascending: false });
      
      if (error) {
        console.error('Error fetching egreso_fruta:', error);
        // Handle specific Supabase errors
        if (error.message?.includes('snippet') || error.message?.includes('doesn\'t exist')) {
          console.warn('Detected orphaned data reference, clearing cache...');
          return [];
        }
        return [];
      }
      return data || [];
    } catch (error: any) {
      console.error('Error connecting to Supabase:', error);
      // Handle UUID/ID related errors that might cause "snippet doesn't exist"
      if (error.message?.includes('invalid input syntax for type uuid')) {
        console.warn('Invalid UUID detected, returning empty array');
        return [];
      }
      return [];
    }
  },

  async createEgreso(egreso: Omit<EgresoFruta, "id">): Promise<EgresoFruta> {
    try {
      // Verify tenant exists before creating
      const { data: tenantCheck } = await supabase
        .from('tenants')
        .select('id')
        .eq('id', egreso.tenantId)
        .single();
      
      if (!tenantCheck) {
        throw new Error(`Tenant ${egreso.tenantId} not found. Cannot create egreso.`);
      }

      const { data, error } = await supabase
        .from('egreso_fruta')
        .insert([egreso])
        .select()
        .single();
      
      if (error) {
        throw new Error('Error al crear egreso: ' + error.message);
      }
      return data;
    } catch (error: any) {
      console.error('Error creating egreso:', error);
      throw error;
    }
  },
};
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
import type { IngresoFruta, Preproceso, Pallet, Despacho, EgresoFruta, Tenant, TenantMembership, TenantModule, CreateTenantRequest } from './types'
// Use the singleton supabase client to avoid multiple instances
import { supabase } from './supabaseClient'

// Simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Tenant API
export const tenantApi = {
  // Create a new tenant with admin user
  async createTenant(data: CreateTenantRequest): Promise<{ tenant: Tenant; user: any }> {
    try {
      console.log('Starting tenant creation process with data:', {
        ...data,
        admin_user: { ...data.admin_user, password: '[HIDDEN]' }
      })

      // Step 1: Create the user account (skip email confirmation for development)
      console.log('Step 1: Creating user account...')
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.admin_user.email,
        password: data.admin_user.password,
        options: {
          emailRedirectTo: undefined,
          data: {
            full_name: data.admin_user.full_name,
          },
        },
      })

      let userId: string
      let userEmail: string

      if (authError) {
        console.error('Auth signup error:', authError)
        // Check if user already exists
        if (authError.message.includes('User already registered')) {
          console.log('User already exists, attempting sign in...')
          const { data: existingSignIn, error: existingSignInError } = await supabase.auth.signInWithPassword({
            email: data.admin_user.email,
            password: data.admin_user.password,
          })
          
          if (existingSignInError) {
            throw new Error(`Error de autenticación: ${existingSignInError.message}`)
          }
          
          // Use the existing user for tenant creation
          if (!existingSignIn.user?.id) {
            throw new Error('No se pudo obtener información del usuario existente')
          }
          userId = existingSignIn.user.id
          userEmail = existingSignIn.user.email!
          console.log('Using existing user:', userId)
        } else {
          throw new Error(`Error de registro: ${authError.message}`)
        }
      } else if (authData?.user) {
        userId = authData.user.id
        userEmail = authData.user.email!
        console.log('New user created successfully:', userId)
        
        // For new users, skip sign-in step since email might not be confirmed
        console.log('Proceeding with tenant creation for new user (skipping sign-in)')
      } else {
        throw new Error('No se pudo crear o autenticar el usuario')
      }

      // Step 3: Create the tenant
      console.log('Step 3: Creating tenant...')
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .insert([
          {
            name: data.name,
            slug: data.slug,
            plan: data.plan,
            primary_crop: data.primary_crop,
            contact_email: data.contact_email,
            created_by: userId,
          },
        ])
        .select()
        .single()

      if (tenantError) {
        console.error('Tenant creation error:', tenantError)
        throw new Error(`Error al crear empresa: ${tenantError.message}`)
      }

      console.log('Tenant created successfully:', tenantData)

      // Step 4: Create tenant membership for admin user
      console.log('Step 4: Creating admin membership...')
      const { error: membershipError } = await supabase
        .from('tenant_memberships')
        .insert([
          {
            id: crypto.randomUUID(), // Explicitly generate UUID for id column
            tenant_id: tenantData.id,
            user_id: userId,
            role_code: 'admin',
            status: 'active',
            accepted_at: new Date().toISOString(),
          },
        ])

      if (membershipError) {
        console.error('Membership creation error:', membershipError)
        throw new Error(`Error al crear membresía: ${membershipError.message}`)
      }

      console.log('Admin membership created successfully')

      // Step 5: Enable default modules for the tenant
      console.log('Step 5: Creating default modules...')
      const defaultModules = ['dashboard', 'empaque', 'usuarios']
      const moduleInserts = defaultModules.map((module) => ({
        tenant_id: tenantData.id,
        module_code: module,
        enabled: true,
      }))

      const { error: modulesError } = await supabase
        .from('tenant_modules')
        .insert(moduleInserts)

      if (modulesError) {
        console.error('Modules creation error:', modulesError)
        // Don't throw error for modules, it's not critical
        console.warn('Modules creation failed, continuing anyway')
      } else {
        console.log('Default modules created successfully')
      }

      // Step 6: Create user object for frontend
      const user = {
        id: userId,
        email: userEmail,
        tenantId: tenantData.id,
        rol: 'Admin',
        nombre: data.admin_user.full_name,
        tenant: tenantData,
      }

      console.log('Tenant creation completed successfully!')
      return {
        tenant: tenantData,
        user: user,
      }

    } catch (error: any) {
      console.error('Detailed tenant creation error:', error)
      
      // Provide more user-friendly error messages
      if (error.message?.includes('duplicate key')) {
        throw new Error('Ya existe una empresa con ese nombre o identificador')
      }
      if (error.message?.includes('invalid_email')) {
        throw new Error('El formato del email no es válido')
      }
      if (error.message?.includes('weak_password')) {
        throw new Error('La contraseña debe tener al menos 6 caracteres')
      }
      if (error.message?.includes('signup_disabled')) {
        throw new Error('El registro de nuevos usuarios está deshabilitado')
      }
      if (error.message?.includes('email_already_in_use')) {
        throw new Error('Ya existe una cuenta con este email')
      }
      
      throw error
    }
  },

  // Get tenant by slug
  async getTenantBySlug(slug: string): Promise<Tenant | null> {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }

    return data
  },

  // Get user's tenants
  async getUserTenants(userId: string): Promise<Tenant[]> {
    const { data, error } = await supabase
      .from('tenant_memberships')
      .select(`
        tenants (*)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')

    if (error) throw error

    return data.map((membership: any) => membership.tenants)
  },

  // Get tenant modules
  async getTenantModules(tenantId: string): Promise<TenantModule[]> {
    const { data, error } = await supabase
      .from('tenant_modules')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('enabled', true)

    if (error) throw error
    return data || []
  },

  // Check if slug is available
  async isSlugAvailable(slug: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('tenants')
      .select('slug')
      .eq('slug', slug)
      .single()

    if (error && error.code === 'PGRST116') return true // Not found, so available
    if (error) throw error

    return false // Found, so not available
  },

  // Get user membership in tenant
  async getUserMembership(userId: string, tenantId: string): Promise<TenantMembership | null> {
    const { data, error } = await supabase
      .from('tenant_memberships')
      .select('*')
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }

    return data
  },
}

// Campo API
export const campoApi = {
  async getTareas(tenantId: string): Promise<TareaCampo[]> {
    try {
      // Try the database first, but expect it to fail since table doesn't exist properly
      const { data, error } = await supabase
        .from('tareas_campo')
        .select('*')
        .eq('tenant_id', tenantId); // Use snake_case for database
      
      if (error) {
        console.log('Supabase table not found, using mock data:', error.message);
        // Fallback to mock data if there's an error
        await delay(500);
        return tareasCampo.filter((t) => t.tenantId === tenantId);
      }
      
      return data as TareaCampo[];
    } catch (error) {
      console.log('Error connecting to Supabase, using mock data:', error);
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
  // Obtiene movimientos desde Supabase; mapea notes → concepto para la UI
  async getMovimientos(tenantId: string): Promise<MovimientoCaja[]> {
    try {
      const { data, error } = await supabase
        .from('cash_movements')
        .select(`
          id,
          tenant_id,
          date,
          amount,
          kind,
          notes,
          category_id,
          finance_categories ( id, name )
        `)
        .eq('tenant_id', tenantId)
        .order('date', { ascending: false })

      if (error) {
        console.error('Error fetching movements from Supabase:', error)
        throw error
      }

      console.log('Movements loaded from Supabase:', data?.length || 0)

      const movements: MovimientoCaja[] = (data || []).map((row: any) => ({
        id: row.id,
        tenantId: row.tenant_id,
        fecha: row.date,
        tipo: row.kind as 'ingreso' | 'egreso',
        monto: Number(row.amount),
        concepto: row.notes || '',
        comprobante: undefined, // schema doesn't have receipt; could add if needed
        categoria: row.finance_categories?.name || 'Sin categoría',
      }))

      return movements
    } catch (err) {
      console.error('Error in getMovimientos, using empty array:', err)
      return []
    }
  },

  async getCategorias(tenantId: string): Promise<Array<{ id: string; name: string; kind?: 'ingreso' | 'egreso' }>> {
    try {
      const { data, error } = await supabase
        .from('finance_categories')
        .select('id, name, kind')
        .eq('tenant_id', tenantId)
        .order('name', { ascending: true })

      if (error) throw error
      return (data || []).map((c: any) => ({ id: c.id, name: c.name, kind: c.kind }))
    } catch (err) {
      console.warn('Falling back to categories derived from mock movimientosCaja:', err)
      const names = Array.from(
        new Set(
          movimientosCaja
            .filter((m) => m.tenantId === tenantId)
            .map((m) => m.categoria)
        )
      )
      return names.map((name, idx) => ({ id: `mock-cat-${idx}`, name }))
    }
  },

  async createCategoria(tenantId: string, name: string, kind: 'ingreso' | 'egreso') {
    // Use server route (service role) to avoid RLS issues on client
    const res = await fetch('/api/finanzas/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId, name, kind })
    })
    const json = await res.json()
    if (!res.ok) {
      throw new Error(json?.error || 'Error creando categoría')
    }
    return json.data
  },

  // Crea movimiento via server route
  async createMovimiento(mov: Omit<MovimientoCaja, 'id'>, userId?: string): Promise<MovimientoCaja> {
    // Resolver categoría a id; si no existe, crearla con kind=mov.tipo
    let categoryId: string | null = null
    if (mov.categoria) {
      const cats = await finanzasApi.getCategorias(mov.tenantId)
      const existing = cats.find((c) => c.name.toLowerCase() === mov.categoria.toLowerCase())
      if (existing) {
        categoryId = existing.id
      } else {
        // Auto-create category with kind=mov.tipo
        const created = await finanzasApi.createCategoria(mov.tenantId, mov.categoria, mov.tipo)
        categoryId = created.id
      }
    }

    if (!categoryId) {
      throw new Error('Debe seleccionar o crear una categoría')
    }

    const res = await fetch('/api/finanzas/movements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: mov.tenantId,
        userId,
        date: mov.fecha,
        kind: mov.tipo,
        amount: mov.monto,
        notes: mov.concepto,
        categoryId,
      }),
    })

    const json = await res.json()
    if (!res.ok) {
      throw new Error(json?.error || 'Error creando movimiento')
    }

    // Mapear de vuelta a UI shape
    const created: MovimientoCaja = {
      id: json.data.id,
      tenantId: json.data.tenant_id,
      fecha: json.data.date,
      tipo: json.data.kind,
      monto: Number(json.data.amount),
      concepto: json.data.notes || '',
      comprobante: undefined,
      categoria: mov.categoria,
    }
    return created
  },
}

// Ingreso Fruta API
export const ingresoFrutaApi = {
  async getIngresos(tenantId: string): Promise<any[]> {
    console.log('🍎 ingresoFrutaApi.getIngresos called with tenantId:', tenantId);
    console.log('🍎 Supabase client available:', !!supabase);
    
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
        .eq('tenant_id', tenantId)
        .order('fecha', { ascending: false });

      console.log('🍎 Supabase response - data:', data);
      console.log('🍎 Supabase response - error:', error);

      if (error) {
        console.error('🍎 Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return [];
      }
      
      console.log('🍎 Returning data:', data || []);
      return data || [];
    } catch (error: any) {
      console.error('🍎 Exception in getIngresos:', {
        message: error?.message,
        stack: error?.stack,
        error
      });
      return [];
    }
  },

  async createIngreso(ingreso: Omit<IngresoFruta, "id">): Promise<IngresoFruta> {
    // Inserta el ingreso en la tabla real de Supabase
    const { data, error } = await supabase
      .from('ingreso_fruta')
      .insert([ingreso])
      .select()
      .single();
    if (error) {
      throw new Error('Error al crear ingreso: ' + error.message)
    }
    return data;
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

// Farms API
export const farmsApi = {
  async getFarms(tenantId: string): Promise<import('./types').Farm[]> {
    console.log('🌾 farmsApi.getFarms called with tenantId:', tenantId);
    console.log('🌾 Supabase client:', !!supabase);
    
    try {
      const { data, error } = await supabase
        .from('farms')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })

      console.log('🌾 Supabase response - data:', data);
      console.log('🌾 Supabase response - error:', error);

      if (error) {
        console.error('🌾 Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      console.log('🌾 Returning data:', data || []);
      return data || []
    } catch (err) {
      console.error('🌾 Caught exception in getFarms:', err);
      throw err;
    }
  },

  async getFarmById(farmId: string): Promise<import('./types').Farm | null> {
    const { data, error } = await supabase
      .from('farms')
      .select('*')
      .eq('id', farmId)
      .single()

    if (error) throw error
    return data
  },

  async createFarm(tenantId: string, userId: string, farmData: import('./types').CreateFarmData): Promise<import('./types').Farm> {
    const { data, error } = await supabase
      .from('farms')
      .insert({
        tenant_id: tenantId,
        created_by: userId,
        name: farmData.name,
        location: farmData.location || null,
        area_ha: farmData.area_ha || null,
        default_crop: farmData.default_crop || null,
        notes: farmData.notes || null
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating farm in Supabase:', error)
      throw error
    }
    return data
  },

  async updateFarm(farmId: string, farmData: Partial<import('./types').CreateFarmData>): Promise<import('./types').Farm> {
    const { data, error } = await supabase
      .from('farms')
      .update(farmData)
      .eq('id', farmId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteFarm(farmId: string): Promise<void> {
    const { error } = await supabase
      .from('farms')
      .delete()
      .eq('id', farmId)

    if (error) throw error
  }
}

// Lots API
export const lotsApi = {
  async getLotsByFarm(farmId: string): Promise<import('./types').Lot[]> {
    const { data, error } = await supabase
      .from('lots')
      .select('*')
      .eq('farm_id', farmId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async getLotById(lotId: string): Promise<import('./types').Lot | null> {
    const { data, error } = await supabase
      .from('lots')
      .select('*')
      .eq('id', lotId)
      .single()

    if (error) throw error
    return data
  },

  async createLot(tenantId: string, lotData: import('./types').CreateLotData): Promise<import('./types').Lot> {
    console.log('🔍 Creating lot with data:', { tenantId, lotData });
    
    const { data, error } = await supabase
      .from('lots')
      .insert({
        tenant_id: tenantId,
        farm_id: lotData.farm_id,
        code: lotData.code,
        crop: lotData.crop,
        variety: lotData.variety || null,
        area_ha: lotData.area_ha || null,
        plant_date: lotData.plant_date || null,
        status: lotData.status
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating lot in Supabase:', error)
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw new Error(error.message || 'Error al crear el lote en la base de datos');
    }
    
    console.log('✅ Lot created successfully:', data);
    return data
  },

  async updateLot(lotId: string, lotData: Partial<import('./types').CreateLotData>): Promise<import('./types').Lot> {
    const { data, error } = await supabase
      .from('lots')
      .update(lotData)
      .eq('id', lotId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteLot(lotId: string): Promise<void> {
    const { error } = await supabase
      .from('lots')
      .delete()
      .eq('id', lotId)

    if (error) throw error
  },

  async getLotStatuses(): Promise<{ code: string; name: string }[]> {
    const { data, error } = await supabase
      .from('lot_statuses')
      .select('*')
      .order('code')

    if (error) throw error
    return data || []
  }
}

// Workers API
export const workersApi = {
  async getWorkersByTenant(tenantId: string, includeInactive = false): Promise<import('./types').Worker[]> {
    let query = supabase
      .from('workers')
      .select('*')
      .eq('tenant_id', tenantId)
    
    if (!includeInactive) {
      query = query.eq('status', 'active')
    }
    
    const { data, error } = await query.order('full_name', { ascending: true })

    if (error) throw error
    return data || []
  },

  async getWorkerById(workerId: string): Promise<import('./types').Worker | null> {
    const { data, error } = await supabase
      .from('workers')
      .select('*')
      .eq('id', workerId)
      .single()

    if (error) throw error
    return data
  },

  async createWorker(tenantId: string, workerData: {
    full_name: string
    document_id: string
    email: string
    phone?: string
    area_module: string
    membership_id?: string
  }): Promise<import('./types').Worker> {
    console.log('🔍 Creating worker with data:', { tenantId, workerData });
    
    const { data, error } = await supabase
      .from('workers')
      .insert({
        tenant_id: tenantId,
        full_name: workerData.full_name,
        document_id: workerData.document_id,
        email: workerData.email,
        phone: workerData.phone || null,
        area_module: workerData.area_module,
        membership_id: workerData.membership_id || null,
        status: 'active'
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating worker in Supabase:', error)
      throw new Error(error.message || 'Error al crear el trabajador en la base de datos');
    }
    
    console.log('✅ Worker created successfully:', data);
    return data
  },

  async updateWorker(workerId: string, workerData: Partial<{
    full_name: string
    document_id: string
    email: string
    phone: string
    area_module: string
    membership_id: string
    status: string
  }>): Promise<import('./types').Worker> {
    const { data, error } = await supabase
      .from('workers')
      .update(workerData)
      .eq('id', workerId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteWorker(workerId: string): Promise<void> {
    // Soft delete - cambiar status a inactive
    const { error } = await supabase
      .from('workers')
      .update({ status: 'inactive' })
      .eq('id', workerId)

    if (error) throw error
  },

  async hardDeleteWorker(workerId: string): Promise<void> {
    // Hard delete - eliminar permanentemente
    // Primero eliminar todos los registros relacionados en orden
    
    // 1. Eliminar registros de asistencia
    const { error: attendanceError } = await supabase
      .from('attendance_records')
      .delete()
      .eq('worker_id', workerId)

    if (attendanceError) {
      console.error('Error deleting attendance records:', attendanceError)
      throw new Error('Error al eliminar registros de asistencia: ' + attendanceError.message)
    }

    // 2. Eliminar tareas asignadas al trabajador
    const { error: tasksError } = await supabase
      .from('tasks')
      .delete()
      .eq('worker_id', workerId)

    if (tasksError) {
      console.error('Error deleting tasks:', tasksError)
      throw new Error('Error al eliminar tareas: ' + tasksError.message)
    }

    // 3. Finalmente eliminar el trabajador
    const { error: workerError } = await supabase
      .from('workers')
      .delete()
      .eq('id', workerId)

    if (workerError) {
      console.error('Error deleting worker:', workerError)
      throw new Error('Error al eliminar trabajador: ' + workerError.message)
    }
  }
}

// Attendance API
export const attendanceApi = {
  async getAttendanceByTenant(tenantId: string, startDate?: string, endDate?: string): Promise<import('./types').AttendanceRecord[]> {
    let query = supabase
      .from('attendance_records')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('date', { ascending: false })

    if (startDate) {
      query = query.gte('date', startDate)
    }
    if (endDate) {
      query = query.lte('date', endDate)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  },

  async getAttendanceByWorker(workerId: string, startDate?: string, endDate?: string): Promise<import('./types').AttendanceRecord[]> {
    let query = supabase
      .from('attendance_records')
      .select('*')
      .eq('worker_id', workerId)
      .order('date', { ascending: false })

    if (startDate) {
      query = query.gte('date', startDate)
    }
    if (endDate) {
      query = query.lte('date', endDate)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  },

  async getAttendanceByDate(tenantId: string, date: string): Promise<import('./types').AttendanceRecord[]> {
    const { data, error } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('date', date)

    if (error) throw error
    return data || []
  },

  async createAttendance(tenantId: string, attendanceData: import('./types').CreateAttendanceData): Promise<import('./types').AttendanceRecord> {
    const { data, error } = await supabase
      .from('attendance_records')
      .insert({
        tenant_id: tenantId,
        worker_id: attendanceData.worker_id,
        date: attendanceData.date,
        status: attendanceData.status,
        reason: attendanceData.reason || null
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating attendance:', error)
      throw new Error(error.message || 'Error al crear el registro de asistencia');
    }
    return data
  },

  async updateAttendance(attendanceId: string, updates: Partial<import('./types').CreateAttendanceData>): Promise<import('./types').AttendanceRecord> {
    const { data, error } = await supabase
      .from('attendance_records')
      .update(updates)
      .eq('id', attendanceId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteAttendance(attendanceId: string): Promise<void> {
    const { error } = await supabase
      .from('attendance_records')
      .delete()
      .eq('id', attendanceId)

    if (error) throw error
  },

  async getAttendanceStatuses(): Promise<import('./types').AttendanceStatus[]> {
    const { data, error } = await supabase
      .from('attendance_statuses')
      .select('*')
      .order('code')

    if (error) throw error
    return data || []
  },

  async bulkCreateAttendance(tenantId: string, attendances: import('./types').CreateAttendanceData[]): Promise<import('./types').AttendanceRecord[]> {
    const recordsToInsert = attendances.map(att => ({
      tenant_id: tenantId,
      worker_id: att.worker_id,
      date: att.date,
      status: att.status,
      reason: att.reason || null
    }))

    const { data, error } = await supabase
      .from('attendance_records')
      .insert(recordsToInsert)
      .select()

    if (error) {
      console.error('❌ Error creating bulk attendance:', error)
      throw new Error(error.message || 'Error al crear los registros de asistencia');
    }
    return data || []
  }
}

// Tasks API
export const tasksApi = {
  async getTasksByLot(lotId: string): Promise<import('./types').Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('lot_id', lotId)
      .order('scheduled_date', { ascending: true })

    if (error) throw error
    return data || []
  },

  async getTaskById(taskId: string): Promise<import('./types').Task | null> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single()

    if (error) throw error
    return data
  },

  async createTask(tenantId: string, taskData: import('./types').CreateTaskData, userId?: string): Promise<import('./types').Task> {
    console.log('🔍 Creating task with data:', { tenantId, taskData, userId });
    
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        tenant_id: tenantId,
        farm_id: taskData.farm_id,
        lot_id: taskData.lot_id,
        title: taskData.title,
        description: taskData.description || '',
        type_code: taskData.type_code || 'otro',
        status_code: taskData.status_code,
        scheduled_date: taskData.scheduled_date || null,
        responsible_membership_id: taskData.responsible_membership_id || null,
        worker_id: taskData.worker_id || null,
        created_by: userId || tenantId
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating task in Supabase:', error)
      throw new Error(error.message || 'Error al crear la tarea en la base de datos');
    }
    
    console.log('✅ Task created successfully:', data);
    return data
  },

  async updateTask(taskId: string, taskData: Partial<import('./types').CreateTaskData>): Promise<import('./types').Task> {
    const { data, error } = await supabase
      .from('tasks')
      .update(taskData)
      .eq('id', taskId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteTask(taskId: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)

    if (error) throw error
  },

  async getTaskStatuses(): Promise<import('./types').TaskStatus[]> {
    const { data, error } = await supabase
      .from('task_statuses')
      .select('*')
      .order('code')

    if (error) throw error
    return data || []
  },

  async getTaskTypes(): Promise<import('./types').TaskType[]> {
    const { data, error } = await supabase
      .from('task_types')
      .select('*')
      .order('code')

    if (error) throw error
    return data || []
  }
}

// Inventory API
export const inventoryApi = {
  // Items CRUD
  async listItems(params: import('./types').ListItemsParams): Promise<import('./types').InventoryItem[]> {
    try {
      let query = supabase
        .from('inventory_items')
        .select(`
          *,
          category_name:inventory_categories(name),
          location_name:inventory_locations(name)
        `)
        .eq('tenant_id', params.tenantId)

      if (params.search) {
        query = query.ilike('name', `%${params.search}%`)
      }

      if (params.categoryId) {
        query = query.eq('category_id', params.categoryId)
      }

      if (params.locationId) {
        query = query.eq('location_id', params.locationId)
      }

      if (params.limit) {
        query = query.limit(params.limit)
      }

      if (params.offset) {
        query = query.range(params.offset, params.offset + (params.limit || 50) - 1)
      }

      const { data, error } = await query.order('name')

      if (error) {
        throw new Error(`Error al obtener items: ${error.message}`)
      }

      // Flatten nested objects
      return (data || []).map((item: any) => ({
        ...item,
        category_name: item.category_name?.name,
        location_name: item.location_name?.name
      }))
    } catch (error: any) {
      throw new Error(error.message || 'Error al cargar items del inventario')
    }
  },

  async getItemById(id: string, tenantId: string): Promise<import('./types').InventoryItem | null> {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select(`
          *,
          category_name:inventory_categories(name),
          location_name:inventory_locations(name)
        `)
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null
        }
        throw new Error(`Error al obtener item: ${error.message}`)
      }

      return {
        ...data,
        category_name: data.category_name?.name,
        location_name: data.location_name?.name
      }
    } catch (error: any) {
      throw new Error(error.message || 'Error al obtener item del inventario')
    }
  },

  async createItem(payload: import('./types').CreateItemPayload, tenantId: string): Promise<import('./types').InventoryItem> {
    try {
      // Usar server route (service role) para evitar problemas de RLS en el cliente
      const res = await fetch('/api/inventario/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          name: payload.name,
          category_id: payload.category_id,
          location_id: payload.location_id,
          unit: payload.unit,
          min_stock: payload.min_stock,
          current_stock: payload.current_stock
        })
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json?.error || 'Error creando item')
      }

      return json.data
    } catch (error: any) {
      throw new Error(error.message || 'Error al crear item del inventario')
    }
  },

  async updateItem(id: string, payload: import('./types').UpdateItemPayload, tenantId: string): Promise<import('./types').InventoryItem> {
    try {
      // Usar server route (service role) para evitar problemas de RLS en el cliente
      const res = await fetch('/api/inventario/items', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          itemId: id,
          name: payload.name,
          category_id: payload.category_id,
          location_id: payload.location_id,
          unit: payload.unit,
          min_stock: payload.min_stock
        })
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json?.error || 'Error actualizando item')
      }

      return json.data
    } catch (error: any) {
      throw new Error(error.message || 'Error al actualizar item del inventario')
    }
  },

  async deleteItem(id: string, tenantId: string): Promise<void> {
    try {
      // Usar server route (service role) para evitar problemas de RLS en el cliente
      const res = await fetch(`/api/inventario/items?itemId=${id}&tenantId=${tenantId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json?.error || 'Error eliminando item')
      }
    } catch (error: any) {
      throw new Error(error.message || 'Error al eliminar item del inventario')
    }
  },

  // Categories CRUD
  async listCategories(tenantId: string): Promise<import('./types').InventoryCategory[]> {
    try {
      const { data, error } = await supabase
        .from('inventory_categories')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('name')

      if (error) {
        throw new Error(`Error al obtener categorías: ${error.message}`)
      }

      return data || []
    } catch (error: any) {
      throw new Error(error.message || 'Error al cargar categorías')
    }
  },

  async createCategory(name: string, tenantId: string): Promise<import('./types').InventoryCategory> {
    try {
      // Usar server route (service role) para evitar problemas de RLS en el cliente
      const res = await fetch('/api/inventario/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          name: name.trim()
        })
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json?.error || 'Error creando categoría')
      }

      return json.data
    } catch (error: any) {
      throw new Error(error.message || 'Error al crear categoría')
    }
  },

  async deleteCategory(id: string, tenantId: string): Promise<void> {
    try {
      // Usar server route (service role) para evitar problemas de RLS en el cliente
      const res = await fetch(`/api/inventario/categories?categoryId=${id}&tenantId=${tenantId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json?.error || 'Error eliminando categoría')
      }
    } catch (error: any) {
      throw new Error(error.message || 'Error al eliminar categoría')
    }
  },

  // Locations CRUD
  async listLocations(tenantId: string): Promise<import('./types').InventoryLocation[]> {
    try {
      const { data, error } = await supabase
        .from('inventory_locations')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('name')

      if (error) {
        throw new Error(`Error al obtener ubicaciones: ${error.message}`)
      }

      return data || []
    } catch (error: any) {
      throw new Error(error.message || 'Error al cargar ubicaciones')
    }
  },

  async createLocation(name: string, tenantId: string): Promise<import('./types').InventoryLocation> {
    try {
      // Usar server route (service role) para evitar problemas de RLS en el cliente
      const res = await fetch('/api/inventario/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          name: name.trim()
        })
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json?.error || 'Error creando ubicación')
      }

      return json.data
    } catch (error: any) {
      throw new Error(error.message || 'Error al crear ubicación')
    }
  },

  async deleteLocation(id: string, tenantId: string): Promise<void> {
    try {
      // Usar server route (service role) para evitar problemas de RLS en el cliente
      const res = await fetch(`/api/inventario/locations?locationId=${id}&tenantId=${tenantId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json?.error || 'Error eliminando ubicación')
      }
    } catch (error: any) {
      throw new Error(error.message || 'Error al eliminar ubicación')
    }
  },

  // Movement Types
  async listMovementTypes(): Promise<import('./types').InventoryMovementType[]> {
    try {
      const { data, error } = await supabase
        .from('inventory_movement_types')
        .select('*')
        .order('code')

      if (error) {
        throw new Error(`Error al obtener tipos de movimiento: ${error.message}`)
      }

      return data || []
    } catch (error: any) {
      throw new Error(error.message || 'Error al cargar tipos de movimiento')
    }
  },

  // Movements
  async listMovements(params: import('./types').ListMovementsParams): Promise<import('./types').InventoryMovement[]> {
    try {
      let query = supabase
        .from('inventory_movements')
        .select(`
          *,
          item_name:inventory_items(name)
        `)
        .eq('tenant_id', params.tenantId)

      if (params.itemId) {
        query = query.eq('item_id', params.itemId)
      }

      if (params.limit) {
        query = query.limit(params.limit)
      }

      if (params.offset) {
        query = query.range(params.offset, params.offset + (params.limit || 50) - 1)
      }

      const { data, error } = await query.order('date', { ascending: false })

      if (error) {
        throw new Error(`Error al obtener movimientos: ${error.message}`)
      }

      return (data || []).map((movement: any) => ({
        ...movement,
        item_name: movement.item_name?.name
      }))
    } catch (error: any) {
      throw new Error(error.message || 'Error al cargar movimientos')
    }
  },

  async createMovement(payload: import('./types').CreateMovementPayload, tenantId: string): Promise<import('./types').InventoryMovement> {
    console.log('🚀 createMovement llamado con payload:', payload, 'tenantId:', tenantId)
    
    try {
      const requestBody = {
        tenantId,
        item_id: payload.item_id,
        type: payload.type,
        quantity: payload.quantity,
        unit_cost: payload.unit_cost,
        reason: payload.reason,
        date: payload.date,
        created_by: payload.created_by
      }
      
      console.log('📡 Enviando petición a /api/inventario/movements con body:', requestBody)
      
      // Usar server route (service role) para evitar problemas de RLS en el cliente
      const res = await fetch('/api/inventario/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      console.log('📨 Respuesta recibida - status:', res.status, 'ok:', res.ok)

      const json = await res.json()
      console.log('📄 JSON de respuesta:', json)
      
      if (!res.ok) {
        console.log('❌ Error en respuesta:', json?.error)
        throw new Error(json?.error || 'Error creando movimiento')
      }

      console.log('✅ Movimiento creado exitosamente:', json.data)
      return json.data
    } catch (error: any) {
      console.log('❌ Error capturado en createMovement:', error)
      throw new Error(error.message || 'Error al crear movimiento')
    }
  },

  async deleteMovement(movementId: string, tenantId: string): Promise<void> {
    console.log('🗑️ deleteMovement llamado con movementId:', movementId, 'tenantId:', tenantId)
    
    try {
      const res = await fetch(`/api/inventario/movements?movementId=${movementId}&tenantId=${tenantId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      })

      const json = await res.json()
      
      if (!res.ok) {
        console.log('❌ Error en respuesta:', json?.error)
        throw new Error(json?.error || 'Error eliminando movimiento')
      }

      console.log('✅ Movimiento eliminado exitosamente')
    } catch (error: any) {
      console.log('❌ Error capturado en deleteMovement:', error)
      throw new Error(error.message || 'Error al eliminar movimiento')
    }
  },

  // Summary and analytics
  async getInventorySummary(tenantId: string): Promise<import('./types').InventorySummary> {
    try {
      // Total de items
      const { data: itemsData, error: itemsError } = await supabase
        .from('inventory_items')
        .select('id, current_stock, min_stock')
        .eq('tenant_id', tenantId)

      if (itemsError) {
        throw new Error(`Error al obtener resumen: ${itemsError.message}`)
      }

      const totalItems = itemsData?.length || 0
      const lowStockItems = itemsData?.filter((item: any) => 
        item.current_stock <= item.min_stock
      ).length || 0

      // Último movimiento
      const { data: lastMovement, error: movementError } = await supabase
        .from('inventory_movements')
        .select('date')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      // No consideramos error si no hay movimientos
      const lastMovementDate = lastMovement?.date

      return {
        totalItems,
        lowStockItems,
        lastMovementDate
      }
    } catch (error: any) {
      throw new Error(error.message || 'Error al obtener resumen del inventario')
    }
  }
}

