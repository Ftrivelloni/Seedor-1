# Sistema de Multi-Sesión por Pestaña

## Descripción

Se implementó un sistema de multi-sesión que permite a múltiples usuarios estar logueados simultáneamente en diferentes pestañas del navegador sin interferir entre sí.

## Arquitectura

### SessionManager (`lib/sessionManager.ts`)

- **Almacenamiento**: Utiliza `sessionStorage` para mantener sesiones independientes por pestaña
- **ID de Pestaña**: Cada pestaña genera un ID único que permite identificarla
- **Gestión de Actividad**: Monitorea la actividad de cada pestaña y limpia sesiones inactivas
- **Limpieza Automática**: Se limpia cuando se cierra la pestaña o por inactividad

### Integración con AuthService

- **Login**: `authService.login()` ahora guarda la sesión en el SessionManager para la pestaña actual
- **Logout**: `authService.logout()` solo limpia la sesión de la pestaña actual, sin afectar otras pestañas
- **Obtener Usuario**: `authService.getCurrentUser()` y `getSafeSession()` consultan primero el SessionManager

### Hook useAuth

- **Prioridad de Sesión**: Verifica primero la sesión de la pestaña, luego el contexto global
- **Logout Independiente**: `handleLogout()` solo afecta la pestaña actual

## Funcionalidades

### ✅ Multi-Usuario Simultáneo
- Múltiples usuarios pueden estar logueados en diferentes pestañas
- Cada pestaña mantiene su propia sesión independiente
- Los logout no afectan otras pestañas

### ✅ Persistencia por Pestaña
- La sesión se mantiene al recargar la página
- ID único por pestaña para evitar conflictos
- Limpieza automática al cerrar pestaña

### ✅ Gestión de Actividad
- Monitoreo de actividad para limpiar sesiones inactivas
- Timeout configurable (30 minutos por defecto)
- Actualización automática de última actividad

### ✅ Compatibilidad
- Compatible con el sistema existente de Supabase
- Mantiene todas las funcionalidades de autenticación
- No requiere cambios en componentes existentes

## Uso

### Login Normal
```typescript
const { user, error } = await authService.login(email, password)
// La sesión se guarda automáticamente para esta pestaña
```

### Logout de Pestaña Actual
```typescript
await authService.logout()
// Solo cierra la sesión de esta pestaña
```

### Logout Global (si se necesita)
```typescript
await authService.logoutGlobal()
// Cierra todas las sesiones de todas las pestañas
```

### Obtener Usuario Actual
```typescript
const { user } = useAuth()
// Devuelve el usuario de la sesión de esta pestaña
```

## Flujo de Sesiones

1. **Login**: Usuario ingresa credenciales → Supabase autentica → SessionManager guarda en pestaña
2. **Navegación**: Componentes usan useAuth → SessionManager devuelve usuario de la pestaña
3. **Nueva Pestaña**: Se puede logear otro usuario → Nueva sesión independiente
4. **Logout**: Usuario cierra sesión → Solo se limpia la pestaña actual
5. **Inactividad**: Después de 30 minutos → Sesión se limpia automáticamente

## Beneficios

- **Aislamiento**: Cada pestaña es independiente
- **No Interferencia**: El logout de una pestaña no afecta otras
- **Escalabilidad**: Soporta múltiples usuarios simultáneos
- **Limpieza**: Gestión automática de sesiones inactivas
- **Compatibilidad**: Funciona con el sistema existente

## Notas Técnicas

- El `sessionStorage` se limpia automáticamente al cerrar la pestaña
- Cada pestaña tiene un TabID único generado al cargar
- Las sesiones inactivas se limpian cada 5 minutos
- El sistema mantiene compatibilidad con todos los flows existentes de autenticación