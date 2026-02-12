@echo off
echo ========================================
echo BillNet Admin Setup - Complete Guide
echo ========================================
echo.

echo Step 1: Check if admin tables exist...
psql -U postgres -d billnet -c "SELECT COUNT(*) FROM admin_users;" 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Admin tables do not exist yet.
    echo.
    echo Step 2: Creating admin database tables...
    psql -U postgres -d billnet -f admin_users_schema.sql
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Failed to create tables. Check your PostgreSQL connection.
        pause
        exit /b 1
    )
    echo ✅ Admin tables created successfully!
) else (
    echo ✅ Admin tables already exist.
)
echo.

echo Step 3: Creating superadmin account with correct password...
node create_superadmin.js
echo.

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo You can now login at: http://localhost:5174
echo.
echo Credentials:
echo   Username: superadmin
echo   Password: Admin@2026!
echo.
echo ⚠️  IMPORTANT: Change password after first login!
echo.
pause
