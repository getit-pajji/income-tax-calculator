@echo off
title TaxTracker+ Launcher
echo ===================================================
echo   Welcome to TaxTracker+ Onboarding Launcher
echo ===================================================
echo.
echo [*] Starting SQLite backend server on port 3000...
start "TaxTracker+ Backend" cmd /c "node server.js"

echo [*] Starting Vite React dev server on port 5173...
start "TaxTracker+ Frontend" cmd /c "npm run dev"

echo [*] Launching application in browser in 3 seconds...
timeout /t 3 /nobreak >nul
start http://localhost:5173

echo.
echo ===================================================
echo   TaxTracker+ is running!
echo   - Frontend: http://localhost:5173
echo   - Backend API: http://localhost:3000
echo ===================================================
echo.
echo You can keep this launcher running in the background or close it.
echo to stop the servers, close the separate terminal windows.
echo.
pause
