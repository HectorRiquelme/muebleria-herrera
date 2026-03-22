# Mueblería Herrera — Plataforma de gestión

Sistema completo para la gestión de una mueblería: panel administrativo, página web pública y backend.

---

## Stack tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| Framework frontend | SvelteKit | ^2.50.2 |
| UI / reactividad | Svelte 5 (runes) | ^5.51.0 |
| Estilos | TailwindCSS | ^4.2.1 |
| Backend + base de datos | PocketBase | 0.22.9 |
| SDK cliente PocketBase | pocketbase (JS) | ^0.26.8 |
| Build tool | Vite | ^7.3.1 |
| Lenguaje | TypeScript | ^5.9.3 |
| Gráficas | Chart.js | ^4.5.1 |
| Exportación PDF | jsPDF | ^4.2.0 |
| Exportación Excel/CSV | xlsx | ^0.18.5 |
| Generación de códigos de barra | bwip-js | ^4.8.0 |
| Runtime Node.js | @sveltejs/adapter-node | ^5.5.4 |

---

## Usuarios y credenciales

| Usuario | Email | Contraseña | Rol |
|---|---|---|---|
| Administrador (panel) | `admin@herrera.com` | `123456` | admin |
| Superadmin PocketBase | `admin@herrera.com` | `12345678` | superadmin PB |
| Empleado de ejemplo | `Benaldo@Jaidar.com` | *(definida al crear)* | worker |

> **Nota:** El superadmin de PocketBase (`12345678`) se usa para acceder al panel interno `http://localhost:8090/_/`. El usuario admin del panel (`123456`) se usa para loguearse en la plataforma en `http://localhost:5175`.

---

## URLs de desarrollo

| URL | Descripción |
|---|---|
| `http://localhost:5175` | Panel administrativo |
| `http://localhost:5174` | Página web pública |
| `http://localhost:8090` | API REST de PocketBase |
| `http://localhost:8090/_/` | Panel interno de PocketBase |

---

## Estructura del proyecto

```
muebleria-herrera/
├── apps/
│   ├── admin/                  ← Panel de administración (SvelteKit)
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   ├── login/          ← Pantalla de inicio de sesión
│   │   │   │   └── (app)/          ← Módulos protegidos (requieren auth)
│   │   │   │       ├── dashboard/
│   │   │   │       ├── productos/
│   │   │   │       ├── categorias/
│   │   │   │       ├── facturas/
│   │   │   │       ├── inventario/
│   │   │   │       ├── ventas/
│   │   │   │       ├── clientes/
│   │   │   │       ├── estadisticas/
│   │   │   │       ├── auditoria/
│   │   │   │       ├── permisos/
│   │   │   │       ├── acceso/
│   │   │   │       ├── solicitudes/
│   │   │   │       ├── usuarios/
│   │   │   │       └── landing/
│   │   │   └── lib/
│   │   │       ├── types.ts        ← Interfaces TypeScript
│   │   │       ├── utils.ts        ← Helpers, labels, formatos
│   │   │       ├── export.ts       ← PDF / CSV / Excel
│   │   │       ├── barcode.ts      ← Generación de códigos
│   │   │       ├── audit.ts        ← Registro de auditoría
│   │   │       ├── year-filter.ts  ← Filtro por año en queries
│   │   │       └── worker-modules.ts ← Definición de módulos para workers
│   │   └── static/
│   │       └── favicon.svg
│   │
│   └── web/                    ← Página web pública (SvelteKit)
│       ├── src/
│       │   └── routes/
│       │       ├── +page.svelte    ← Landing page completa
│       │       └── +page.server.ts ← Carga imágenes desde PocketBase
│       └── static/
│           ├── slide1.jpg          ← Imágenes del carrusel
│           ├── slide2.jpg
│           └── slide3.jpg
│
├── pb/
│   ├── pocketbase.exe          ← Binario PocketBase v0.22.9
│   ├── pb_schema.json          ← Schema de colecciones
│   └── pb_data/                ← Base de datos SQLite (generada en runtime)
│
├── start-dev.bat               ← Inicia los 3 servidores en Windows
├── fly.toml                    ← Configuración Fly.io (PocketBase)
├── DEPLOY.md                   ← Guía de despliegue
└── package.json                ← Monorepo workspaces
```

---

## Colecciones PocketBase

| Colección | Descripción |
|---|---|
| `users` | Usuarios del panel (admin / worker) |
| `products` | Productos con fotos, SKU, código de barra, estado |
| `categories` | Categorías de productos |
| `invoices` | Facturas de proveedores |
| `vouchers` | Comprobantes de venta |
| `voucher_items` | Ítems de cada comprobante |
| `clients` | Clientes registrados |
| `audit_logs` | Registro de todas las acciones del sistema |
| `landing_images` | Imágenes del carrusel de la web pública |
| `delete_requests` | Solicitudes de eliminación de trabajadores |
| `user_permissions` | Permisos de acción por usuario worker |
| `module_access` | Acceso a módulos del menú por usuario worker |

---

## Módulos del panel admin

### Dashboard
Vista general con estadísticas: productos disponibles, ventas del mes, clientes, facturas. Incluye accesos rápidos y badge de solicitudes de eliminación pendientes.

### Productos
CRUD completo con fotos, SKU, código de barra (CODE128, EAN13, QR), categoría, precio, costo y estado. Filtros por nombre, estado, categoría y año. Exportación CSV y PDF.

### Categorías
Tabla de categorías con edición inline. Exportación CSV y PDF.

### Facturas
Registro de facturas de proveedores con archivo adjunto. Filtros y exportación CSV y PDF.

### Inventario
Listado de productos con checkboxes para marcar como inventariados en lote. Filtros y exportación CSV y PDF.

### Ventas
Creación de comprobantes con carrito de productos. Filtros por número, estado, fecha y año. Exportación individual (PDF por comprobante), masiva y listado en CSV/PDF.

### Clientes
CRUD de clientes con campo de cliente frecuente. Filtros y exportación CSV y PDF.

### Estadísticas
Tres gráficas interactivas con Chart.js:
- **Ventas por categoría**: barras agrupadas por mes en el rango seleccionado.
- **Productos más vendidos**: barras horizontales con tabla de detalle, filtrable por categoría.
- **Comparativa anual**: líneas superpuestas con las ventas de cada año, mes a mes.

Selector de rango de fechas (por defecto: últimos 3 meses).

### Auditoría
Historial completo de acciones: creaciones, ediciones, eliminaciones, logins, exports. Filtros por acción, módulo, año y rango de fechas. Botón para limpiar con confirmación. Exportación CSV y PDF.

### Permisos
Configuración de qué acciones puede realizar cada trabajador (crear/editar productos, ventas, clientes, facturas, categorías, inventario). Los trabajadores **nunca pueden eliminar** registros directamente.

### Acceso
Control de qué módulos del menú ve cada trabajador. Toggles visuales por módulo con botones "Habilitar todo" / "Deshabilitar todo". Los cambios se aplican en tiempo real al sidebar del worker.

### Solicitudes
Bandeja de solicitudes de eliminación generadas por trabajadores. El admin puede aprobar (el registro se elimina) o rechazar (el registro vuelve a su estado normal). Historial de solicitudes resueltas.

### Usuarios
CRUD de usuarios con rol (admin / worker) y contraseña. Solo visible para administradores.

### Landing Web
Gestión de imágenes del carrusel de la web pública. Subida múltiple, activar/desactivar, eliminar.

---

## Página web pública

Landing page moderna con:
- **Navbar** fijo con menú responsive (desktop + mobile hamburger)
- **Hero / carrusel** automático con las imágenes cargadas desde PocketBase (fallback a imágenes estáticas)
- **Banda de propuestas de valor** (variedad, calidad, asesoría, ubicación)
- **Galería** con hover effect
- **Quiénes somos** con cards visuales
- **Contacto** con card de WhatsApp destacada, datos de dirección/horario, redes sociales y mapa de Google Maps
- **Footer** de 3 columnas con links y copyright

Datos de contacto configurados:
- WhatsApp: +56 44 367 4412
- Dirección: Aníbal Pinto 253, Parral, Región del Maule
- Horario: Lun–Vie 9:30–18:30 | Sáb 10:00–13:00

---

## Cómo usar

### Primera vez

**Requisitos previos:**
- Node.js 18+
- npm 9+

**Instalación de dependencias:**
```bash
npm install
```

**Iniciar en desarrollo (Windows):**
```
start-dev.bat
```

Esto abre 3 ventanas CMD:
1. PocketBase en `http://localhost:8090`
2. Panel admin en `http://localhost:5175`
3. Web pública en `http://localhost:5174`

### Inicialización de la base de datos

Al ejecutar por primera vez, si la base de datos está vacía:

```bash
# Desde la raíz del proyecto
python setup_pb_v2.py
```

O manualmente:
1. Abrir `http://localhost:8090/_/`
2. Crear cuenta superadmin
3. Ir a **Settings → Import collections** y cargar `pb/pb_schema.json`
4. En la colección `users`, crear usuario admin con rol `admin`
5. En la colección `categories`, crear categoría "Otros"

### Comandos útiles

```bash
# Iniciar solo el admin
npm run dev:admin

# Iniciar solo la web
npm run dev:web

# Build ambas apps
npm run build

# Build solo admin
npm run build:admin
```

### Crear un usuario trabajador

1. Iniciar sesión en el panel admin como administrador
2. Ir al módulo **Usuarios**
3. Crear nuevo usuario con rol **Trabajador**
4. Ir a **Acceso** para configurar qué módulos puede ver
5. Ir a **Permisos** para configurar qué acciones puede realizar

### Flujo de solicitud de eliminación

1. Un **trabajador** encuentra un registro que quiere eliminar
2. En lugar del botón "Eliminar", ve el botón **"Solicitar eliminación"**
3. Escribe una nota opcional y envía la solicitud
4. El **administrador** ve el contador en el sidebar y en el dashboard
5. El admin va a **Solicitudes**, revisa y decide:
   - **Aprobar**: el registro se elimina definitivamente
   - **Rechazar**: el registro vuelve a su estado normal

---

## Despliegue en producción

Ver `DEPLOY.md` para instrucciones completas de despliegue en:
- **Fly.io** → PocketBase (backend + base de datos)
- **Vercel** → Panel admin + Web pública (frontends)

Variables de entorno necesarias:
```env
# apps/admin/.env y apps/web/.env
VITE_PB_URL=https://tu-pocketbase.fly.dev
```

---

## Roles y permisos

| Acción | Admin | Worker |
|---|---|---|
| Ver todos los módulos | ✅ | Configurable por admin |
| Crear registros | ✅ | Configurable por admin |
| Editar registros | ✅ | Configurable por admin |
| Eliminar registros | ✅ | ❌ Solo puede solicitar |
| Ver auditoría | ✅ | ❌ |
| Gestionar usuarios | ✅ | ❌ |
| Configurar acceso | ✅ | ❌ |
| Configurar permisos | ✅ | ❌ |
| Ver estadísticas | ✅ | ❌ |
| Gestionar landing | ✅ | ❌ |
| Aprobar/rechazar solicitudes | ✅ | ❌ |

---

## Capturas de interfaces

> Las interfaces se pueden ver accediendo a cada URL de desarrollo.

| Módulo | URL |
|---|---|
| Login admin | `http://localhost:5175/login` |
| Dashboard | `http://localhost:5175/dashboard` |
| Productos | `http://localhost:5175/productos` |
| Estadísticas | `http://localhost:5175/estadisticas` |
| Solicitudes | `http://localhost:5175/solicitudes` |
| Acceso | `http://localhost:5175/acceso` |
| Web pública | `http://localhost:5174` |

---

*Desarrollado para Mueblería Herrera — Parral, Región del Maule, Chile*
