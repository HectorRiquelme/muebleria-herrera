# Guía de Deploy — Mueblería Herrera

## Arquitectura

```
┌──────────────┐     ┌──────────────┐
│  Vercel      │     │  Fly.io      │
│  apps/admin  │────▶│  PocketBase  │
│  apps/web    │     │  :8090       │
└──────────────┘     └──────────────┘
```

## 1. PocketBase en Fly.io

### Instalar Fly CLI
```bash
# Windows
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"

# Verificar
flyctl version
```

### Deploy inicial
```bash
# Login
flyctl auth login

# Crear app (desde la raíz del proyecto)
flyctl launch --config fly.toml

# Crear volumen persistente para los datos
flyctl volumes create pb_data --size 1 --region gru

# Deploy
flyctl deploy
```

### Primera configuración de PocketBase
1. Abrir `https://muebleria-herrera-pb.fly.dev/_/` en el navegador
2. Crear cuenta de superadmin
3. Ir a **Settings → Import collections** y cargar `pb/pb_schema.json`
4. Crear la primera categoría "Otros" en la colección `categories`
5. Crear el primer usuario administrador en la colección `users`

---

## 2. Apps en Vercel

### Prerequisitos
```bash
npm install -g vercel
vercel login
```

### Deploy del panel admin
```bash
cd apps/admin
vercel
# Configurar:
# - Build Command: npm run build
# - Output Directory: build
# - Install Command: npm install
# Variables de entorno:
# VITE_PB_URL = https://muebleria-herrera-pb.fly.dev
# PB_URL = https://muebleria-herrera-pb.fly.dev
```

### Deploy de la página web pública
```bash
cd apps/web
vercel
# Misma configuración pero con nombre diferente
# Variables de entorno:
# VITE_PB_URL = https://muebleria-herrera-pb.fly.dev
# PB_URL = https://muebleria-herrera-pb.fly.dev
```

---

## 3. Variables de entorno

### admin/.env
```
VITE_PB_URL=https://muebleria-herrera-pb.fly.dev
PB_URL=https://muebleria-herrera-pb.fly.dev
```

### web/.env
```
VITE_PB_URL=https://muebleria-herrera-pb.fly.dev
PB_URL=https://muebleria-herrera-pb.fly.dev
```

---

## 4. Desarrollo local

```bash
# Descargar PocketBase
# https://pocketbase.io/docs/ -> descargar para tu SO
# Ejecutar:
./pocketbase serve

# En otra terminal, levantar el panel admin:
cd apps/admin
cp .env.example .env
npm run dev

# En otra terminal, levantar la web pública:
cd apps/web
cp .env.example .env
npm run dev
```

---

## 5. Personalizar la página web

Editar `apps/web/src/routes/+page.svelte`:
- `whatsappNumber`: Tu número de WhatsApp con código de país
- `instagramUrl`: URL de tu Instagram
- `facebookUrl`: URL de tu Facebook
- El `src` del `<iframe>` del mapa: reemplazar con el embed de Google Maps de tu dirección
- Los textos de "Quiénes somos"

---

## 6. Notas importantes

- **Fly.io Plan Hobby**: Gratuito con 3 VMs compartidas
- **Vercel Hobby**: Gratuito con límites generosos
- Los archivos de PocketBase se persisten en el volumen `pb_data`
- **Hacer backups periódicos** del volumen con `flyctl volumes snapshots create pb_data`
