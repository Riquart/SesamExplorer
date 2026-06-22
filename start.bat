@echo off
:: Se positionner dans le dossier du script
cd /d "%~dp0"

title Lancement du Projet Stats TLT
echo =============================================
echo    LANCEMENT DU PROJET STATS TLT
echo =============================================

:: 1. Vérification de Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js n'est pas installe sur votre machine !
    echo [INFO] Veuillez installer Node.js depuis : https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js est installe.

:: 2. Vérification et installation des dépendances
if not exist node_modules (
    echo [INFO] Aucun dossier node_modules detecte. Installation des dependances (npm install)...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Erreur lors de l'installation des dependances.
        pause
        exit /b 1
    )
    echo [OK] Dependances installees avec succes !
) else (
    echo [OK] Les dependances sont deja installees.
)

:: 3. Lancement du serveur de développement
echo [INFO] Demarrage du serveur de developpement (npm run dev)...
echo ---------------------------------------------
:: Attendre 2 secondes et ouvrir le navigateur automatiquement
start /b cmd /c "timeout /t 2 >nul && start http://localhost:3000"
call npm run dev
pause
