# NEXT_STEPS.md — Pendientes Priorizados

> Ultima actualizacion: 23 marzo 2026 (sesion nocturna, 2da ronda). D2, D7 sincronizados al repo. WhatsApp corregido.

---

## Pendientes abiertos

### D1 — Configurar HTTPS con dominio propio
- **Que se hizo:** Caddy configurado en puertos 80 y 5175 (HTTP). Funciona con IP directa `34.46.122.42`.
- **Que falta:** Comprar dominio, apuntar DNS, Caddy genera HTTPS automaticamente.
- **Siguiente paso exacto:** Decidir dominio (ej: muebleriaherrera.cl), comprar, configurar DNS A record → 34.46.122.42, actualizar `/etc/caddy/Caddyfile` con el dominio.

### ~~D2 — Sincronizar `autoCancellation(false)` entre local y produccion~~ ✅ RESUELTO
- **Que se hizo:** `pb.autoCancellation(false)` agregado globalmente en `hooks.server.ts` del repo local. Ahora local y produccion estan sincronizados.
- **Archivo:** `apps/admin/src/hooks.server.ts`

### D3 — Probar modulo de respaldos en runtime
- **Que se hizo:** Modulo `/respaldos` implementado con export ZIP e import con validacion. Build OK.
- **Que falta:** Probar con datos reales en produccion.
- **Siguiente paso exacto:** Ir a `http://34.46.122.42:5175/respaldos`, probar exportar, verificar ZIP, probar importar.

### ~~D4 — Verificar `inventario/unmarkInventory` permisos~~ ✅ RESUELTO
- **Que se hizo:** `unmarkInventory` ahora valida `can_manage_inventory` para workers, igual que `markInventory`. Consistencia completa.
- **Archivo:** `apps/admin/src/routes/(app)/inventario/+page.server.ts`

### D5 — Ejecutar migracion `can_edit_categories` en PocketBase produccion
- **Archivo:** `pb/pb_migrations/1774000000_add_can_edit_categories.js`
- **Que falta:** La migracion existe en el repo pero PB produccion usa data.db copiada de local. Si local no ejecuto la migracion, produccion tampoco la tiene.
- **Siguiente paso exacto:** En la VM, reiniciar PB: `systemctl restart pocketbase`. Verificar en `http://34.46.122.42/_/` que `user_permissions` tiene `can_edit_categories`.

### D6 — Unificar version de PocketBase local vs produccion
- **Local:** PB v0.22.9 (binario Windows)
- **Produccion:** PB v0.25.9 (binario Linux)
- **SDK:** v0.26.8
- **Riesgo:** El schema format cambio entre versiones (`schema` vs `fields`). Importar via API entre versiones falla por IDs de colecciones.
- **Siguiente paso:** Evaluar actualizar PB local a v0.25.9 o mantener y documentar.

### ~~D7 — Sincronizar `BODY_SIZE_LIMIT` y `bodyParser` config~~ ✅ RESUELTO
- **Que se hizo:** `export const config = { bodyParser: { sizeLimit: '20mb' } }` agregado a `landing/+page.server.ts` en el repo local. `BODY_SIZE_LIMIT=Infinity` se mantiene solo en produccion (variable de entorno en systemd).
- **Archivo:** `apps/admin/src/routes/(app)/landing/+page.server.ts`

### D8 — Texto web publica: contenido generico pendiente de personalizar
- **Que se hizo:** Corregido "Mas de 50 anos de experiencia" (commit `63e51bd`).
- **Que falta:** Revisar otros textos genericos en la web publica que necesitan datos reales del negocio.
- **Archivo:** `apps/web/src/routes/+page.svelte`
- **Textos a revisar:**
  - "empresa familiar con anos de experiencia" (linea ~225) — confirmar si 50 anos es correcto
  - Seccion "Quienes somos" — personalizar con historia real del negocio
  - Grid de stats (Experiencia en muebles, Clientes satisfechos, etc.) — agregar numeros reales si hay

---

## Configuracion actual de produccion

### URLs
| Servicio | URL |
|---|---|
| Web publica | http://34.46.122.42/ |
| Panel admin | http://34.46.122.42:5175/ |
| PocketBase admin | http://34.46.122.42/_/ |

### Credenciales
- Panel admin: `admin@herrera.com` / `123456`
- PB superadmin: `hectorariquelmec@gmail.com` / `MuebleriaHerrera2026`

### Caddy routing (`/etc/caddy/Caddyfile`)
```
:80 → /api/* y /_/* → PocketBase :8090
:80 → default → Web :5174
:5175 → Admin :3000
```

### Servicios systemd
| Servicio | Puerto interno | Archivo |
|---|---|---|
| `pocketbase.service` | 8090 | `/etc/systemd/system/pocketbase.service` |
| `muebleria-admin.service` | 3000 | `/etc/systemd/system/muebleria-admin.service` |
| `muebleria-web.service` | 5174 | `/etc/systemd/system/muebleria-web.service` |

### Variables de entorno produccion (en servicios systemd)
- Admin: `PORT=3000`, `HOST=127.0.0.1`, `PB_URL=http://127.0.0.1:8090`, `ORIGIN=http://34.46.122.42`, `BODY_SIZE_LIMIT=Infinity`
- Web: `PORT=5174`, `HOST=127.0.0.1`, `PB_URL=http://127.0.0.1:8090`

### .env produccion (build-time)
- `VITE_PB_URL=http://34.46.122.42` (para URLs de archivos en el browser)
- `PB_URL=http://127.0.0.1:8090` (para queries server-side)

### Diferencias produccion vs repo local
| Archivo/Config | Repo local | Produccion VM |
|---|---|---|
| `hooks.server.ts` | ~~Sin `autoCancellation(false)`~~ → **Sincronizado** | Con `autoCancellation(false)` global |
| `landing/+page.server.ts` | ~~Sin bodyParser config~~ → **Sincronizado** | Con `export const config = { bodyParser: { sizeLimit: '20mb' } }` |
| `.env` admin/web | `VITE_PB_URL=http://localhost:8090` | `VITE_PB_URL=http://34.46.122.42` |
| `svelte.config.js` admin | Sin csrf config | Con `csrf: { checkOrigin: false }` |
| PocketBase version | v0.22.9 | v0.25.9 |

### Proceso de deploy (actualizaciones)
```bash
# Desde local
git push origin master

# En la VM (SSH)
sudo -s
cd /opt/muebleria-herrera && git pull origin master
cd apps/admin && npm run build   # si cambio admin
cd apps/web && npm run build     # si cambio web
systemctl restart muebleria-admin  # si cambio admin
systemctl restart muebleria-web    # si cambio web
```

---

## Resuelto en esta sesion

### Deploy a Google Cloud
- VM e2-micro creada en us-central1-c, Debian 12, 30GB disco estandar
- PocketBase v0.25.9 instalado (trayectoria: v0.22.9 → v0.25.9 → v0.27.2 → v0.26.0 → v0.25.9)
- Import de schema via API fallo multiples veces por conflictos de IDs
- **Solucion final:** copiar `data.db` local a produccion via SSH upload — funciono perfecto
- Caddy como reverse proxy: :80 para web+PB, :5175 para admin
- 3 servicios systemd activos
- Firewall GCP: HTTP, HTTPS y puerto 5175 abiertos
- `hooks.server.ts` en VM tiene `pb.autoCancellation(false)` global (resuelve error 500 en todas las paginas)
- `BODY_SIZE_LIMIT=Infinity` en servicio admin (resuelve error 500 al subir imagenes > 512KB)
- `VITE_PB_URL=http://34.46.122.42` en .env produccion (resuelve URLs de imagenes en browser)
- Separacion admin en :5175 (resuelve conflicto de `/_app/*` entre admin y web)
- Texto "Mas de 50 anos de experiencia" corregido en web publica
- WhatsApp corregido a numero movil +56 9 6875 3831. Telefono fijo +56 44 367 4412 agregado en contacto y footer.
- D2 sincronizado: `autoCancellation(false)` global ahora en repo local
- D7 sincronizado: `bodyParser sizeLimit 20mb` ahora en repo local

### Lecciones aprendidas del deploy
1. **PB import via API es fragil:** IDs de colecciones colisionan con nombres en PB v0.25+. Solucion: copiar data.db directamente.
2. **`sort` falla con DB corrupta:** Import con IDs incorrectos corrompe indices internos. Queries con `sort` devuelven 400.
3. **Version SDK ≠ version PB server:** SDK v0.26.8 incompatible con PB v0.27.2 (endpoints de auth cambiaron).
4. **`pb.autoCancellation(false)` obligatorio en SSR:** SvelteKit ejecuta layout + page en paralelo. Sin desactivar, las requests se cancelan.
5. **`/_app/*` compartido:** Si admin y web corren en el mismo puerto, sus assets `/_app/*` colisionan. Solucion: puertos separados.
6. **`BODY_SIZE_LIMIT`:** SvelteKit con adapter-node limita body a 512KB por defecto. Se configura via variable de entorno, no en svelte.config.js.

---

## Resuelto en sesiones anteriores

### P1-P9 (correcciones de codigo)
- P1: Typecheck baseline (@types/node, app.d.ts, User type)
- P2: Auto-cancelacion delete_requests (solicitudes, dashboard)
- P3: Audit logs faltantes (landing, auditoria)
- P4: Permisos categorias (can_edit_categories)
- P5: Codigo legacy svelte/store eliminado
- P6: Seguridad /api (removido de PUBLIC_ROUTES)
- P7: Plan de despliegue → completado como deploy GCP
- P8: Accesibilidad (aria-labels)
- P9: Limpieza dependencias web

### Typecheck completo
- 20 errores corregidos. Resultado: 0 errores en ambas apps.

### Modulo Respaldos
- Export ZIP + import con validacion. Pendiente testing en runtime (D3).
