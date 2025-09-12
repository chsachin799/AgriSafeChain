@echo off
echo Setting up environment files for AgriSafeChain...
echo.

echo Creating backend .env file...
copy "backend\env-config.txt" "backend\.env"
if %errorlevel% equ 0 (
    echo ✅ Backend .env file created successfully
) else (
    echo ❌ Failed to create backend .env file
)

echo.
echo Creating root .env file...
copy "env-config.txt" ".env"
if %errorlevel% equ 0 (
    echo ✅ Root .env file created successfully
) else (
    echo ❌ Failed to create root .env file
)

echo.
echo Cleaning up temporary files...
del "backend\env-config.txt"
del "env-config.txt"

echo.
echo ✅ Environment setup complete!
echo.
echo Your configuration:
echo - MongoDB: mongodb://localhost:27017/agrofuns_db
echo - JWT Secret: Generated secure key
echo - Infura API: 3108b80d349444398c75f0a223df6470
echo - Contract: 0x586067af12ad3c0bC84d43ddB9d471162718f357
echo - Government Wallet: Configured
echo - Center Wallet: Configured
echo.
echo ⚠️  Remember to add your RazorPay keys when you get them!
echo.
echo Press any key to continue...
pause > nul
