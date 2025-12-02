@echo off
REM Test: Endpoint public /api/health
REM Ce endpoint doit être accessible SANS authentification

echo ========================================
echo TEST: /api/health (PUBLIC)
echo ========================================
echo.
echo Expected: Status 200, JSON avec "status":"ok"
echo.

curl -s -w "\nHTTP Status: %%{http_code}\n" http://localhost:3000/api/health

echo.
echo ========================================
if %ERRORLEVEL% EQU 0 (
    echo RESULTAT: OK - Endpoint accessible
) else (
    echo RESULTAT: ERREUR - Curl failed
)
echo ========================================
pause
