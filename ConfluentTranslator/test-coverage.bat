@echo off
setlocal enabledelayedexpansion

echo ===============================================
echo    CONFLUENT COVERAGE TEST SUITE
echo ===============================================
echo.

REM Kill any existing server on port 3000
echo [1/4] Arret du serveur existant...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    taskkill //F //PID %%a >nul 2>&1
)
timeout /t 2 /nobreak >nul

REM Start server in background
echo [2/4] Demarrage du serveur...
cd /d "%~dp0"
start /B cmd /c "npm start >nul 2>&1"
timeout /t 5 /nobreak >nul

REM Check if server is running
curl -s http://localhost:3000/api/stats >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] Le serveur n'a pas demarre correctement
    exit /b 1
)

echo [3/4] Execution des tests de coverage...
echo.

REM Create temp files
set TEMP_FILE=%TEMP%\coverage_results.json
set TEMP_MISSING=%TEMP%\missing_words.txt

REM Test 1 - Texte court culturel
curl -s -X POST http://localhost:3000/api/analyze/coverage -H "Content-Type: application/json" -d "{\"text\": \"Les enfants des echos observent le courant dans la confluence\"}" > "%TEMP_FILE%"
for /f "tokens=2 delims=:," %%a in ('findstr "\"coverage\"" "%TEMP_FILE%"') do set COV1=%%a
echo === TEST 1 - Texte court culturel === > "%TEMP_MISSING%"
type "%TEMP_FILE%" | findstr /C:"\"missing\"" >> "%TEMP_MISSING%"
echo. >> "%TEMP_MISSING%"

REM Test 2 - Texte long culturel
curl -s -X POST http://localhost:3000/api/analyze/coverage -H "Content-Type: application/json" -d "{\"text\": \"La civilisation de la Confluence repose sur l'observation, la transmission de la memoire et l'union des castes. Les Enfants des Echos ecoutent les murmures du passe tandis que les Faucons Chasseurs protegent les frontieres.\"}" > "%TEMP_FILE%"
for /f "tokens=2 delims=:," %%a in ('findstr "\"coverage\"" "%TEMP_FILE%"') do set COV2=%%a
echo === TEST 2 - Texte long culturel === >> "%TEMP_MISSING%"
type "%TEMP_FILE%" | findstr /C:"\"missing\"" >> "%TEMP_MISSING%"
echo. >> "%TEMP_MISSING%"

REM Test 3 - Vocabulaire quotidien
curl -s -X POST http://localhost:3000/api/analyze/coverage -H "Content-Type: application/json" -d "{\"text\": \"manger boire eau nourriture pain viande poisson legume fruit sel epice cuire couteau table feu lumiere maison porte fenetre toit sol mur escalier\"}" > "%TEMP_FILE%"
for /f "tokens=2 delims=:," %%a in ('findstr "\"coverage\"" "%TEMP_FILE%"') do set COV3=%%a
echo === TEST 3 - Vocabulaire quotidien === >> "%TEMP_MISSING%"
type "%TEMP_FILE%" | findstr /C:"\"missing\"" >> "%TEMP_MISSING%"
echo. >> "%TEMP_MISSING%"

REM Test 4 - Pronoms et verbes
curl -s -X POST http://localhost:3000/api/analyze/coverage -H "Content-Type: application/json" -d "{\"text\": \"je tu il elle nous vous ils regarder voir observer ecouter parler dire penser savoir comprendre aimer vouloir pouvoir devoir faire aller venir\"}" > "%TEMP_FILE%"
for /f "tokens=2 delims=:," %%a in ('findstr "\"coverage\"" "%TEMP_FILE%"') do set COV4=%%a
echo === TEST 4 - Pronoms et verbes === >> "%TEMP_MISSING%"
type "%TEMP_FILE%" | findstr /C:"\"missing\"" >> "%TEMP_MISSING%"
echo. >> "%TEMP_MISSING%"

REM Test 5 - Adjectifs
curl -s -X POST http://localhost:3000/api/analyze/coverage -H "Content-Type: application/json" -d "{\"text\": \"grand petit haut bas long court chaud froid bon mauvais beau laid fort faible rapide lent clair sombre\"}" > "%TEMP_FILE%"
for /f "tokens=2 delims=:," %%a in ('findstr "\"coverage\"" "%TEMP_FILE%"') do set COV5=%%a
echo === TEST 5 - Adjectifs courants === >> "%TEMP_MISSING%"
type "%TEMP_FILE%" | findstr /C:"\"missing\"" >> "%TEMP_MISSING%"
echo. >> "%TEMP_MISSING%"

REM Test 6 - Nombres
curl -s -X POST http://localhost:3000/api/analyze/coverage -H "Content-Type: application/json" -d "{\"text\": \"un deux trois quatre cinq six sept huit neuf dix cent mille premier dernier\"}" > "%TEMP_FILE%"
for /f "tokens=2 delims=:," %%a in ('findstr "\"coverage\"" "%TEMP_FILE%"') do set COV6=%%a
echo === TEST 6 - Nombres === >> "%TEMP_MISSING%"
type "%TEMP_FILE%" | findstr /C:"\"missing\"" >> "%TEMP_MISSING%"
echo. >> "%TEMP_MISSING%"

REM Get stats
curl -s http://localhost:3000/api/stats > "%TEMP_FILE%"
for /f "tokens=2 delims=:," %%a in ('findstr "\"total_entries\"" "%TEMP_FILE%"') do set ENTRIES=%%a

echo [4/4] Generation du rapport...
echo.
echo ===============================================
echo              RAPPORT DE COVERAGE
echo ===============================================
echo.
echo Lexique charge: %ENTRIES% entrees (ancien)
echo.
echo TEST 1 - Texte court culturel     : %COV1%%%
echo TEST 2 - Texte long culturel      : %COV2%%%
echo TEST 3 - Vocabulaire quotidien    : %COV3%%%
echo TEST 4 - Pronoms et verbes        : %COV4%%%
echo TEST 5 - Adjectifs courants       : %COV5%%%
echo TEST 6 - Nombres                  : %COV6%%%
echo.

REM Calculate average
set /a AVG=(%COV1%+%COV2%+%COV3%+%COV4%+%COV5%+%COV6%)/6
echo COVERAGE MOYEN                    : %AVG%%%
echo.
echo ===============================================
echo           MOTS MANQUANTS PAR TEST
echo ===============================================
echo.

REM Display missing words with python for better JSON parsing
python -c "import json; data=open(r'%TEMP_MISSING%', encoding='utf-8').read().replace('\\', '').replace('}{', '}\n{'); sections=data.split('==='); [print(section.strip()) for section in sections if section.strip()]" 2>nul

if errorlevel 1 (
    echo [Parsage JSON echoue - affichage brut]
    type "%TEMP_MISSING%"
)

echo.
echo ===============================================
echo.
echo Serveur toujours actif sur http://localhost:3000
echo Pour arreter: taskkill //F //PID [PID du node.exe]
echo.

REM Clean up temp files
del "%TEMP_FILE%" >nul 2>&1
del "%TEMP_MISSING%" >nul 2>&1

endlocal
