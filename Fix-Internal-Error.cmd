@echo off
chcp 65001 >nul
cd /d "%~dp0"
title MyFactory - Fix Internal Server Error

echo Stopping old Node processes on ports 3010 and 8000...
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":3010" ^| findstr LISTENING') do taskkill /F /PID %%p >nul 2>&1
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":8000" ^| findstr LISTENING') do taskkill /F /PID %%p >nul 2>&1

echo Removing corrupted Next cache (.next)...
if exist "frontend\.next" rmdir /s /q "frontend\.next"

echo Starting fresh...
call "%~dp0Start-MyFactory.cmd"
