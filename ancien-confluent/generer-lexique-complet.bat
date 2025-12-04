@echo off
REM Script batch pour générer le lexique complet sous Windows
REM Appelle simplement le script Node.js

echo.
echo ========================================
echo Generation du lexique complet
echo ========================================
echo.

node "%~dp0generer-lexique-complet.js"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Terminé avec succès !
    echo ========================================
) else (
    echo.
    echo ========================================
    echo Erreur lors de la génération
    echo ========================================
)

pause
