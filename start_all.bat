@echo off
echo ========================================
echo Starting BillNet Platform
echo ========================================
echo.

echo Step 1: Checking if backend is running...
curl -s http://localhost:5000/api/admin/verify >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Backend is already running on port 5000
) else (
    echo ⚠️  Backend is not running
    echo.
    echo Starting backend server...
    start "BillNet Backend" cmd /k "cd backend && npm start"
    timeout /t 3 >nul
)
echo.

echo Step 2: Starting Admin Panel...
start "BillNet Admin" cmd /k "cd admin && npm run dev"
echo.

echo Step 3: Starting Frontend...
start "BillNet Frontend" cmd /k "cd frontend && npm run dev"
echo.

echo ========================================
echo ✅ All services starting!
echo ========================================
echo.
echo Services:
echo   Backend:  http://localhost:5000
echo   Admin:    http://localhost:5174
echo   Frontend: http://localhost:5173
echo.
echo Admin Login:
echo   Username: superadmin
echo   Password: Admin@2026!
echo.
pause
