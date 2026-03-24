# AGENTS.md — Plataforma de Gestion Muebleria Herrera

> Instrucciones para agentes de IA que trabajen en este proyecto.

## Identidad del proyecto

- **Nombre:** Plataforma de Gestion — Muebleria Herrera
- **Tipo:** ERP liviano para muebleria chilena + pagina web publica
- **Ruta raiz:** `muebleria-herrera/`
- **Estado:** Funcional en local (Windows) y en produccion (Google Cloud VM).

## Stack (definitivo — no cambiar)

- **Frontend:** SvelteKit ^2.50.2, Svelte 5 con runes, TailwindCSS v4 (via @tailwindcss/vite, sin tailwind.config.js), TypeScript
- **Backend:** PocketBase v0.25.9 en produccion, v0.22.9 local (binario, REST + SQLite embebido + auth JWT + file storage)
- **Build:** Vite ^7.3.1, adapter-node en ambas apps
- **Librerias admin:** Chart.js, jsPDF, xlsx, bwip-js, jszip, clsx + tailwind-merge, bits-ui, lucide-svelte

## Estructura del monorepo

```
muebleria-herrera/
├── apps/admin/     ← Panel de administracion (SvelteKit, puerto 5175)
├── apps/web/       ← Pagina web publica (SvelteKit, puerto 5174)
├── pb/             ← PocketBase binario + schema + datos (puerto 8090)
├── deploy/         ← Scripts de deploy para Google Cloud VM
├── packages/       ← Vacio actualmente
├── package.json    ← Monorepo con npm workspaces
└── start-dev.bat   ← Lanza los 3 procesos en Windows
```

## Puertos fijos (strictPort: true — no cambiar)

| Servicio | Puerto |
|---|---|
| Admin panel | 5175 |
| Web publica | 5174 |
| PocketBase API | 8090 |
| PocketBase panel interno | 8090/_/ |

## Credenciales

### Local
- Panel admin: `admin@herrera.com` / `123456`
- PocketBase superadmin: `admin@herrera.com` / `12345678`

### Produccion (IP: 34.46.122.42)
- Panel admin: `admin@herrera.com` / `123456`
- PocketBase superadmin: `hectorariquelmec@gmail.com` / `MuebleriaHerrera2026`

## Reglas obligatorias para agentes

1. **Leer antes de modificar.** Usar Read tool en el archivo antes de proponer cambios.
2. **No cambiar el stack.** SvelteKit + PocketBase + TailwindCSS v4 + TypeScript es definitivo.
3. **Solo runes de Svelte 5.** Usar `$state`, `$derived`, `$effect`, `$props`. NUNCA `writable`, `readable`, `derived` de `svelte/store`.
4. **Queries secuenciales a PocketBase.** No poner `getCollectionYears()` en `Promise.all`. Nunca queries paralelas a la misma coleccion entre layout y page. Usar `pb.autoCancellation(false)` si layout y page consultan la misma coleccion.
5. **No exportar constantes desde `+page.server.ts`.** Causa error de build. Mover a `$lib/`.
6. **No cambiar nombres de colecciones PocketBase.** Tienen IDs predefinidos y relaciones cruzadas.
7. **No cambiar los puertos** (5175, 5174, 8090).
8. **Patron de auditoria obligatorio** en toda action que escriba datos en PocketBase:
   ```typescript
   await pb.collection('audit_logs').create({
       user: locals.user?.id,
       action: 'create' | 'update' | 'delete',
       collection: 'nombre_coleccion',
       record_id: record.id,
       description: 'Descripcion legible en espanol',
       old_data: JSON.stringify({...}) || '',
       new_data: JSON.stringify({...}) || ''
   }).catch(() => {}); // NUNCA bloquear la operacion por fallo de auditoria
   ```
9. **Interfaz en espanol.** Todo texto visible, label y mensaje de error en espanol.
10. **No proponer refactor masivo** sin que el usuario lo pida.
11. **`user_permissions` implementado server-side** en create/update de productos, ventas, clientes, facturas, categorias (create+update), inventario (mark). Falta en: `inventario/unmarkInventory`.
12. **Flujo `requestDelete` para workers implementado** en productos, ventas, clientes, facturas y categorias. El lado admin (aprobar/rechazar en /solicitudes) funciona.
13. **El proyecto esta en produccion** en GCP VM `34.46.122.42`. Cambios requieren rebuild + restart en la VM.
14. **Campo `user` en relaciones PocketBase** se guarda como ID string. Para mostrar datos: `expand: 'user'` → `record.expand?.user?.name`.
15. **Exports exportan solo la pagina visible** (20-30 registros), no el total filtrado.
16. **`/api` ya NO es ruta publica.** Solo `/login` es publica. Todos los endpoints bajo `/api` requieren auth.

## Archivos clave (leer primero)

| Archivo | Responsabilidad |
|---|---|
| `apps/admin/src/hooks.server.ts` | Middleware: auth, locals.pb, locals.user (tipo User), cookie pb_auth. PUBLIC_ROUTES solo `/login`. |
| `apps/admin/src/app.d.ts` | App.Locals usa `User` de `$lib/types.ts` (no AuthModel) |
| `apps/admin/src/routes/(app)/+layout.server.ts` | Auth check, allowedModules para workers, pendingDeleteRequests para admin |
| `apps/admin/src/routes/(app)/+layout.svelte` | Sidebar (15 items), navbar, badge solicitudes, filtrado por rol |
| `apps/admin/src/lib/types.ts` | Todas las interfaces TypeScript del dominio |
| `apps/admin/src/lib/utils.ts` | formatDate, formatCurrency (es-CL/CLP), generateSKU, labels/colors |
| `apps/admin/src/lib/worker-modules.ts` | WORKER_MODULES: fuente de verdad de modulos accesibles por workers |
| `apps/admin/src/lib/export.ts` | Funciones de exportacion CSV/PDF/Excel por modulo |
| `apps/admin/src/lib/year-filter.ts` | addCreatedYearFilter, getCollectionYears |
| `apps/admin/src/lib/backup.ts` | Constantes para respaldos: FILE_FIELDS, IMPORT_ORDER, DELETE_ORDER |

## Colecciones PocketBase (12 activas)

users, products, categories, invoices, vouchers, voucher_items, clients, audit_logs, landing_images, delete_requests, user_permissions, module_access

## Produccion — Google Cloud VM

| Campo | Valor |
|---|---|
| IP | 34.46.122.42 |
| VM | e2-micro, Debian 12, 30GB disco, us-central1-c |
| PocketBase | v0.25.9, systemd `pocketbase.service`, puerto 8090 interno |
| Admin app | Node.js, systemd `muebleria-admin.service`, puerto 3000 interno |
| Web app | Node.js, systemd `muebleria-web.service`, puerto 5174 interno |
| Reverse proxy | Caddy en puerto 80, rutea por path |
| Deploy | `git pull` + `npm run build` + `systemctl restart` |
| hooks.server.ts | Tiene `pb.autoCancellation(false)` global en produccion |

### URLs produccion
- Web publica: http://34.46.122.42/
- Panel admin: http://34.46.122.42:5175/
- PocketBase admin: http://34.46.122.42/_/

### Caddy routing
- `:80` → `/api/*` y `/_/*` → PocketBase :8090
- `:80` → default → Web :5174
- `:5175` → Admin :3000 (puerto separado, evita conflicto `/_app/*`)

## Riesgos activos

- **Auto-cancelacion SDK PocketBase:** Mitigado con `pb.autoCancellation(false)` global en hooks.server.ts de produccion. En local, solo en solicitudes y dashboard.
- **Permisos workers:** `inventario/unmarkInventory` no verifica `user_permissions`. Gap menor (solo admin puede desmarcar).
- **`$types` LSP:** Errores `Cannot find module './$types'` son falsos positivos. Se resuelven con `npx svelte-kit sync`.
- **PB version mismatch:** Local usa v0.22.9, produccion usa v0.25.9. SDK es v0.26.8. Funciona pero importar schema via API requiere cuidado con IDs de colecciones.
