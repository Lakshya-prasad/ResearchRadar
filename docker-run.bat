@echo off
REM ============================================
REM ResearchRadar — Docker Build & Run Script
REM ============================================
REM Usage: docker-run.bat [GROQ_API_KEY]
REM
REM Example:
REM   docker-run.bat your_groq_api_key
REM   docker-run.bat                  (runs without AI features)
REM ============================================

SET IMAGE_NAME=researchradar
SET CONTAINER_NAME=researchradar-app
SET PORT=5000

SET GROQ_KEY=%1
IF "%GROQ_KEY%"=="" SET GROQ_KEY=your-groq-api-key-here

echo.
echo  ============================================
echo   ResearchRadar — Docker Deployment
echo  ============================================
echo.

REM Step 1: Stop and remove any existing container
echo [1/3] Cleaning up old container...
docker stop %CONTAINER_NAME% 2>nul
docker rm %CONTAINER_NAME% 2>nul

REM Step 2: Build the Docker image
echo [2/3] Building Docker image...
docker build -t %IMAGE_NAME%:latest .
IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo  ERROR: Docker build failed!
    echo  Make sure Docker Desktop is running.
    echo.
    pause
    exit /b 1
)

REM Step 3: Run the container
echo [3/3] Starting container...
docker run -d ^
    --name %CONTAINER_NAME% ^
    -p %PORT%:5000 ^
    -e GROQ_API_KEY=%GROQ_KEY% ^
    -e SECRET_KEY=docker-secret-key-2026 ^
    -e FLASK_DEBUG=false ^
    -v %CD%\uploads:/app/uploads ^
    --restart unless-stopped ^
    %IMAGE_NAME%:latest

IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo  ERROR: Failed to start container!
    echo.
    pause
    exit /b 1
)

echo.
echo  ============================================
echo   ResearchRadar is running!
echo  ============================================
echo.
echo   URL:       http://localhost:%PORT%
echo   Container: %CONTAINER_NAME%
echo   Image:     %IMAGE_NAME%:latest
echo.
echo   Useful commands:
echo     docker logs -f %CONTAINER_NAME%    (view logs)
echo     docker stop %CONTAINER_NAME%       (stop)
echo     docker start %CONTAINER_NAME%      (restart)
echo.
