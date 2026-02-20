@echo off
setlocal
echo ========================================
echo Push Email Notification Update to GitHub
echo ========================================
echo.

cd /d d:\appz\bilnet

echo Step 1: Show current branch...
git branch --show-current
echo.

echo Step 2: Stage updated files...
git add backend/emailService.js backend/index.js backend/.env.example backend/render.yaml admin/src/utils/api.ts admin/src/pages/Settings.tsx frontend/src HOSTING_GUIDE.md push_email_update.bat
echo ✅ Files staged
echo.

echo Step 3: Commit changes...
git commit -m "Fix production email flow and switch frontend API calls to VITE_API_URL"
if %ERRORLEVEL% NEQ 0 (
  echo.
  echo ⚠️ Commit skipped (possibly no changes to commit).
)
echo.

echo Step 4: Push to GitHub...
git push origin main
if %ERRORLEVEL% NEQ 0 (
  echo.
  echo ⚠️ Push failed. Try first-time upstream command:
  echo    git push -u origin main
)

echo.
echo ========================================
echo ✅ Done
echo ========================================
pause
