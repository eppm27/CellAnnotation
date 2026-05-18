#!/bin/bash
set -e

APP_NAME="ann-standalone"
VERSION="0.0.1"

if [[ "$OSTYPE" == "linux-gnu"* ]]; then
  echo "Starting build of ANN for Linux..."
  APP_NAME="$APP_NAME-$VERSION-linux-x86_64"
elif [[ "$OSTYPE" == "darwin"* ]]; then
  echo "Starting build of ANN for macOS..."
  APP_NAME="$APP_NAME-$VERSION-macos-x86_64"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
  echo "It is recommended to run the script build.local.ps1 on Windows"
  exit 1
else
  echo "Unknown OS: $OSTYPE"
  exit 1
fi

# 1. Build React frontend
echo "Building React frontend..."
cd frontend
npm install
npm run build:client
cd ..

# 2. Copy frontend dist into backend
echo "Copying frontend build into backend..."
if ls backend/frontend 1> /dev/null 2>&1; then
    rm -rf backend/frontend
fi
mkdir -p backend/frontend
cp -r frontend/dist/* backend/frontend/

# 3. Create venv (if not exists) and activate it
echo "Activating python venv..."
python3 -m venv .venv
source .venv/bin/activate

# 4. Install dependencies
echo "Installing backend dependencies..."
cd backend
pip install -r requirements.txt nuitka

# 5. Run Nuitka in backend
echo "Building backend and frontend with Nuitka..."
nuitka \
  --standalone --onefile \
  --include-data-dir=frontend=frontend \
  --include-data-file=app/logging.yaml=app/logging.yaml \
  --include-package=passlib.handlers.bcrypt \
  --output-dir=dist \
  --output-filename=$APP_NAME \
  run_prod.py

# 6. Deactivate venv
echo "Deactivating python venv..."
deactivate

# 7. Move executable file to root dist folder
echo "Moving executable file to root directory..."
cd ..
if ls backend/dist/$APP_NAME 1> /dev/null 2>&1; then
    cp backend/dist/$APP_NAME .
fi

# 8. Cleanup
echo "Cleaning up..."
rm -rf frontend/dist
rm -rf backend/dist
rm -rf backend/frontend/*

echo "Build completed! Check the ELF file in the root directory."
