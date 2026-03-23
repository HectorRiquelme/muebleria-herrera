#!/bin/bash
# ============================================================
# update.sh — Actualizar apps desde GitHub (re-deploy rapido)
#
# USO: sudo ./update.sh [dominio]
#
# Hace git pull, rebuild, y restart de servicios.
# No toca PocketBase ni datos.
# ============================================================
set -e

DOMAIN="${1:-$(curl -s ifconfig.me)}"
APP_DIR="/opt/muebleria-herrera"

echo "================================================"
echo "  Actualizando desde GitHub..."
echo "================================================"

cd ${APP_DIR}
git pull origin master

# Reinstalar deps si package-lock cambio
npm install

# Rebuild
echo "Buildeando admin..."
npm run build --workspace=apps/admin

echo "Buildeando web..."
npm run build --workspace=apps/web

# Restart servicios (no PocketBase)
echo "Reiniciando servicios..."
systemctl restart muebleria-admin
systemctl restart muebleria-web

echo ""
echo "Admin: $(systemctl is-active muebleria-admin)"
echo "Web:   $(systemctl is-active muebleria-web)"
echo ""
echo "Actualización completada."
