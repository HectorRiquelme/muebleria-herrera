@echo off
echo ================================================
echo   Muebleria Herrera - Entorno de desarrollo
echo ================================================
echo.
echo Iniciando PocketBase en http://localhost:8090
echo Panel admin de PocketBase: http://localhost:8090/_/
echo.
echo [INSTRUCCIONES PRIMERA VEZ]
echo 1. Abrir http://localhost:8090/_/ y crear cuenta superadmin
echo 2. Ir a Settings - Import collections - cargar pb\pb_schema.json
echo 3. Crear categoria "Otros" en la coleccion categories
echo 4. Crear un usuario administrador en la coleccion users
echo.
echo Iniciando servidores...
echo.

start "PocketBase" cmd /k "cd /d %~dp0pb && pocketbase.exe serve"

timeout /t 2 /nobreak > nul

start "Admin Panel" cmd /k "cd /d %~dp0apps\admin && npm run dev"

timeout /t 1 /nobreak > nul

start "Web Publica" cmd /k "cd /d %~dp0apps\web && npm run dev"

echo.
echo ================================================
echo   URLs disponibles:
echo   PocketBase:   http://localhost:8090
echo   Panel Admin:  http://localhost:5175
echo   Web Publica:  http://localhost:5174
echo ================================================
echo.
pause
