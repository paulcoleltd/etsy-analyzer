@echo off
:: Etsy Analyzer — Database Setup
:: Double-click this file (or run as Administrator for service start)
:: It will: start PostgreSQL, create DB, run migrations, seed your user.

setlocal

set PG_BIN=C:\Program Files\PostgreSQL\16\bin
set PGPASSWORD=password
set DB=etsy_analyzer
set PG_USER=postgres

echo.
echo ========================================
echo  Etsy Analyzer -- Database Setup
echo ========================================
echo.

:: 1. Add psql to PATH
set PATH=%PG_BIN%;%PATH%

:: 2. Start PostgreSQL service
echo [1/5] Starting PostgreSQL service...
net start postgresql-x64-16 2>nul
if %errorlevel%==0 (
    echo       Service started.
) else (
    echo       Service already running or started.
)
timeout /t 2 /nobreak >nul

:: 3. Test connection
echo [2/5] Testing connection...
"%PG_BIN%\psql.exe" -U %PG_USER% -c "SELECT version();" 2>nul
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Cannot connect to PostgreSQL on port 5432.
    echo Make sure PostgreSQL 16 is installed and the password is 'password'.
    echo.
    pause
    exit /b 1
)
echo       Connected OK.

:: 4. Create database (ignore error if already exists)
echo [3/5] Creating database '%DB%'...
"%PG_BIN%\psql.exe" -U %PG_USER% -c "CREATE DATABASE %DB%;" 2>nul
echo       Done (already exists is fine).

:: 5. Run schema migration
echo [4/5] Running schema migration...
"%PG_BIN%\psql.exe" -U %PG_USER% -d %DB% -f "%~dp0migrate.sql"
if %errorlevel% neq 0 (
    echo ERROR: Migration failed. See output above.
    pause
    exit /b 1
)

:: 6. Pre-verify email if account already exists, otherwise just ensure it will be auto-verified on signup
echo [5/5] Pre-verifying email for paulcoleltd@gmail.com (if account exists)...
"%PG_BIN%\psql.exe" -U %PG_USER% -d %DB% -c ^
  "UPDATE users SET email_verified = TRUE, plan = 'pro', plan_status = 'active' WHERE email = 'paulcoleltd@gmail.com';"
echo       Done (no rows updated means you haven't signed up yet -- that's fine, sign up first then run this again).

echo.
echo ========================================
echo  SUCCESS! Database is ready.
echo ========================================
echo.
echo  Next steps:
echo    1. In a new terminal: cd C:\Users\Dell\etsy-analyzer
echo    2. Run: .\scripts\start.ps1
echo    3. Open: http://localhost:3000
echo    4. Sign in: paulcoleltd@gmail.com
echo       (use the password you set when you signed up,
echo        OR sign up fresh — email is pre-verified)
echo.
echo  NOTE: You still need Redis for full functionality.
echo  Install it with: winget install Redis.Redis
echo.
pause
