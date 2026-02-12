@echo off
echo ========================================
echo Pushing Changes to GitHub
echo ========================================
echo.

echo Step 1: Adding all changes...
git add .
echo ✅ Changes staged
echo.

echo Step 2: Committing changes...
git commit -m "Add comprehensive admin analytics, fix authentication, and add site management features

- Added Analytics page with comprehensive site metrics and growth charts
- Fixed authentication checks across all admin pages (use adminToken instead of adminSecret)
- Added null safety to RegisteredUsers component
- Updated backend with /api/admin/analytics endpoint
- Enhanced navigation: separate Admin User Management from Registered Users
- Updated Dashboard quick actions
- All admin pages now properly authenticated with JWT
- Amazon theme consistently applied throughout admin panel"
echo ✅ Changes committed
echo.

echo Step 3: Pushing to GitHub...
git push origin main
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ⚠️  If this is your first push, you may need to run:
    echo    git push -u origin main
    echo.
    echo Or if your branch is named differently:
    echo    git push origin master
)
echo.

echo ========================================
echo ✅ Push Complete!
echo ========================================
echo.
pause
