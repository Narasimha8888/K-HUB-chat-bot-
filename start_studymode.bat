@echo off
echo Starting Studymode AI...

:: Start the FastAPI Backend
echo Starting Backend (FastAPI)...
start "Studymode Backend" cmd /c "cd backend && .\venv\Scripts\python.exe -m uvicorn main:app --reload"

:: Start the React Frontend
echo Starting Frontend (Vite)...
start "Studymode Frontend" cmd /c "cd frontend && npm run dev"

:: Wait for a few seconds to let servers spin up
timeout /t 5 /nobreak >nul

:: Open browser
echo Opening in browser...
start http://localhost:5173/

echo Done! Both servers are running in separate command windows.
pause
