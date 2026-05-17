@echo off
chcp 65001 >nul
cd /d "%~dp0"
title MyFactory

if exist "%~dp0..\..\php\php.exe" set "PATH=%~dp0..\..\php;%PATH%"
if exist "C:\xampp\php\php.exe" set "PATH=C:\xampp\php;%PATH%"

set "APP_URL=http://127.0.0.1:3010/myfactory/ar/login"

echo.
echo   MyFactory - local start
echo   -----------------------
echo   1) XAMPP: start MySQL (Apache optional; app uses ports 8000 + 3010)
echo   2) In PowerShell use:  .\Start-MyFactory.cmd
echo   3) Keep the minimized "MyFactory" window running
echo.
echo   Open this URL in the browser:
echo   %APP_URL%
echo.

if not exist "node_modules\concurrently" (
  echo Installing root packages...
  call npm install
)
if not exist "frontend\node_modules" (
  echo Installing frontend packages...
  pushd frontend && call npm install && popd
)

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "try{$t=New-Object Net.Sockets.TcpClient;$t.Connect('127.0.0.1',3306);if($t.Connected){$t.Close();exit 0}}catch{};exit 1"
if errorlevel 1 (
  echo [Warning] MySQL is not listening on port 3306. Start MySQL in XAMPP first.
  echo.
)

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$api=$true;$web=$true;try{$t=New-Object Net.Sockets.TcpClient;$t.Connect('127.0.0.1',8000);$t.Close()}catch{$api=$false};try{$t=New-Object Net.Sockets.TcpClient;$t.Connect('127.0.0.1',3010);$t.Close()}catch{$web=$false};if($api -and $web){exit 0}else{exit 1}"
if errorlevel 1 (
  echo Starting API (8000) and UI (3010)...
  start "MyFactory" /MIN cmd /c "cd /d ""%~dp0"" && npm run dev"
  REM dev:clean inside npm run dev clears .next to avoid Internal Server Error
  echo Waiting for ports 8000 and 3010...
  powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$ok=$false;for($i=0;$i -lt 120;$i++){try{$a=New-Object Net.Sockets.TcpClient;$a.Connect('127.0.0.1',8000);$a.Close();$w=New-Object Net.Sockets.TcpClient;$w.Connect('127.0.0.1',3010);$w.Close();$ok=$true;break}catch{};Start-Sleep -Milliseconds 500};if(-not $ok){exit 1}"
  if errorlevel 1 (
    echo Failed to start. Check the minimized MyFactory window for errors.
    pause
    exit /b 1
  )
) else (
  echo API and UI are already running.
)

start "" "%APP_URL%"
echo.
echo Done. Login: admin@myfactory.local / Admin@2026
echo.
timeout /t 5 >nul
exit /b 0
