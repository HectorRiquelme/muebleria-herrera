# PROJECT_CONTEXT.md — Estado del Proyecto

> Ultima actualizacion: 23 marzo 2026. Desplegado en produccion (GCP VM 34.46.122.42).

## Resumen

ERP liviano para Muebleria Herrera (Chile). Monorepo con 2 apps SvelteKit + PocketBase.
Funciona en local (Windows) y en produccion (Google Cloud VM e2-micro, Debian 12).

## Arquitectura

```
[Browser]
    |
    +-- GET/POST --> [SvelteKit Admin :5175]
    |                     |
    |               hooks.server.ts (auth, locals.pb, locals.user)
    |                     |
    |               +layout.server.ts (allowedModules, pendingDeleteRequests)
    |                     |
    |               +page.server.ts (load + actions + audit_log)
    |                     |
    |               +page.svelte (SSR + hydration)
    |
    +-- GET -------> [SvelteKit Web :5174]
    |                     |
    |               +page.server.ts (PocketBase directo, sin auth)
    |               +page.svelte (landing publica)
    |
    +-- REST ------> [PocketBase :8090] (SQLite + JWT + files)
```

## Modulos del panel admin (15)

| Modulo | Ruta | Rol | Descripcion |
|---|---|---|---|
| Dashboard | /dashboard | todos | Stats + ventas recientes + productos recientes |
| Productos | /productos | todos | CRUD + fotos + barcodes + filtros + export |
| Categorias | /categorias | todos | CRUD en tabla + export |
| Facturas | /facturas | todos | CRUD + archivo adjunto + filtros + export |
| Inventario | /inventario | todos | Listado + checkboxes + mark/unmark + export |
| Ventas | /ventas | todos | CRUD comprobantes + carrito + export PDF individual/masivo |
| Clientes | /clientes | todos | CRUD + cliente frecuente + filtros + export |
| Estadisticas | /estadisticas | admin | 3 graficas Chart.js + tabla top productos |
| Auditoria | /auditoria | admin | Listado + filtros + limpiar con confirmacion + export |
| Permisos | /permisos | admin | UI toggles de acciones por worker (11 permisos) |
| Acceso | /acceso | admin | UI toggles de modulos por worker |
| Solicitudes | /solicitudes | admin | Bandeja de solicitudes de eliminacion |
| Usuarios | /usuarios | admin | CRUD de usuarios + rol + contrasena |
| Landing Web | /landing | admin | Subida/gestion de imagenes del carrusel |
| Respaldos | /respaldos | admin | Export/import ZIP con data JSON + archivos |

## Colecciones PocketBase (12 activas)

users, products, categories, invoices, vouchers, voucher_items, clients, audit_logs, landing_images, delete_requests, user_permissions, module_access

## Campos de archivo por coleccion

| Coleccion | Campo | Tipo | Max archivos | Max tamano |
|---|---|---|---|---|
| products | photos | file[] | 10 | 5MB c/u |
| invoices | file | file | 1 | 10MB |
| vouchers | images | file[] | 5 | 5MB c/u |
| landing_images | image | file | 1 | 10MB |

URL de archivos: `{PB_URL}/api/files/{collectionId}/{recordId}/{filename}?thumb={size}`

## Estado validado (22 marzo 2026)

- Build admin: **OK**
- Build web: **OK**
- svelte-check admin: **0 errores** / 54 warnings
- svelte-check web: **0 errores** / 3 warnings
- Permisos server-side workers: implementados en create/update de productos, ventas, clientes, facturas, categorias (create+update), inventario (mark).
- Flujo "Solicitar eliminacion": implementado en productos, ventas, clientes, facturas, categorias.
- Moneda: `formatCurrency` usa `es-CL` y `CLP`.
- `pb_schema.json`: sincronizado a 12 colecciones + campo `can_edit_categories`.
- Auth: `PUBLIC_ROUTES` solo `['/login']`. Todos los endpoints bajo `/api` requieren auth.
- Codigo legacy: `pb.ts` y `audit.ts` eliminados (usaban svelte/store).
- Accesibilidad: `aria-label` en 8 botones de icono (logout, sidebar, 6 modales).
- Auto-cancelacion PB: mitigado con `autoCancellation(false)` en solicitudes y dashboard.
- Modulo respaldos: export ZIP (data + archivos) + import con validacion de manifest y orden de FKs.

## Deuda tecnica residual

1. **Warnings de svelte-check (54 admin + 3 web):** Mayormente `a11y_consider_explicit_label` y tipos inferidos. No bloquean build ni runtime.
2. **`inventario/unmarkInventory`:** No verifica `user_permissions`. Gap menor (solo admin usa esta accion).
3. **Migracion `can_edit_categories`:** Archivo creado en `pb/pb_migrations/`, pendiente de ejecutar (se aplica al reiniciar PocketBase).

## Produccion — Google Cloud VM

| Campo | Valor |
|---|---|
| **IP** | `34.46.122.42` |
| **VM** | e2-micro, Debian 12, 30GB disco estandar, us-central1-c |
| **Costo** | Free Tier (730h/mes gratis, cubre 24/7). Creditos $257K CLP hasta jun 2026. |
| **PocketBase** | v0.25.9, systemd, puerto 8090 interno |
| **Admin app** | Node.js + SvelteKit build, systemd, puerto 3000 interno |
| **Web app** | Node.js + SvelteKit build, systemd, puerto 5174 interno |
| **Reverse proxy** | Caddy en puerto 80 (web+PB) y 5175 (admin) |
| **DB** | Copia de data.db local subida via SSH |

### URLs
| Servicio | URL |
|---|---|
| Web publica | http://34.46.122.42/ |
| Panel admin | http://34.46.122.42:5175/ |
| PocketBase admin | http://34.46.122.42/_/ |

### Credenciales produccion
- Panel admin: `admin@herrera.com` / `123456`
- PB superadmin: `hectorariquelmec@gmail.com` / `MuebleriaHerrera2026`

### Proceso de deploy (actualizaciones)
1. `git push` desde local
2. SSH a la VM: `sudo -s`
3. `cd /opt/muebleria-herrera && git pull origin master`
4. `cd apps/admin && npm run build` (y/o apps/web)
5. `systemctl restart muebleria-admin` (y/o muebleria-web)

### Plataformas descartadas
- PocketHost: requiere plan pago
- Fly.io: sin free tier para nuevos usuarios
- Render: filesystem efimero (incompatible con SQLite)

## Archivos de deploy

| Archivo | Proposito |
|---|---|
| `deploy/01-setup-vm.sh` | Instala Node.js, Caddy, dependencias |
| `deploy/02-install-pb.sh` | Descarga e instala PocketBase |
| `deploy/03-install-apps.sh` | Clona repo, instala deps, build |
| `deploy/04-services.sh` | Crea servicios systemd + Caddyfile |
| `deploy/deploy-all.sh` | Ejecuta los 4 scripts en orden |
| `deploy/status.sh` | Verifica estado de servicios |
| `deploy/update.sh` | Pull + rebuild + restart |
