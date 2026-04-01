@echo off
chcp 65001
cd /d "%~dp0"

echo Building...
call npm run build
if %errorlevel% neq 0 (
    echo Build failed!
    pause
    exit /b 1
)

echo Starting...
node --env-file=.env dist/index.js
pause