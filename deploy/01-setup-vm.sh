#!/bin/bash
# ============================================================
# 01-setup-vm.sh — Configuracion inicial de la VM Google Cloud
# Ejecutar como root (sudo su) en la VM recien creada
# ============================================================
set -e

echo "================================================"
echo "  Muebleria Herrera — Setup VM Google Cloud"
echo "================================================"

# 1. Actualizar sistema
echo "[1/6] Actualizando sistema..."
apt-get update && apt-get upgrade -y

# 2. Instalar dependencias
echo "[2/6] Instalando dependencias..."
apt-get install -y \
    curl \
    wget \
    unzip \
    git \
    ufw \
    debian-keyring \
    debian-archive-keyring \
    apt-transport-https

# 3. Instalar Node.js 20 LTS
echo "[3/6] Instalando Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
echo "Node: $(node -v) | npm: $(npm -v)"

# 4. Instalar Caddy (reverse proxy + HTTPS automatico)
echo "[4/6] Instalando Caddy..."
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt-get update
apt-get install -y caddy

# 5. Configurar firewall
echo "[5/6] Configurando firewall..."
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw --force enable

# 6. Crear usuario de la app
echo "[6/6] Creando usuario muebleria..."
useradd -m -s /bin/bash muebleria || echo "Usuario ya existe"

echo ""
echo "================================================"
echo "  VM lista. Siguiente paso: ./02-install-pb.sh"
echo "================================================"
