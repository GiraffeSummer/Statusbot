@echo off
set ttl = Tester bot
set /a repeat = 0
goto loop

:loop
set /a repeat = repeat+1
call run.bat %ttl% %repeat%
goto loop 