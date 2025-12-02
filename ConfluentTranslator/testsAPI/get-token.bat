@echo off
REM Script pour extraire le token admin depuis data/tokens.json
REM Utilisé pour faciliter la configuration des tests

echo ========================================
echo EXTRACTION DU TOKEN ADMIN
echo ========================================
echo.

REM Verifier si le fichier existe
if not exist "..\data\tokens.json" (
    echo [ERREUR] Fichier data\tokens.json introuvable!
    echo.
    echo Le fichier doit etre cree au premier demarrage du serveur.
    echo Lancez "npm start" une fois pour creer le token admin.
    echo.
    pause
    exit /b 1
)

echo Lecture de data\tokens.json...
echo.

REM Lire le contenu du fichier
type ..\data\tokens.json
echo.
echo.

REM Extraire le premier token (PowerShell)
echo Token admin:
powershell -Command "& {$json = Get-Content '..\data\tokens.json' | ConvertFrom-Json; $token = $json.PSObject.Properties.Name | Select-Object -First 1; Write-Host $token -ForegroundColor Green}"

echo.
echo ========================================
echo CONFIGURATION DES TESTS
echo ========================================
echo.
echo Pour configurer test-authorized.bat:
echo 1. Copiez le token ci-dessus
echo 2. Editez test-authorized.bat
echo 3. Remplacez "VOTRE_TOKEN_ICI" par le token
echo.
echo Exemple:
echo   set TOKEN=c32b04be-2e68-4e15-8362-xxxxx
echo.
pause
