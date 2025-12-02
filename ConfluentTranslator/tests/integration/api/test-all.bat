@echo off
REM Test complet: Lance tous les tests de securite
REM Ce script execute tous les tests dans l'ordre

echo ========================================
echo SUITE DE TESTS COMPLETE - SECURITE API
echo ========================================
echo.
echo Ce script va executer:
echo   1. Test endpoint public ^(health^)
echo   2. Test endpoints sans auth ^(doivent echouer^)
echo   3. Test endpoints avec auth ^(doivent reussir^)
echo.
echo Appuyez sur une touche pour continuer...
pause > nul
echo.

REM === Test 1: Health check ===
echo.
echo ========================================
echo TEST 1/3: ENDPOINT PUBLIC
echo ========================================
echo.
call test-health.bat
echo.

REM === Test 2: Unauthorized access ===
echo.
echo ========================================
echo TEST 2/3: SECURITE SANS AUTH
echo ========================================
echo.
call test-unauthorized.bat
echo.

REM === Test 3: Authorized access ===
echo.
echo ========================================
echo TEST 3/3: ACCES AVEC AUTH
echo ========================================
echo.
echo IMPORTANT: Assurez-vous d'avoir configure le token
echo dans test-authorized.bat avant de continuer!
echo.
echo Appuyez sur une touche pour continuer ou CTRL+C pour annuler...
pause > nul
echo.
call test-authorized.bat
echo.

REM === Résumé final ===
echo.
echo ========================================
echo RESUME FINAL
echo ========================================
echo.
echo Tous les tests ont ete executes.
echo.
echo Verifiez les resultats ci-dessus:
echo   - Test 1: Endpoint public doit etre accessible
echo   - Test 2: Tous les endpoints doivent retourner 401
echo   - Test 3: Tous les endpoints doivent retourner 200
echo.
echo Si tous les tests passent, la securite est correcte!
echo.
echo ========================================
pause
