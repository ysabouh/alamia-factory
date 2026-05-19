@echo off
chcp 65001 >nul
cd /d "%~dp0"
title MyFactory

if exist "%~dp0..\..\php\php.exe" set "PATH=%~dp0..\..\php;%PATH%"
if exist "C:\xampp\php\php.exe" set "PATH=C:\xampp\php;%PATH%"

set "APP_URL=http://127.0.0.1:3010/myfactory/ar/login"

echo.
echo   MyFactory - تشغيل محلي
echo   =====================
echo.
echo   المجلد: %CD%
echo.
echo   في PowerShell يجب كتابة:
echo     cd C:\xampp\htdocs\myfactory
echo     .\Start-MyFactory.cmd
echo   وليس: Start-MyFactory.cmd
echo.
echo   1) شغّل MySQL من XAMPP
echo   2) اترك نافذة "MyFactory" المصغّرة مفتوحة
echo   3) أول تشغيل قد يستغرق 1-2 دقيقة (بناء Next.js)
echo.
echo   الرابط:
echo   %APP_URL%
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo [خطأ] Node.js غير موجود في PATH. ثبّت Node أو أعد فتح الطرفية.
  pause
  exit /b 1
)
where php >nul 2>&1
if errorlevel 1 (
  echo [خطأ] PHP غير موجود. تأكد من XAMPP في C:\xampp\php
  pause
  exit /b 1
)

if not exist "node_modules\concurrently" (
  echo تثبيت حزم الجذر...
  call npm install
  if errorlevel 1 (
    echo فشل npm install في مجلد المشروع.
    pause
    exit /b 1
  )
)
if not exist "frontend\node_modules" (
  echo تثبيت حزم الواجهة...
  pushd frontend && call npm install && popd
  if errorlevel 1 (
    echo فشل npm install في frontend.
    pause
    exit /b 1
  )
)

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "try{$t=New-Object Net.Sockets.TcpClient;$t.Connect('127.0.0.1',3306);if($t.Connected){$t.Close();exit 0}}catch{};exit 1"
if errorlevel 1 (
  echo [تحذير] MySQL لا يستمع على المنفذ 3306. شغّل MySQL من XAMPP أولاً.
  echo.
)

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$api=$true;$web=$true;try{$t=New-Object Net.Sockets.TcpClient;$t.Connect('127.0.0.1',8000);$t.Close()}catch{$api=$false};try{$t=New-Object Net.Sockets.TcpClient;$t.Connect('127.0.0.1',3010);$t.Close()}catch{$web=$false};if($api -and $web){exit 0}else{exit 1}"
if errorlevel 1 (
  echo جاري تشغيل API ^(8000^) والواجهة ^(3010^)...
  start "MyFactory" /MIN cmd /k "cd /d ""%~dp0"" && title MyFactory-Servers && npm run dev"
  echo انتظار الجاهزية ^(قد يصل إلى دقيقتين في أول مرة^)...
  powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$ok=$false;for($i=0;$i -lt 180;$i++){try{$a=New-Object Net.Sockets.TcpClient;$a.Connect('127.0.0.1',8000);$a.Close();$w=New-Object Net.Sockets.TcpClient;$w.Connect('127.0.0.1',3010);$w.Close();$ok=$true;break}catch{};Start-Sleep -Milliseconds 500};if(-not $ok){exit 1}"
  if errorlevel 1 (
    echo.
    echo [فشل] لم تفتح المنافذ 8000 و 3010 في الوقت المتوقع.
    echo افتح النافذة المصغّرة "MyFactory-Servers" واقرأ رسالة الخطأ.
    echo أو شغّل يدوياً:  cd /d "%~dp0"  ثم  npm run dev
    echo.
    pause
    exit /b 1
  )
) else (
  echo API والواجهة يعملان مسبقاً.
)

start "" "%APP_URL%"
echo.
echo تم. الدخول: admin@myfactory.local / Admin@2026
echo لا تغلق نافذة MyFactory-Servers المصغّرة.
echo.
timeout /t 8 >nul
exit /b 0
