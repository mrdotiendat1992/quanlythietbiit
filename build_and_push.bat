@echo off
chcp 65001 > nul
echo -------------------------------------------------------------
echo IT EQUIPMENT MANAGEMENT - BUILD & PUSH SCRIPT
echo -------------------------------------------------------------
echo.

set /p commit_msg="Nhap noi dung thay doi (Commit message). Bam Enter de dung tin nhan mac dinh: "
if "%commit_msg%"=="" set commit_msg="Auto build exe and update source code"

echo.
echo [1/4] Kiem tra va cap nhat thu vien...
call venv\Scripts\activate.bat
pip install -r requirements.txt > nul
pip install pyinstaller > nul

echo.
echo [2/4] Dang ket xuat file chay (.exe)...
REM The python script is built with pyinstaller. 
REM Included uvicorn and FastAPI to avoid missing modules in the final output file
pyinstaller --clean -y --name "QuanLyThietBiIT" --onefile --add-data "static;static" --hidden-import="uvicorn" --hidden-import="uvicorn.logging" --hidden-import="uvicorn.loops" --hidden-import="uvicorn.loops.auto" --hidden-import="uvicorn.protocols" --hidden-import="uvicorn.protocols.http" --hidden-import="uvicorn.protocols.http.auto" --hidden-import="uvicorn.protocols.websockets" --hidden-import="uvicorn.protocols.websockets.auto" --hidden-import="uvicorn.lifespan" --hidden-import="uvicorn.lifespan.on" main.py

echo.
echo [3/4] Dang dong bo vao Git...
git add .
git commit -m "%commit_msg%"

echo.
echo [4/4] Dang day len Github...
git push origin master

echo.
echo ==============================================================
echo HOAN THANH! 
echo Xem file chay chuong trinh o thu muc: dist/QuanLyThietBiIT.exe
echo ==============================================================
pause
