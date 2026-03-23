#!/bin/bash
# ============================================================
# deploy-all.sh — Script maestro de deploy
#
# USO:
#   Con IP:      sudo ./deploy-all.sh
#   Con dominio: sudo ./deploy-all.sh midominio.com
#
# Este script ejecuta los 4 pasos en orden.
# Ejecutar como root en la VM de Google Cloud.
# ============================================================
set -e

DOMAIN="${1:-$(curl -s ifconfig.me)}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "========================================================"
echo "  MUEBLERIA HERRERA — Deploy completo"
echo "  Dominio/IP: ${DOMAIN}"
echo "  Fecha: $(date)"
echo "========================================================"
echo ""

read -p "¿Continuar con el deploy? (s/n): " confirm
if [[ "$confirm" != "s" ]]; then
    echo "Deploy cancelado."
    exit 0
fi

echo ""
echo "--- Paso 1/4: Configuracion de la VM ---"
bash "${SCRIPT_DIR}/01-setup-vm.sh"

echo ""
echo "--- Paso 2/4: Instalar PocketBase ---"
bash "${SCRIPT_DIR}/02-install-pb.sh"

echo ""
echo "--- Paso 3/4: Instalar Apps SvelteKit ---"
bash "${SCRIPT_DIR}/03-install-apps.sh" "${DOMAIN}"

echo ""
echo "--- Paso 4/4: Servicios + Caddy ---"
bash "${SCRIPT_DIR}/04-services.sh" "${DOMAIN}"

echo ""
echo "========================================================"
echo "  DEPLOY COMPLETADO"
echo ""
echo "  Siguiente paso manual:"
echo "  1. Abrir http://${DOMAIN}/_/"
echo "  2. Crear cuenta superadmin de PocketBase"
echo "  3. Settings > Import Collections > pegar pb_schema.json"
echo "  4. Crear usuario admin en coleccion users:"
echo "     email: admin@herrera.com"
echo "     role: admin"
echo "  5. Crear categoria 'Otros' en coleccion categories"
echo "========================================================"
