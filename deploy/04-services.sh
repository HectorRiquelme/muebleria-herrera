#!/bin/bash
# ============================================================
# 04-services.sh — Crear servicios systemd + configurar Caddy
# Ejecutar como root (sudo su)
# ============================================================
set -e

DOMAIN="${1:-$(curl -s ifconfig.me)}"

echo "================================================"
echo "  Configurando servicios systemd + Caddy"
echo "  Dominio/IP: ${DOMAIN}"
echo "================================================"

# ---- PocketBase service ----
echo "[1/5] Creando servicio PocketBase..."
cat > /etc/systemd/system/pocketbase.service << 'EOF'
[Unit]
Description=PocketBase — Muebleria Herrera
After=network.target

[Service]
Type=simple
User=muebleria
Group=muebleria
WorkingDirectory=/opt/pocketbase
ExecStart=/opt/pocketbase/pocketbase serve --http=127.0.0.1:8090
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# ---- Admin SvelteKit service ----
echo "[2/5] Creando servicio Admin..."
cat > /etc/systemd/system/muebleria-admin.service << EOF
[Unit]
Description=Muebleria Herrera — Admin Panel
After=network.target pocketbase.service

[Service]
Type=simple
User=muebleria
Group=muebleria
WorkingDirectory=/opt/muebleria-herrera/apps/admin
ExecStart=/usr/bin/node build/index.js
Restart=always
RestartSec=5
Environment=PORT=5175
Environment=HOST=127.0.0.1
Environment=PB_URL=http://127.0.0.1:8090
Environment=ORIGIN=https://${DOMAIN}
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# ---- Web SvelteKit service ----
echo "[3/5] Creando servicio Web..."
cat > /etc/systemd/system/muebleria-web.service << EOF
[Unit]
Description=Muebleria Herrera — Web Publica
After=network.target pocketbase.service

[Service]
Type=simple
User=muebleria
Group=muebleria
WorkingDirectory=/opt/muebleria-herrera/apps/web
ExecStart=/usr/bin/node build/index.js
Restart=always
RestartSec=5
Environment=PORT=5174
Environment=HOST=127.0.0.1
Environment=PB_URL=http://127.0.0.1:8090
Environment=ORIGIN=https://${DOMAIN}
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# ---- Caddy reverse proxy ----
echo "[4/5] Configurando Caddy..."

# Detectar si es IP o dominio
if [[ "${DOMAIN}" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    # Es una IP — usar HTTP sin HTTPS
    cat > /etc/caddy/Caddyfile << EOF
:80 {
    # Admin panel
    handle /admin/* {
        reverse_proxy 127.0.0.1:5175
    }

    # PocketBase API (para que el frontend acceda)
    handle /pb/* {
        uri strip_prefix /pb
        reverse_proxy 127.0.0.1:8090
    }

    # PocketBase admin panel directo
    handle /_/* {
        reverse_proxy 127.0.0.1:8090
    }

    # Web publica (default)
    handle {
        reverse_proxy 127.0.0.1:5174
    }
}
EOF
else
    # Es un dominio — HTTPS automatico con Let's Encrypt
    cat > /etc/caddy/Caddyfile << EOF
${DOMAIN} {
    # Admin panel
    handle /admin/* {
        reverse_proxy 127.0.0.1:5175
    }

    # PocketBase API (para que el frontend acceda)
    handle /pb/* {
        uri strip_prefix /pb
        reverse_proxy 127.0.0.1:8090
    }

    # PocketBase admin panel directo
    handle /_/* {
        reverse_proxy 127.0.0.1:8090
    }

    # Web publica (default)
    handle {
        reverse_proxy 127.0.0.1:5174
    }
}
EOF
fi

# ---- Habilitar y arrancar todo ----
echo "[5/5] Habilitando y arrancando servicios..."
systemctl daemon-reload
systemctl enable pocketbase muebleria-admin muebleria-web caddy
systemctl restart pocketbase
sleep 2
systemctl restart muebleria-admin
systemctl restart muebleria-web
systemctl restart caddy

echo ""
echo "================================================"
echo "  Verificando servicios..."
echo "================================================"
echo ""
echo "PocketBase: $(systemctl is-active pocketbase)"
echo "Admin:      $(systemctl is-active muebleria-admin)"
echo "Web:        $(systemctl is-active muebleria-web)"
echo "Caddy:      $(systemctl is-active caddy)"
echo ""
echo "================================================"
echo "  URLs disponibles:"
echo "  Web publica:    http://${DOMAIN}/"
echo "  Admin panel:    http://${DOMAIN}/admin/"
echo "  PocketBase API: http://${DOMAIN}/pb/"
echo "  PB Admin:       http://${DOMAIN}/_/"
echo "================================================"
