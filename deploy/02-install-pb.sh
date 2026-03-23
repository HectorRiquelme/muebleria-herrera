#!/bin/bash
# ============================================================
# 02-install-pb.sh — Instalar PocketBase en la VM
# Ejecutar como root (sudo su)
# ============================================================
set -e

PB_VERSION="0.22.9"
PB_DIR="/opt/pocketbase"

echo "================================================"
echo "  Instalando PocketBase v${PB_VERSION}"
echo "================================================"

# 1. Descargar PocketBase
echo "[1/4] Descargando PocketBase..."
mkdir -p ${PB_DIR}
cd /tmp
wget -q "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip"
unzip -o "pocketbase_${PB_VERSION}_linux_amd64.zip" -d ${PB_DIR}
rm "pocketbase_${PB_VERSION}_linux_amd64.zip"
chmod +x ${PB_DIR}/pocketbase

# 2. Crear directorio de datos
echo "[2/4] Creando directorio de datos..."
mkdir -p ${PB_DIR}/pb_data
mkdir -p ${PB_DIR}/pb_migrations

# 3. Copiar schema (si existe en el mismo directorio)
echo "[3/4] Verificando schema..."
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [ -f "${SCRIPT_DIR}/../pb/pb_schema.json" ]; then
    cp "${SCRIPT_DIR}/../pb/pb_schema.json" ${PB_DIR}/pb_schema.json
    echo "  Schema copiado desde el repo."
else
    echo "  AVISO: pb_schema.json no encontrado. Importar manualmente desde el panel admin."
fi

# 4. Asignar permisos
echo "[4/4] Asignando permisos..."
chown -R muebleria:muebleria ${PB_DIR}

echo ""
echo "================================================"
echo "  PocketBase instalado en ${PB_DIR}"
echo "  Siguiente paso: ./03-install-apps.sh"
echo "================================================"
