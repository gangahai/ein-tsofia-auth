@echo off
echo ========================================
echo Ein Tsofia - Diagnostic Check
echo ========================================
echo.

echo [1/5] Checking Node.js installation...
node --version > diagnostic_log.txt 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH >> diagnostic_log.txt
) else (
    echo Node.js version: >> diagnostic_log.txt
    node --version >> diagnostic_log.txt
)
echo.

echo [2/5] Checking npm installation...
npm --version >> diagnostic_log.txt 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed or not in PATH >> diagnostic_log.txt
) else (
    echo npm version: >> diagnostic_log.txt
    npm --version >> diagnostic_log.txt
)
echo.

echo [3/5] Killing existing Node processes...
taskkill /F /IM node.exe >> diagnostic_log.txt 2>&1
echo.

echo [4/5] Attempting to build the project...
echo ===== BUILD OUTPUT ===== >> diagnostic_log.txt
npm run build >> diagnostic_log.txt 2>&1
echo ===== END BUILD OUTPUT ===== >> diagnostic_log.txt
echo.

echo [5/5] Starting development server...
echo ===== DEV SERVER OUTPUT ===== >> diagnostic_log.txt
timeout /t 2 /nobreak >nul
start /B npm run dev >> diagnostic_log.txt 2>&1
timeout /t 10 /nobreak
echo ===== END DEV SERVER OUTPUT ===== >> diagnostic_log.txt
echo.

echo ========================================
echo Diagnostic complete!
echo Results saved to: diagnostic_log.txt
echo ========================================
pause
