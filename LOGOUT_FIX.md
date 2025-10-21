# 🔧 Fix: Logout no limpiaba cookies de Supabase

## 🐛 Problema Detectado

Después del primer fix, surgió un nuevo problema:

```
1. Usuario inicia sesión con cuenta real
2. Usuario cierra sesión (logout)
3. Usuario hace clic en "Ver Demo"
4. ❌ PROBLEMA: En vez de mostrar el demo, carga al usuario real anterior
```

### Causa Raíz

La función `logout()` en `/lib/supabaseAuth.ts` **NO estaba limpiando las cookies de Supabase correctamente**.

#### Código problemático:

```typescript
logout: async (): Promise<{ error?: string }> => {
  try {
    const sessionManager = getSessionManager()
    
    // ... verificación de demo ...
    
    await sessionManager.logoutCurrentTab()  // ← Solo limpia sessionStorage
    
    return {}  // ← NO hace signOut de Supabase!
  } catch (error: any) {
    return { error: error.message }
  }
}
```

**Problemas:**
1. ❌ No llamaba a `supabase.auth.signOut()`
2. ❌ No limpiaba `localStorage` (donde Supabase guarda tokens)
3. ❌ No borraba banderas de demo del `window` object
4. ❌ Las cookies de Supabase permanecían activas

**Resultado:** Después de hacer logout, las cookies y tokens de Supabase quedaban en el navegador, permitiendo que `getSafeSession()` las encontrara y restaurara la sesión.

---

## ✅ Solución Implementada

### Cambio 1: Función `logout()` completa

**Archivo:** `/lib/supabaseAuth.ts`

```typescript
logout: async (): Promise<{ error?: string }> => {
  try {
    const sessionManager = getSessionManager()

    let isDemo = false
    try {
      const currentUser = sessionManager.peekCurrentUser()
      isDemo = Boolean((currentUser as any)?.isDemo)
    } catch {
      isDemo = false
    }

    if (isDemo && typeof fetch !== 'undefined') {
      try {
        await fetch('/api/auth/demo/logout', {
          method: 'POST',
          credentials: 'include'
        })
      } catch (err) {
        console.warn('Error clearing demo session cookies:', err)
      }
    }

    // ✅ NUEVO: Siempre hacer signOut de Supabase
    const { error } = await supabase.auth.signOut()
    
    if (typeof window !== 'undefined') {
      // ✅ NUEVO: Limpiar banderas de demo
      delete (window as any).__SEEDOR_DEMO_ACTIVE
      delete (window as any).__SEEDOR_DEMO_STORE__
      
      // ✅ NUEVO: Limpiar localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') || key.startsWith('supabase.') || key.includes('seedor')) {
          localStorage.removeItem(key)
        }
      })
      
      // ✅ NUEVO: Limpiar sessionStorage
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('sb-') || key.startsWith('supabase.') || key.includes('seedor')) {
          sessionStorage.removeItem(key)
        }
      })
    }

    await sessionManager.logoutCurrentTab()
    
    if (error) {
      console.warn('Error during Supabase signOut:', error)
    }
    
    return {}
  } catch (error: any) {
    return { error: error.message }
  }
},
```

### Cambio 2: Actualizar `logoutGlobal()` también

```typescript
logoutGlobal: async (): Promise<{ error?: string }> => {
  try {
    const sessionManager = getSessionManager()
    let isDemo = false

    try {
      const currentUser = sessionManager.peekCurrentUser()
      isDemo = Boolean((currentUser as any)?.isDemo)
    } catch {
      isDemo = false
    }

    if (isDemo && typeof fetch !== 'undefined') {
      try {
        await fetch('/api/auth/demo/logout', {
          method: 'POST',
          credentials: 'include'
        })
      } catch (err) {
        console.warn('Error clearing demo session cookies:', err)
      }
    }

    const { error } = await supabase.auth.signOut()
    
    if (typeof window !== 'undefined') {
      // ✅ NUEVO: Limpiar banderas de demo
      delete (window as any).__SEEDOR_DEMO_ACTIVE
      delete (window as any).__SEEDOR_DEMO_STORE__
      
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') || key.startsWith('supabase.') || key.includes('seedor')) {
          localStorage.removeItem(key)
        }
      })
      
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('sb-') || key.startsWith('supabase.') || key.includes('seedor')) {
          sessionStorage.removeItem(key)
        }
      })
      
      sessionManager.clearCurrentTabSession()
    }
    
    if (error) {
      return { error: error.message }
    }
    
    return {}
  } catch (error: any) {
    return { error: error.message }
  }
},
```

---

## 🔄 Nuevo Flujo Corregido

### Escenario: Logout → Ver Demo

```
1. Usuario logueado hace logout
   ↓
2. logout() ejecuta:
   ├─ supabase.auth.signOut() ✅
   ├─ Borra localStorage (tokens de Supabase) ✅
   ├─ Borra sessionStorage ✅
   ├─ Borra window.__SEEDOR_DEMO_ACTIVE ✅
   ├─ Borra window.__SEEDOR_DEMO_STORE__ ✅
   └─ sessionManager.clearCurrentTabSession() ✅
   ↓
3. Usuario hace clic en "Ver Demo"
   ↓
4. GET /demo
   ├─ Borra cookies de Supabase (si quedan) ✅
   ├─ Crea cookies demo
   └─ Redirige a /home
   ↓
5. getSafeSession()
   ├─ NO encuentra sesión en sessionStorage ✅
   ├─ Verifica cookies demo PRIMERO ✅
   ├─ Encuentra cookies demo
   └─ Carga DEMO_USER ✅
   ↓
6. ✅ Usuario ve el DEMO correctamente
```

---

## 🎯 Qué limpia cada función ahora

### `logout()` (usado en la mayoría de casos)
- ✅ Cookies de Supabase (vía `signOut()`)
- ✅ Cookies de demo (vía `/api/auth/demo/logout`)
- ✅ localStorage (tokens y datos de Supabase)
- ✅ sessionStorage (sesión de pestaña)
- ✅ `window.__SEEDOR_DEMO_ACTIVE`
- ✅ `window.__SEEDOR_DEMO_STORE__`

### `logoutGlobal()` (logout completo)
- ✅ Todo lo anterior
- ✅ Limpieza más agresiva de todos los storages

---

## 🧪 Casos de Prueba

### ✅ Caso 1: Logout normal → Demo
```
1. Login con usuario real
2. Navegar por la app
3. Hacer logout
4. Ir a landing page
5. Click en "Ver Demo"
6. ✅ Debería mostrar el demo (NO los datos del usuario real)
```

### ✅ Caso 2: Demo → Logout → Demo
```
1. Click en "Ver Demo"
2. Ver datos demo
3. Hacer logout desde el demo
4. Click en "Ver Demo" nuevamente
5. ✅ Debería crear nueva sesión demo
```

### ✅ Caso 3: Usuario real → Logout → Login
```
1. Login con usuario real
2. Hacer logout
3. Login nuevamente
4. ✅ Debería iniciar sesión limpia sin rastros de sesión anterior
```

### ✅ Caso 4: Demo → Logout → Login real
```
1. Click en "Ver Demo"
2. Ver datos demo
3. Hacer logout
4. Login con credenciales reales
5. ✅ Debería ver datos reales (no datos demo)
```

---

## 📊 Comparación Antes/Después

### Antes del fix:

| Acción | Cookies Supabase | localStorage | sessionStorage | Banderas window |
|--------|------------------|--------------|----------------|-----------------|
| logout() | ❌ Permanecían | ❌ Permanecían | ✅ Limpiado | ❌ Permanecían |

**Resultado:** Sesión "fantasma" que reaparecía

### Después del fix:

| Acción | Cookies Supabase | localStorage | sessionStorage | Banderas window |
|--------|------------------|--------------|----------------|-----------------|
| logout() | ✅ Borradas | ✅ Limpiado | ✅ Limpiado | ✅ Borradas |

**Resultado:** Limpieza completa, sin sesiones fantasma

---

## 🔐 Consideraciones de Seguridad

1. ✅ **Limpieza exhaustiva:** Se borran TODAS las huellas de sesión
2. ✅ **Sin persistencia indeseada:** Los tokens no sobreviven al logout
3. ✅ **Aislamiento demo/real:** Demo y sesiones reales no se mezclan
4. ✅ **Logout robusto:** Funciona incluso si `signOut()` falla parcialmente

---

## 🚀 Deployment

No requiere:
- ❌ Cambios en base de datos
- ❌ Nuevas variables de entorno
- ❌ Migraciones

Solo requiere:
- ✅ Deploy del código actualizado
- ✅ Clear cache del navegador (recomendado para usuarios existentes)

---

## 📝 Resumen

**Problema:** `logout()` no limpiaba cookies ni tokens de Supabase

**Solución:** 
1. Agregar `supabase.auth.signOut()` en `logout()`
2. Limpiar `localStorage` y `sessionStorage`
3. Borrar banderas de demo del `window` object
4. Aplicar los mismos cambios a `logoutGlobal()`

**Resultado:** Logout completo y funcional que permite usar demo después de cerrar sesión.
