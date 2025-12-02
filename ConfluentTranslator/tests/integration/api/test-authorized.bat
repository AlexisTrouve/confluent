@echo off
REM Test: Tous les endpoints PROTEGES avec authentification
REM Tous doivent retourner 200 (ou autre status valide)

setlocal EnableDelayedExpansion

REM === Configuration ===
REM IMPORTANT: Mettre votre token ici
set TOKEN=VOTRE_TOKEN_ICI

REM Verifier si le token est configure
if "%TOKEN%"=="VOTRE_TOKEN_ICI" (
    echo ========================================
    echo ERREUR: Token non configure
    echo ========================================
    echo.
    echo Editez le fichier test-authorized.bat et remplacez:
    echo     set TOKEN=VOTRE_TOKEN_ICI
    echo par:
    echo     set TOKEN=votre-vrai-token
    echo.
    echo Le token se trouve dans data/tokens.json
    echo ou dans les logs du serveur au demarrage.
    echo.
    pause
    exit /b 1
)

echo ========================================
echo TEST: ENDPOINTS PROTEGES AVEC AUTH
echo ========================================
echo Token: %TOKEN:~0,20%...
echo Expected: Tous les endpoints retournent 200 ou status valide
echo.

set PASSED=0
set FAILED=0
set TOTAL=0

REM === Test GET endpoints ===
call :test_get "/api/validate" "Validate token" "200"
call :test_get "/api/stats" "Stats" "200"
call :test_get "/api/lexique/ancien" "Lexique ancien" "200"
call :test_get "/api/search?q=eau&variant=ancien" "Search" "200"

REM === Test POST endpoints (read-only) ===
call :test_post "/api/debug/prompt" "{\"text\":\"eau\"}" "Debug prompt" "200"
call :test_post "/api/analyze/coverage" "{\"text\":\"l eau coule\"}" "Coverage analysis" "200"
call :test_post "/api/translate/batch" "{\"words\":[\"eau\"],\"target\":\"ancien\"}" "Translate batch" "200"
call :test_post "/api/translate/conf2fr" "{\"text\":\"vuku\",\"variant\":\"ancien\"}" "Translate CF->FR" "200"

echo.
echo ========================================
echo TESTS SKIPPED (requierent LLM API keys)
echo ========================================
echo Les endpoints suivants ne sont pas testes:
echo   - POST /translate ^(requiert ANTHROPIC_API_KEY^)
echo   - POST /api/translate/raw ^(requiert API keys^)
echo   - POST /api/translate/conf2fr/llm ^(requiert API keys^)
echo   - POST /api/reload ^(admin only^)
echo.
echo Pour tester ces endpoints, assurez-vous:
echo   1. Avoir configure les API keys dans .env
echo   2. Avoir un token avec role admin
echo.

echo ========================================
echo RESULTATS FINAUX
echo ========================================
echo Total: !TOTAL! tests
echo Passes: !PASSED! ^(200 OK^)
echo Echoues: !FAILED! ^(autre status^)
echo ========================================

if !FAILED! EQU 0 (
    echo.
    echo [OK] Tous les endpoints sont accessibles avec auth
) else (
    echo.
    echo [ERREUR] Certains endpoints ne repondent pas correctement!
)

pause
exit /b

:test_get
set /a TOTAL+=1
echo [%TOTAL%] Testing: %~2
for /f %%i in ('curl -s -o nul -w "%%{http_code}" -H "x-api-key: %TOKEN%" http://localhost:3000%~1') do set STATUS=%%i
if "!STATUS!"=="%~3" (
    echo     [OK] %~3
    set /a PASSED+=1
) else (
    echo     [FAIL] Status: !STATUS! ^(expected %~3^)
    set /a FAILED+=1
)
echo.
exit /b

:test_post
set /a TOTAL+=1
echo [%TOTAL%] Testing: %~3
for /f %%i in ('curl -s -o nul -w "%%{http_code}" -X POST -H "Content-Type: application/json" -H "x-api-key: %TOKEN%" -d "%~2" http://localhost:3000%~1') do set STATUS=%%i
if "!STATUS!"=="%~4" (
    echo     [OK] %~4
    set /a PASSED+=1
) else (
    echo     [FAIL] Status: !STATUS! ^(expected %~4^)
    set /a FAILED+=1
)
echo.
exit /b
