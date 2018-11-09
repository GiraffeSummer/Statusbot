@echo off
set ttl=Status_bot
set /a repeat=0
goto loop

:loop
set /a repeat=%repeat% +1
call runRaw.bat %ttl% %repeat%
cls
goto loop 