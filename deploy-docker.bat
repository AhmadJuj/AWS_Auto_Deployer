@echo off
REM Quick Docker Deployment Script for Windows
REM Run this to deploy everything in one command!

echo ========================================
echo  MERN Deployer - Docker Quick Start
echo ========================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

REM Check if .env exists
if not exist .env (
    echo Creating .env file from template...
    copy .env.docker .env
    echo.
    echo WARNING: Please edit .env with your credentials before continuing!
    echo Required: GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, AWS credentials
    pause
)

REM Choose deployment method
echo.
echo Choose deployment method:
echo 1) All-in-One Container (Simplest - Single container)
echo 2) Docker Compose (Recommended - Separate containers)
set /p choice="Enter choice (1 or 2): "

if "%choice%"=="1" (
    echo.
    echo Building all-in-one Docker image...
    docker build -t mern-deployer -f Dockerfile .
    
    echo.
    echo Starting container...
    docker run -d ^
        -p 3000:3000 ^
        -p 5000:5000 ^
        --name mern-deployer ^
        --env-file .env ^
        --restart unless-stopped ^
        mern-deployer
    
    echo.
    echo Deployment complete!
    echo   Frontend: http://localhost:3000
    echo   Backend:  http://localhost:5000
    echo.
    echo View logs: docker logs -f mern-deployer
    
) else if "%choice%"=="2" (
    echo.
    echo Building with Docker Compose...
    docker-compose up -d --build
    
    echo.
    echo Deployment complete!
    echo   Frontend: http://localhost:3000
    echo   Backend:  http://localhost:5000
    echo.
    echo View logs: docker-compose logs -f
    
) else (
    echo Invalid choice
    exit /b 1
)

echo.
echo Your MERN Deployer is now running!
pause
