@echo off
echo ============================================
echo   BanglaSumQA - Starting Application
echo ============================================
echo.

:: Check if backend venv exists
if not exist "backend\venv" (
    echo [1/3] Creating Python virtual environment...
    cd backend
    python -m venv venv
    echo [2/3] Installing backend dependencies...
    call venv\Scripts\activate.bat
    pip install -r requirements.txt
    cd ..
)

:: Start Backend in new window
echo Starting FastAPI Backend on http://localhost:8000 ...
start "BanglaSumQA Backend" cmd /k "cd backend && call venv\Scripts\activate.bat && python app.py"

:: Wait a moment for backend to start
timeout /t 3 /nobreak >nul

:: Check if frontend node_modules exists
if not exist "frontend\node_modules" (
    echo Installing Frontend dependencies...
    cd frontend
    call npm install
    cd ..
)

:: Start Frontend
echo Starting React Frontend on http://localhost:5173 ...
start "BanglaSumQA Frontend" cmd /k "cd frontend && npm run dev"

:: Wait then open browser
timeout /t 4 /nobreak >nul
start http://localhost:5173

echo.
echo ============================================
echo   BanglaSumQA is running!
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:8000
echo   API Docs: http://localhost:8000/docs
echo ============================================
echo.
echo প্রথম চালুতে AI মডেল ডাউনলোড হবে (~2.4GB)
echo First run will download AI models (~2.4GB)
echo.
pause
