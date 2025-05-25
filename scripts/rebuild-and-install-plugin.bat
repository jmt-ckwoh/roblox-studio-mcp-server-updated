@echo off
echo ========================================
echo  Roblox Studio MCP Plugin Rebuild Tool
echo ========================================
echo.

:: Check if we're in the right directory
if not exist "studio-plugin\default.project.json" (
    echo ERROR: Please run this script from the project root directory
    echo Expected to find: studio-plugin\default.project.json
    pause
    exit /b 1
)

:: Step 1: Close Roblox Studio if running
echo [1/5] Closing Roblox Studio...
taskkill /im "RobloxStudioBeta.exe" /f 2>nul
taskkill /im "RobloxStudio.exe" /f 2>nul
echo Studio processes terminated (if they were running)
timeout /t 2 /nobreak >nul

:: Step 2: Build TypeScript server
echo.
echo [2/5] Building TypeScript server...
call npm run build
if errorlevel 1 (
    echo ERROR: TypeScript build failed!
    pause
    exit /b 1
)
echo TypeScript build completed successfully

:: Step 3: Build Rojo plugin
echo.
echo [3/5] Building Roblox Studio plugin...
cd studio-plugin
rojo build --output MCPStudioPlugin.rbxm
if errorlevel 1 (
    echo ERROR: Rojo build failed!
    cd ..
    pause
    exit /b 1
)
cd ..
echo Plugin build completed successfully

:: Step 4: Install plugin to Studio
echo.
echo [4/5] Installing plugin to Roblox Studio...

:: Find Roblox Studio plugins directory
set "PLUGINS_DIR=%LOCALAPPDATA%\Roblox\Plugins"
if not exist "%PLUGINS_DIR%" (
    echo Creating plugins directory: %PLUGINS_DIR%
    mkdir "%PLUGINS_DIR%"
)

:: Copy plugin file
copy "studio-plugin\MCPStudioPlugin.rbxm" "%PLUGINS_DIR%\MCPStudioPlugin.rbxm" >nul
if errorlevel 1 (
    echo ERROR: Failed to copy plugin to Studio plugins directory
    echo Tried to copy to: %PLUGINS_DIR%
    pause
    exit /b 1
)
echo Plugin installed to: %PLUGINS_DIR%\MCPStudioPlugin.rbxm

:: Step 5: Launch Roblox Studio
echo.
echo [5/5] Launching Roblox Studio...

:: Try to find Studio executable in common locations
set "STUDIO_EXE="
if exist "%LOCALAPPDATA%\Roblox\Versions\RobloxStudioLauncherBeta.exe" (
    set "STUDIO_EXE=%LOCALAPPDATA%\Roblox\Versions\RobloxStudioLauncherBeta.exe"
) else if exist "%PROGRAMFILES(X86)%\Roblox\Versions\RobloxStudioLauncherBeta.exe" (
    set "STUDIO_EXE=%PROGRAMFILES(X86)%\Roblox\Versions\RobloxStudioLauncherBeta.exe"
) else (
    :: Look for any version directory with Studio
    for /d %%i in ("%LOCALAPPDATA%\Roblox\Versions\*") do (
        if exist "%%i\RobloxStudioBeta.exe" (
            set "STUDIO_EXE=%%i\RobloxStudioBeta.exe"
            goto :found_studio
        )
    )
)

:found_studio
if defined STUDIO_EXE (
    echo Starting Studio: %STUDIO_EXE%
    start "" "%STUDIO_EXE%"
    echo Roblox Studio launched successfully
) else (
    echo WARNING: Could not find Roblox Studio executable
    echo Please launch Roblox Studio manually
    echo The plugin has been installed to: %PLUGINS_DIR%\MCPStudioPlugin.rbxm
)

echo.
echo ========================================
echo  Plugin Rebuild and Install Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Wait for Studio to fully load
echo 2. Open or create a place
echo 3. Check the output for MCP plugin messages
echo 4. Look for the "Toggle MCP" button in the toolbar
echo.
echo Plugin location: %PLUGINS_DIR%\MCPStudioPlugin.rbxm
echo.
pause