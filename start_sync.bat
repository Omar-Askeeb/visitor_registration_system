@echo off
TITLE EventX Full System - DO NOT CLOSE
echo Starting All Services (Frontend, Backend, Sync)...
echo.

:: 1. Start Backend Server
echo Launching Backend (Laravel Server)...
start "Backend: Server" cmd /k "cd /d backend && php artisan serve --host=0.0.0.0 --port=8000"

:: 2. Start Frontend Server
echo Launching Frontend (Vite)...
start "Frontend: Vite" cmd /k "cd /d frontend && npm run dev"

:: 3. Start the Scheduler in a new window
echo Launching Sync Scheduler...
start "Sync: Scheduler" cmd /k "cd /d backend && php artisan schedule:work"

:: 4. Start the Queue Worker in a new window
echo Launching Sync Worker...
start "Sync: Worker" cmd /k "cd /d backend && php artisan queue:work --tries=1"

echo.
echo ---------------------------------------------------------
echo ALL SERVICES ARE NOW RUNNING.
echo ---------------------------------------------------------
echo 1. Backend: http://192.168.100.146:8000
echo 2. Frontend: Open the URL shown in the Vite window
echo 3. Sync: Active (Scheduler + Worker)
echo ---------------------------------------------------------
echo Keep the 4 background windows open to keep the system alive!
echo ---------------------------------------------------------
echo.
pause
