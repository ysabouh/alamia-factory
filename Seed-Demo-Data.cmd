@echo off
chcp 65001 >nul
cd /d "%~dp0backend"
if exist "C:\xampp\php\php.exe" set "PATH=C:\xampp\php;%PATH%"
echo.
echo   توليد بيانات تجريبية (مع نسخة احتياطية تلقائية قبل التوليد)
echo   =============================================================
echo.
php artisan factory:seed-demo
pause
