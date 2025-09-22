// Egreso Fruta API
export const egresoFrutaApi = {
  async getEgresos(tenantId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('egreso_fruta')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('fecha', { ascending: false });
      if (error) {
        console.error('Error fetching egreso_fruta:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Error connecting to Supabase:', error);
      return [];
    }
  },

  async createEgreso(egreso: Omit<EgresoFruta, "id">): Promise<EgresoFruta> {
    const { data, error } = await supabase
      .from('egreso_fruta')
      .insert([egreso])
      .select()
      .single();
    if (error) {
      throw new Error('Error al crear egreso: ' + error.message)
    }
    return data;
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
import { supabase } from './supabaseClient'
import type { IngresoFruta, Preproceso, Pallet, Despacho, EgresoFruta, Tenant, TenantMembership, TenantModule, CreateTenantRequest } from './types'

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
      const { data, error } = await supabase
        .from('tareas_campo')
        .select('*')
        .eq('tenant_id', tenantId);  // Fixed: using snake_case
      
      if (error) {
        console.warn('Database table error - using mock data:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        
        // If table doesn't exist (PGRST116) or other DB errors, use mock data
        await delay(500);
        return tareasCampo.filter((t) => t.tenantId === tenantId);
      }
      
      // If data is null or empty, return empty array
      return data || [];
    } catch (error) {
      console.error('Network or connection error - using mock data:', error);
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
  .eq('tenant_id', tenantId)
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

