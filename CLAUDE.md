# CLAUDE.md — Reglas y Convenciones para Claude Code

> Este archivo es leido automaticamente por Claude Code al iniciar sesion en este directorio.

## Proyecto

Plataforma de Gestion — Muebleria Herrera. ERP liviano + web publica. Monorepo en `muebleria-herrera/`.

## Comandos de desarrollo

```bash
# Iniciar todo (Windows)
cd muebleria-herrera && start-dev.bat

# Dev individual
npm run dev:admin    # Admin en localhost:5175
npm run dev:web      # Web en localhost:5174

# PocketBase
cd pb && ./pocketbase.exe serve --http=0.0.0.0:8090

# Build
npm run build:admin
npm run build:web

# Typecheck
cd apps/admin && npx svelte-check
cd apps/web && npx svelte-check

# Sync types (resuelve errores $types en LSP)
cd apps/admin && npx svelte-kit sync
cd apps/web && npx svelte-kit sync
```

## Convenciones de codigo

### Svelte 5 — Solo runes
```svelte
<!-- CORRECTO -->
let count = $state(0);
let doubled = $derived(count * 2);
$effect(() => { console.log(count); });
let { data } = $props();

<!-- INCORRECTO — NO USAR -->
import { writable } from 'svelte/store';
const count = writable(0);
```

### Nombrado
- Rutas SvelteKit: kebab-case (`/ventas`, `/productos`)
- Colecciones PocketBase: snake_case (`audit_logs`, `delete_requests`)
- Archivos lib: camelCase (`yearFilter.ts`, `workerModules.ts`)
- Variables Svelte 5: sin prefijo `$` en el nombre (`count`, no `$count`)

### Patrones obligatorios

**Auditoria en toda action:**
```typescript
await pb.collection('audit_logs').create({
    user: locals.user?.id,
    action: 'create',
    collection: 'products',
    record_id: record.id,
    description: 'Producto creado: ' + record.name,
    old_data: '',
    new_data: JSON.stringify(record)
}).catch(() => {});
```

**PocketBase — evitar auto-cancelacion:**
```typescript
// CORRECTO: secuencial
const items = await pb.collection('products').getList(1, 20);
const years = await getCollectionYears(pb, 'products');

// CORRECTO: desactivar auto-cancelacion si layout consulta la misma coleccion
pb.autoCancellation(false);
const requests = await pb.collection('delete_requests').getFullList();

// INCORRECTO: paralelo con misma coleccion que layout
const [items, years] = await Promise.all([...]);  // NUNCA
```

**Verificacion de rol en actions:**
```typescript
if (locals.user?.role !== 'admin') {
    return fail(403, { error: 'Sin permisos' });
}
```

**Verificacion de permisos para workers:**
```typescript
if (locals.user?.role === 'worker') {
    const perms = await locals.pb.collection('user_permissions')
        .getFirstListItem(`user = "${locals.user.id}"`)
        .catch(() => null);
    if (perms !== null && perms.can_create_products === false)
        return fail(403, { error: 'No tienes permiso para crear productos' });
}
```

**Expand de relaciones:**
```typescript
const record = await pb.collection('vouchers').getOne(id, { expand: 'client' });
const clientName = record.expand?.client?.name ?? 'Sin cliente';
```

### Colores del sistema de diseno (TailwindCSS v4)
```
Primary brown:  #8B5E3C
Accent gold:    #D4A853
Text dark:      #2C2018
Text muted:     #7A6652
Background:     #FAFAF8
Border:         #E5E0D8
```

### Idioma
- UI, labels, mensajes de error: **espanol**
- Codigo (variables, funciones): ingles
- No agregar texto en ingles a la interfaz

## Restricciones criticas

1. No poner `getCollectionYears()` en `Promise.all`
2. No exportar constantes desde `+page.server.ts` (error de build SvelteKit)
3. No cambiar nombres de colecciones PocketBase
4. No cambiar puertos (5175, 5174, 8090) — `strictPort: true`
5. No instalar dependencias sin confirmar con el usuario
6. No usar stores de Svelte 4
7. Exports solo exportan la pagina visible, no todos los registros
8. El filtro de ano usa `created` (campo automatico PB), no campos de fecha de negocio

## Estructura de un modulo tipico

```
routes/(app)/productos/
├── +page.server.ts    ← load() + actions (create, update, delete, requestDelete)
└── +page.svelte       ← UI con $props(), formularios, tabla paginada
```

Cada `+page.server.ts` debe:
1. `load()`: consultar PB, retornar datos paginados + years
2. `actions`: validar rol + permisos, ejecutar operacion, crear audit_log
3. Queries secuenciales (nunca Promise.all con getCollectionYears)

## Datos de contacto de la web publica (definitivos)

- WhatsApp (movil): +56 9 6875 3831
- Telefono fijo: +56 44 367 4412
- Direccion: Anibal Pinto 253, Parral, Region del Maule
- Horario: Lun-Vie 9:30-18:30 | Sab 10:00-13:00
- Instagram: https://instagram.com/muebleria.herrera
- Facebook: https://facebook.com/muebleriaherrera
