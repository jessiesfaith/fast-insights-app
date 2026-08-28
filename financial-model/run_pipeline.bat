@echo off
rem Windows entry point for the pipeline -- double-click it, or point a
rem Task Scheduler action at it (see README.md, "Automate it").
cd /d "%~dp0"
python run_pipeline.py
if errorlevel 1 (
  echo.
  echo PIPELINE FAILED -- scroll up for the first error.
  pause
  exit /b 1
)
echo.
echo Pipeline finished. Outputs are in the outputs\ folder.
pause
