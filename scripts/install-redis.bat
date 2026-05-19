@echo off
:: Install and start Redis on Windows via winget
echo.
echo ========================================
echo  Installing Redis for Windows
echo ========================================
echo.

:: Try winget first
winget install -e --id Redis.Redis --accept-source-agreements --accept-package-agreements
if %errorlevel%==0 goto start_redis

:: Fallback: Chocolatey
echo Trying Chocolatey...
choco install redis-64 -y
if %errorlevel%==0 goto start_redis

echo.
echo ERROR: Could not install Redis automatically.
echo Please download from: https://github.com/tporadowski/redis/releases
echo Download redis-x64-*.msi and run it, then come back here.
pause
exit /b 1

:start_redis
echo.
echo [*] Starting Redis service...
net start Redis 2>nul || redis-server --daemonize yes 2>nul || start "" /B redis-server
timeout /t 2 /nobreak >nul

echo [*] Testing Redis connection...
redis-cli ping
if %errorlevel%==0 (
    echo.
    echo Redis is running!
) else (
    echo Redis installed but not responding on first try.
    echo It may need a moment -- try: redis-cli ping
)

echo.
pause
