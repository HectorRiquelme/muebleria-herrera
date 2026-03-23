#!/bin/bash
# ============================================================
# status.sh — Ver estado de todos los servicios
# ============================================================

echo "================================================"
echo "  Estado de servicios — Muebleria Herrera"
echo "================================================"
echo ""
printf "%-20s %s\n" "Servicio" "Estado"
printf "%-20s %s\n" "--------" "------"
printf "%-20s %s\n" "PocketBase" "$(systemctl is-active pocketbase 2>/dev/null || echo 'no instalado')"
printf "%-20s %s\n" "Admin Panel" "$(systemctl is-active muebleria-admin 2>/dev/null || echo 'no instalado')"
printf "%-20s %s\n" "Web Publica" "$(systemctl is-active muebleria-web 2>/dev/null || echo 'no instalado')"
printf "%-20s %s\n" "Caddy (proxy)" "$(systemctl is-active caddy 2>/dev/null || echo 'no instalado')"
echo ""

# Memoria
echo "--- Memoria ---"
free -h | head -2
echo ""

# Disco
echo "--- Disco ---"
df -h / | tail -1
echo ""

# Puertos
echo "--- Puertos activos ---"
ss -tlnp | grep -E '(8090|5174|5175|80|443)' || echo "Ningun puerto de la app activo"
