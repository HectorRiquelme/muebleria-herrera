# NEXT_STEPS.md — Pendientes Priorizados

> Ultima actualizacion: 23 marzo 2026. Deploy a produccion completado. P1-P9 resueltos. 0 errores svelte-check.

---

## Pendientes abiertos

### D1 — Configurar HTTPS con dominio propio
- **Que se hizo:** Caddy esta configurado en puerto 80 (HTTP). Funciona con IP directa.
- **Que falta:** Comprar/configurar dominio, apuntar DNS a 34.46.122.42, Caddy genera HTTPS automaticamente.
- **Siguiente paso exacto:** Decidir dominio (ej: muebleriaherrera.cl), comprar, configurar DNS A record → 34.46.122.42, actualizar Caddyfile con el dominio.

### D2 — Sincronizar `autoCancellation(false)` entre local y produccion
- **Que se hizo:** En produccion, `hooks.server.ts` tiene `pb.autoCancellation(false)` global. En local no.
- **Que falta:** Decidir si agregar el `autoCancellation(false)` al hooks.server.ts local tambien, o dejarlo solo en produccion.
- **Archivo:** `apps/admin/src/hooks.server.ts`
- **Siguiente paso exacto:** Agregar `pb.autoCancellation(false)` en el hooks.server.ts del repo local, commit, push, pull en VM.

### D3 — Probar modulo de respaldos en runtime
- **Que se hizo:** Modulo `/respaldos` implementado con export ZIP e import con validacion. Build OK.
- **Que falta:** Probar con datos reales en produccion o local.
- **Siguiente paso exacto:** Ir a `http://34.46.122.42/respaldos`, probar exportar, verificar ZIP, probar importar.

### D4 — Verificar `inventario/unmarkInventory` permisos
- **Que se hizo:** `markInventory` valida `can_manage_inventory`. `unmarkInventory` solo verifica rol admin.
- **Que falta:** Decidir si es intencional o un gap.
- **Archivo:** `apps/admin/src/routes/(app)/inventario/+page.server.ts`

### D5 — Ejecutar migracion `can_edit_categories` en PocketBase produccion
- **Archivo:** `pb/pb_migrations/1774000000_add_can_edit_categories.js`
- **Que falta:** La migracion existe en el repo pero PB produccion usa data.db copiada de local. Si local no ejecuto la migracion, produccion tampoco la tiene.
- **Siguiente paso exacto:** En la VM, reiniciar PB para que aplique migraciones pendientes. Verificar en `/_/` que `user_permissions` tiene `can_edit_categories`.

### D6 — Unificar version de PocketBase local vs produccion
- **Local:** PB v0.22.9 (binario Windows)
- **Produccion:** PB v0.25.9 (binario Linux)
- **SDK:** v0.26.8
- **Riesgo:** El schema format cambio entre versiones (`schema` vs `fields`). Importar via API entre versiones puede fallar.
- **Siguiente paso:** Evaluar actualizar PB local a v0.25.9, o mantener y documentar las diferencias.

---

## Resuelto en esta sesion

### Deploy a Google Cloud (sesion completa)
- VM e2-micro creada en us-central1-c, Debian 12, 30GB disco estandar
- PocketBase v0.25.9 instalado (actualizado desde v0.22.9 → v0.25.9 → v0.27.2 → v0.25.9)
- Schema importado via creacion individual de colecciones (import masivo fallo por IDs)
- Solucion final: copiar `data.db` local a produccion via SSH upload
- Caddy configurado como reverse proxy en puerto 80
- 3 servicios systemd: pocketbase, muebleria-admin, muebleria-web
- `hooks.server.ts` en produccion tiene `pb.autoCancellation(false)` global
- Firewall HTTP/HTTPS habilitado en GCP
- Regla firewall `allow-admin-5175` creada (no usada, admin corre via Caddy en :80)

### Lecciones aprendidas del deploy
1. **PB import via API es fragil:** Los IDs de colecciones (`"id": "categories"`) colisionan con nombres en PB v0.25+. Solucion: crear colecciones una por una o copiar data.db.
2. **`sort` falla con DB corrupta:** Cuando se importa schema con IDs incorrectos, las queries con `sort` devuelven 400 aunque sin sort funcionan.
3. **Version SDK ≠ version PB server:** SDK v0.26.8 NO es compatible con PB v0.27.2 (endpoints de auth cambiaron). Mantener SDK y PB en versiones alineadas.
4. **`pb.autoCancellation(false)` es obligatorio en SSR:** SvelteKit ejecuta layout + page loads en paralelo sobre la misma instancia PB. Sin desactivar auto-cancelacion, las requests se cancelan mutuamente.

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
- Export ZIP + import con validacion. Pendiente testing en runtime.
