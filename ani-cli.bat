@echo off
setlocal
set "SCRIPT_DIR=%~dp0"
set "PATH=%SCRIPT_DIR%bin;%PATH%"
"C:\Program Files\Git\bin\bash.exe" "%SCRIPT_DIR%ani-cli\ani-cli" %*
