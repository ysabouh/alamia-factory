@echo off
chcp 65001 >nul
cd /d "%~dp0backend"
if exist "C:\xampp\php\php.exe" set "PATH=C:\xampp\php;%PATH%"
php artisan factory:db-backup --label=manual
pause
