@echo off
:: Start portable PostgreSQL (no admin rights needed)
:: PostgreSQL data: C:\Users\Dell\pgsql\data

set PG_BIN=C:\Users\Dell\pgsql\bin
set DATA_DIR=C:\Users\Dell\pgsql\data
set LOG_FILE=C:\Users\Dell\pgsql\pg2.log

echo Checking PostgreSQL status...
"%PG_BIN%\pg_isready.exe" -U postgres -h 127.0.0.1 -p 5432 >nul 2>&1
if %errorlevel%==0 (
    echo PostgreSQL is already running on port 5432.
    goto :done
)

echo Starting PostgreSQL...
start /B "" "%PG_BIN%\postgres.exe" -D "%DATA_DIR%" -p 5432 >> "%LOG_FILE%" 2>&1

:: Wait up to 10s for it to be ready
for /L %%i in (1,1,10) do (
    timeout /t 1 /nobreak >nul
    "%PG_BIN%\pg_isready.exe" -U postgres -h 127.0.0.1 -p 5432 >nul 2>&1
    if !errorlevel!==0 goto :started
)
echo WARNING: PostgreSQL may not be ready yet. Check %LOG_FILE%
goto :done

:started
echo PostgreSQL started successfully.

:done
echo.
