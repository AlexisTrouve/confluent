@echo off
REM Quick check: Verifie rapidement l'etat du serveur et de la securite

echo ========================================
echo QUICK CHECK - CONFLUENT TRANSLATOR
echo ========================================
echo.

REM Test 1: Serveur actif ?
echo [1/4] Verification serveur...
curl -s -o nul -w "%%{http_code}" http://localhost:3000/api/health > temp.txt 2>&1
set /p STATUS=<temp.txt
del temp.txt 2>nul

if "%STATUS%"=="200" (
    echo     [OK] Serveur actif ^(status 200^)
) else (
    echo     [ERREUR] Serveur inactif ou inaccessible ^(status %STATUS%^)
    echo     Lancez "npm start" dans ConfluentTranslator/
    echo.
    pause
    exit /b 1
)

REM Test 2: Securite active ?
echo [2/4] Verification securite...
curl -s -o nul -w "%%{http_code}" http://localhost:3000/api/stats > temp.txt 2>&1
set /p STATUS=<temp.txt
del temp.txt 2>nul

if "%STATUS%"=="401" (
    echo     [OK] Endpoints proteges ^(status 401^)
) else (
    echo     [ERREUR] Securite inactive! ^(status %STATUS%^)
    echo     Les endpoints ne sont pas proteges!
    echo.
    pause
    exit /b 1
)

REM Test 3: Token admin existe ?
echo [3/4] Verification token...
if exist "..\data\tokens.json" (
    echo     [OK] Fichier tokens.json existe
) else (
    echo     [ERREUR] Fichier tokens.json introuvable
    echo     Lancez le serveur une fois pour creer le token admin
    echo.
    pause
    exit /b 1
)

REM Test 4: curl disponible ?
echo [4/4] Verification outils...
curl --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo     [OK] curl disponible
) else (
    echo     [ERREUR] curl non installe ou non accessible
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo RESULTAT
echo ========================================
echo [OK] Tous les checks sont passes!
echo.
echo Le serveur est actif et correctement securise.
echo Vous pouvez maintenant lancer les tests:
echo.
echo   test-health.bat          Test endpoint public
echo   test-unauthorized.bat    Test securite sans auth
echo   test-authorized.bat      Test acces avec auth
echo   test-all.bat             Tous les tests
echo.
echo N'oubliez pas de configurer le token dans test-authorized.bat
echo Utilisez "get-token.bat" pour extraire le token.
echo.
echo ========================================
pause
