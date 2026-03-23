# Deploy — Muebleria Herrera en Google Cloud Free Tier

## Requisitos

- Cuenta Google Cloud con billing (tarjeta para verificacion, no cobra)
- VM e2-micro en region US (us-central1, us-west1, us-east1)
- 30GB Standard Persistent Disk (NO SSD)
- Debian 12

## Crear la VM en Google Cloud

1. Ir a [console.cloud.google.com](https://console.cloud.google.com)
2. Compute Engine > VM Instances > Create Instance
3. Configurar:
   - Name: `muebleria-herrera`
   - Region: `us-central1` (Iowa)
   - Machine type: `e2-micro` (2 vCPU, 1GB RAM)
   - Boot disk: Debian 12, 30GB Standard persistent disk
   - Firewall: Allow HTTP + HTTPS
   - Network tier: Standard (no Premium)
4. Verificar estimado $0.00 > Create

## Deploy automatico

```bash
# Conectar por SSH desde la consola de Google Cloud
# (boton SSH en la lista de VMs)

# Descargar scripts de deploy
sudo su
cd /tmp
git clone https://github.com/HectorRiquelme/muebleria-herrera.git
cd muebleria-herrera/deploy

# Hacer ejecutables
chmod +x *.sh

# Deploy completo (con IP)
./deploy-all.sh

# O con dominio personalizado
./deploy-all.sh midominio.com
```

## Post-deploy (manual)

1. Abrir `http://TU_IP/_/` > Crear superadmin PocketBase
2. Settings > Import Collections > pegar contenido de `pb/pb_schema.json`
3. Crear usuario en coleccion `users`:
   - email: `admin@herrera.com`
   - password: (el que quieras)
   - role: `admin`
   - name: `Admin`
4. Crear registro en coleccion `categories`:
   - name: `Otros`

## URLs

| Servicio | URL |
|---|---|
| Web publica | `http://TU_IP/` |
| Admin panel | `http://TU_IP/admin/` |
| PocketBase API | `http://TU_IP/pb/` |
| PB Admin panel | `http://TU_IP/_/` |

## Comandos utiles

```bash
# Ver estado de servicios
sudo ./deploy/status.sh

# Actualizar desde GitHub (re-deploy rapido)
sudo ./deploy/update.sh

# Ver logs
sudo journalctl -u pocketbase -f
sudo journalctl -u muebleria-admin -f
sudo journalctl -u muebleria-web -f
sudo journalctl -u caddy -f

# Restart individual
sudo systemctl restart pocketbase
sudo systemctl restart muebleria-admin
sudo systemctl restart muebleria-web
sudo systemctl restart caddy
```

## Arquitectura en produccion

```
[Internet]
    |
    v
[Caddy :80/:443] (reverse proxy + HTTPS)
    |
    +-- /          --> [SvelteKit Web :5174]
    +-- /admin/*   --> [SvelteKit Admin :5175]
    +-- /pb/*      --> [PocketBase :8090] (API)
    +-- /_/*       --> [PocketBase :8090] (Admin panel)
```

## Limites del free tier

- 1 VM e2-micro (2 vCPU, 1GB RAM)
- 30GB disco
- 1GB egress/mes
- Solo regiones US
- NO cambiar a SSD, otro tipo de VM, u otra region
