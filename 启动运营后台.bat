@echo off
setlocal

cd /d "%~dp0"

echo.
echo Starting Personal FileStore Admin...
echo Project directory: %CD%
echo.

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm was not found.
  echo Please install Node.js first, then run this file again.
  echo.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Dependencies were not found. Running npm install...
  echo.
  call npm install
  if errorlevel 1 (
    echo.
    echo [ERROR] npm install failed.
    pause
    exit /b 1
  )
  echo.
)

echo Starting admin dev server...
echo Admin address: http://localhost:5000/#/admin
echo.

start "Personal FileStore Admin" /min cmd /c "npm run dev:admin"

start "" /min powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Sleep -Seconds 3; Start-Process 'http://localhost:5000/#/admin'"

echo Admin dev server is running in a separate window.
echo Close that window when you want to stop the server.
echo.
pause

echo.
echo Done.
