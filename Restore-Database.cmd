@echo off
chcp 65001 >nul
cd /d "%~dp0backend"
if exist "C:\xampp\php\php.exe" set "PATH=C:\xampp\php;%PATH%"
echo.
echo   استعادة آخر نسخة احتياطية لقاعدة myfactory
echo   ==========================================
echo.
php artisan factory:db-restore
pause
