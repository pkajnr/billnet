@echo off
echo ====================================
echo BillNet Admin System Setup
echo ====================================
echo.

echo Step 1: Installing dependencies...
call npm install bcryptjs qrcode speakeasy
echo.

echo Step 2: Setting up admin database tables...
echo Running SQL schema...
psql -U postgres -d billnet -f admin_users_schema.sql
echo.

echo Step 3: Generating password hash...
node generate_hash.js
echo.

echo ====================================
echo Setup Complete!
echo ====================================
echo.
echo Admin credentials:
echo   Username: superadmin
echo   Password: Admin@2026!
echo   Email: admin@billnet.com
echo.
echo IMPORTANT: Change password after first login!
echo.
pause
