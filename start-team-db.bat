@echo off
echo Starting HealthChatbot Team Database...
echo.

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

REM Start the database services
echo Starting PostgreSQL and pgAdmin...
docker-compose up -d

REM Wait a moment for services to start
timeout /t 5 /nobreak >nul

REM Check if services are running
echo.
echo Checking service status...
docker-compose ps

echo.
echo Database setup complete!
echo.
echo Access your database:
echo - PostgreSQL: localhost:5432
echo - pgAdmin: http://localhost:5050 (admin@healthchatbot.com / admin123)
echo.
echo Next steps:
echo 1. cd backend
echo 2. Create .env file with: DATABASE_URL=postgresql://postgres:password123@localhost:5432/healthchatbot
echo 3. pip install -r requirements.txt
echo 4. python -m uvicorn main:app --reload
echo.
pause


