#!/bin/bash
# ============================================================
# 03-install-apps.sh — Clonar repo y buildear apps SvelteKit
# Ejecutar como root (sudo su)
# ============================================================
set -e

REPO_URL="https://github.com/HectorRiquelme/muebleria-herrera.git"
APP_DIR="/opt/muebleria-herrera"
DOMAIN="${1:-$(curl -s ifconfig.me)}"  # Pasar dominio como argumento o usar IP

echo "================================================"
echo "  Instalando apps SvelteKit"
echo "  Dominio/IP: ${DOMAIN}"
echo "================================================"

# 1. Clonar repositorio
echo "[1/5] Clonando repositorio..."
rm -rf ${APP_DIR}
git clone ${REPO_URL} ${APP_DIR}
cd ${APP_DIR}

# 2. Instalar dependencias
echo "[2/5] Instalando dependencias..."
npm install

# 3. Configurar variables de entorno
echo "[3/5] Configurando variables de entorno..."

# Admin app
cat > ${APP_DIR}/apps/admin/.env << EOF
VITE_PB_URL=https://${DOMAIN}/pb
PB_URL=http://localhost:8090
EOF

# Web app
cat > ${APP_DIR}/apps/web/.env << EOF
VITE_PB_URL=https://${DOMAIN}/pb
PB_URL=http://localhost:8090
EOF

# 4. Build ambas apps
echo "[4/5] Buildeando admin..."
npm run build --workspace=apps/admin

echo "Buildeando web..."
npm run build --workspace=apps/web

# 5. Asignar permisos
echo "[5/5] Asignando permisos..."
chown -R muebleria:muebleria ${APP_DIR}

echo ""
echo "================================================"
echo "  Apps buildeadas. Siguiente paso: ./04-services.sh"
echo "================================================"
