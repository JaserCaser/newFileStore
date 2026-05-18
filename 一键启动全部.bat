@echo off
setlocal

cd /d "%~dp0"

echo.
echo Starting Personal FileStore App and Admin...
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

echo Starting dev servers...
echo App address: http://localhost:5137/#/files
echo Admin address: http://localhost:5000/#/admin
echo.

start "Personal FileStore App" /min cmd /c "npm run dev:app"
start "Personal FileStore Admin" /min cmd /c "npm run dev:admin"

start "" /min powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Sleep -Seconds 3; Start-Process 'http://localhost:5137/#/files'; Start-Process 'http://localhost:5000/#/admin'"

echo Both dev servers are running in separate windows.
echo Close those windows when you want to stop the servers.
echo.
pause

echo.
echo Done.
