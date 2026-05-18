# Requires PowerShell 5+
$ErrorActionPreference = "Stop"

$APP_NAME = "ann-standalone"
$VERSION = "0.0.1"

if ([System.Runtime.InteropServices.RuntimeInformation]::IsOSPlatform([System.Runtime.InteropServices.OSPlatform]::Windows)) {
    Write-Host "Starting build of ANN for Windows..."
    $APP_NAME = "$APP_NAME-$VERSION-windows-x86_64"
} elseif ([System.Runtime.InteropServices.RuntimeInformation]::IsOSPlatform([System.Runtime.InteropServices.OSPlatform]::Linux)) {
    Write-Host "It is recommended to run the script build.local.sh on Linux"
    exit 1
} elseif ([System.Runtime.InteropServices.RuntimeInformation]::IsOSPlatform([System.Runtime.InteropServices.OSPlatform]::OSX)) {
    Write-Host "It is recommended to run the script build.local.ps1 on macOS"
    exit 1
} else {
    Write-Host "Unknown OS"
    exit 1
}

# 1. Build React frontend
Write-Host "Building React frontend..."
Set-Location frontend
npm install
npm run build:client
Set-Location ..

# 2. Copy frontend dist into backend
Write-Host "Copying frontend build into backend..."
$backendFrontend = "backend/frontend"
if (Test-Path $backendFrontend) {
    Remove-Item $backendFrontend -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $backendFrontend | Out-Null
Copy-Item -Recurse -Force frontend/dist/* $backendFrontend

# 3. Create venv (if not exists) and activate it
Write-Host "Activating python venv..."
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# 4. Install dependencies
Write-Host "Installing backend dependencies..."
Set-Location backend
pip install -r requirements.txt nuitka

# 5. Run PyInstaller in backend
Write-Host "Building backend and frontend with Nuitka..."
nuitka `
  --standalone --onefile `
  --include-data-dir=frontend=frontend `
  --include-data-file=app/logging.yaml=app/logging.yaml `
  --include-package=passlib.handlers.bcrypt `
  --include-package=openslide `
  --include-package=openslide_bin `
  --include-package-data=openslide_bin `
  --include-data-files="openslide_bin\*.dll=openslide_bin\" `


# 6. Deactivate venv
Write-Host "Deactivating python venv..."
deactivate

# 8. Move archives to root dist folder
Write-Host "Moving executable file to root directory..."
Set-Location ..
if (Test-Path "backend/dist/$APP_NAME.exe") {
    Copy-Item "backend/dist/$APP_NAME.exe" .
}

# 9. Cleanup
Write-Host "Cleaning up..."
Remove-Item -Recurse -Force frontend/dist
Remove-Item -Recurse -Force backend/dist
Remove-Item -Recurse -Force backend/frontend/*

Write-Host "Build completed! Check the exe file in the root directory."
