@echo off
setlocal enabledelayedexpansion

echo ===============================================
echo    CONFLUENT REVERSE TRANSLATION TEST
echo    (Confluent to French)
echo ===============================================
echo.

REM Kill any existing server on port 3000
echo [1/3] Arret du serveur existant...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    taskkill //F //PID %%a >nul 2>&1
)
timeout /t 2 /nobreak >nul

REM Start server in background
echo [2/3] Demarrage du serveur...
cd /d "%~dp0"
start /B cmd /c "npm start >nul 2>&1"
timeout /t 5 /nobreak >nul

REM Check if server is running
curl -s http://localhost:3000/api/stats >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] Le serveur n'a pas demarre correctement
    exit /b 1
)

echo [3/3] Test de traduction Confluent to Francais...
echo.

REM Create temp file
set TEMP_FILE=%TEMP%\reverse_translation.json

REM ===============================================
REM TEXTE ORIGINAL EN FRANCAIS (reference):
REM "Les enfants des echos observent la confluence.
REM  Ils ecoutent les murmures du passe et transmettent la memoire aux nouvelles generations.
REM  Les faucons chasseurs protegent les frontieres tandis que les ailes-grises volent dans le ciel sombre.
REM  La civilisation repose sur l'observation, la transmission et l'union des castes.
REM  Nous devons comprendre et aimer notre peuple pour preserver la liberte et la verite."
REM ===============================================

REM Texte en Confluent a traduire
set "CF_TEXT=Va Nakukeko vo uraakota mirak u. Va tanisu vo temak vosak tikam u se vo memu no noviuaita kisun u. Va Akoazana vo bosa zakis u ta va Aliaska no kumu zeru aliuk u. Va uraikota no silimira se kisunuaita se kotauneki kota tokas u. Va mikisu vo na siliaska sekam ul se koris ul se vo aska se veri nekas u."

echo ===============================================
echo TEXTE CONFLUENT A TRADUIRE:
echo ===============================================
echo.
echo %CF_TEXT%
echo.
echo ===============================================

REM Call the Confluent to French translation API
curl -s -X POST http://localhost:3000/api/translate/conf2fr ^
  -H "Content-Type: application/json" ^
  -d "{\"text\": \"%CF_TEXT%\"}" > "%TEMP_FILE%"

REM Check if the request succeeded
if errorlevel 1 (
    echo [ERREUR] La requete API a echoue
    exit /b 1
)

echo.
echo ===============================================
echo RESULTAT DE LA TRADUCTION:
echo ===============================================
echo.

REM Parse and display the translation
python -c "import json, sys; data=json.load(open(r'%TEMP_FILE%', encoding='utf-8')); print('TRADUCTION FRANCAISE:'); print('-' * 47); print(data.get('translation', 'N/A')); print(); print('CONFIANCE:', str(data.get('confidence', 0)) + '%%'); print('MOTS TRADUITS:', data.get('wordsTranslated', 0)); print('MOTS NON TRADUITS:', data.get('wordsNotTranslated', 0))" 2>nul

if errorlevel 1 (
    echo [Parsage JSON echoue - affichage brut]
    type "%TEMP_FILE%"
)

echo.
echo ===============================================
echo COMPARAISON AVEC L'ORIGINAL:
echo ===============================================
echo.
echo ORIGINAL FR:
echo "Les enfants des echos observent la confluence.
echo  Ils ecoutent les murmures du passe et transmettent
echo  la memoire aux nouvelles generations. Les faucons
echo  chasseurs protegent les frontieres tandis que les
echo  ailes-grises volent dans le ciel sombre. La
echo  civilisation repose sur l'observation, la transmission
echo  et l'union des castes. Nous devons comprendre et aimer
echo  notre peuple pour preserver la liberte et la verite."
echo.

echo ===============================================
echo.
echo Serveur toujours actif sur http://localhost:3000
echo Pour arreter: taskkill //F //PID [PID du node.exe]
echo.

REM Clean up temp file
del "%TEMP_FILE%" >nul 2>&1

endlocal
