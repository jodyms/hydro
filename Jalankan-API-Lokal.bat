@echo off
title Hydromart Local PHP Server
echo ==============================================
echo Menghidupkan Server PHP Standar untuk API
echo Server Berjalan di Port 8000
echo ==============================================
echo.
cd %~dp0api
php -S localhost:8000
pause
