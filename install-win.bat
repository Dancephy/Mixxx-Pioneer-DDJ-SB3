@echo off

copy lodash.mixxx.js %LOCALAPPDATA%\Mixxx\controllers\lodash.mixxx.js
copy midi-components-0.0.js %LOCALAPPDATA%\Mixxx\controllers\midi-components-0.0.js
copy Pioneer-DDJ-SB3-scripts.js %LOCALAPPDATA%\Mixxx\controllers\Pioneer-DDJ-SB3-scripts.js
copy Pioneer-DDJ-SB3.midi.xml %LOCALAPPDATA%\Mixxx\controllers\Pioneer-DDJ-SB3.midi.xml

echo Update current mapping to new version?
echo Changes to the mapping will be lost.

set /p id="y/N: "

if %id%=="y" goto :override

goto :end

:override

echo Overriding.....

for /f %f in ('dir /b %LOCALAPPDATA%\Mixxx\controllers') do
  if not x%f:DDJ-SB3=%==x%f%
    if "%f:~-4%"==".xml"
      copy Pioneer-DDJ-SB3.midi.xml %LOCALAPPDATA%\Mixxx\controllers\%f%

:end
echo 'Installed'
pause
