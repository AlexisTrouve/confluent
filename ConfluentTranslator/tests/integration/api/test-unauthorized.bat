@echo off
REM Test: Tous les endpoints PROTEGES sans authentification
REM Tous doivent retourner 401 Unauthorized

setlocal EnableDelayedExpansion

echo ========================================
echo TEST: ENDPOINTS PROTEGES SANS AUTH
echo ========================================
echo Expected: Tous les endpoints retournent 401
echo.

set PASSED=0
set FAILED=0
set TOTAL=0

REM === Test GET endpoints ===
call :test_get "/api/stats" "Stats sans auth"
call :test_get "/api/lexique/ancien" "Lexique ancien sans auth"
call :test_get "/api/lexique/proto" "Lexique proto sans auth"
call :test_get "/api/search?q=test" "Search sans auth"
call :test_get "/api/validate" "Validate sans auth"

REM === Test POST endpoints ===
call :test_post "/translate" "{\"text\":\"test\",\"target\":\"ancien\",\"provider\":\"anthropic\",\"model\":\"claude-sonnet-4-20250514\"}" "Translate FR->CF sans auth"
call :test_post "/api/reload" "{}" "Reload sans auth"
call :test_post "/api/debug/prompt" "{\"text\":\"test\"}" "Debug prompt sans auth"
call :test_post "/api/analyze/coverage" "{\"text\":\"test\"}" "Coverage analysis sans auth"
call :test_post "/api/translate/raw" "{\"text\":\"test\",\"target\":\"ancien\",\"provider\":\"anthropic\",\"model\":\"claude-sonnet-4-20250514\"}" "Translate raw sans auth"
call :test_post "/api/translate/batch" "{\"words\":[\"test\"]}" "Translate batch sans auth"
call :test_post "/api/translate/conf2fr" "{\"text\":\"test\"}" "Translate CF->FR sans auth"
call :test_post "/api/translate/conf2fr/llm" "{\"text\":\"test\"}" "Translate CF->FR LLM sans auth"

echo.
echo ========================================
echo RESULTATS FINAUX
echo ========================================
echo Total: !TOTAL! tests
echo Passes: !PASSED! (401 retourne)
echo Echoues: !FAILED! (autre status)
echo ========================================

if !FAILED! EQU 0 (
    echo.
    echo [OK] Tous les endpoints sont correctement proteges
) else (
    echo.
    echo [ERREUR] Certains endpoints ne sont pas proteges!
)

pause
exit /b

:test_get
set /a TOTAL+=1
echo [%TOTAL%] Testing: %~2
for /f %%i in ('curl -s -o nul -w "%%{http_code}" http://localhost:3000%~1') do set STATUS=%%i
if "!STATUS!"=="401" (
    echo     [OK] 401 Unauthorized
    set /a PASSED+=1
) else (
    echo     [FAIL] Status: !STATUS! ^(expected 401^)
    set /a FAILED+=1
)
echo.
exit /b

:test_post
set /a TOTAL+=1
echo [%TOTAL%] Testing: %~3
for /f %%i in ('curl -s -o nul -w "%%{http_code}" -X POST -H "Content-Type: application/json" -d "%~2" http://localhost:3000%~1') do set STATUS=%%i
if "!STATUS!"=="401" (
    echo     [OK] 401 Unauthorized
    set /a PASSED+=1
) else (
    echo     [FAIL] Status: !STATUS! ^(expected 401^)
    set /a FAILED+=1
)
echo.
exit /b
