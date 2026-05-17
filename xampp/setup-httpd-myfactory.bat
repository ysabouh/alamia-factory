@echo off
chcp 65001 >nul
setlocal
title MyFactory - Apache setup (one time)

set "HTTPD=C:\xampp\apache\conf\httpd.conf"
if not exist "%HTTPD%" (
  echo XAMPP not found at C:\xampp
  echo Edit the HTTPD path in this file if XAMPP is installed elsewhere.
  pause
  exit /b 1
)

echo Enabling mod_rewrite and mod_proxy in httpd.conf ...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$p='%HTTPD%'; $c=Get-Content -Raw $p; " ^
  "$c=$c -replace '#LoadModule rewrite_module','LoadModule rewrite_module'; " ^
  "$c=$c -replace '#LoadModule proxy_module','LoadModule proxy_module'; " ^
  "$c=$c -replace '#LoadModule proxy_http_module','LoadModule proxy_http_module'; " ^
  "if($c -notmatch 'AllowOverride All'){Write-Warning 'Check AllowOverride All for htdocs manually'}; " ^
  "Set-Content -Path $p -Value $c -Encoding UTF8"

echo.
echo Restart Apache from the XAMPP Control Panel.
echo Then: start MySQL, run Start-MyFactory.cmd, and open:
echo   http://127.0.0.1:3010/myfactory/ar/login
echo   (Your Apache may use port 8080; the app UI always uses port 3010.)
echo.
pause
