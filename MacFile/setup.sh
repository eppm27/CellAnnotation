#!/usr/bin/env bash

# Exit on any error, treat unset variables as errors, and make pipelines fail on first error
set -euo pipefail
IFS=$'\n\t'

# Configuration
REPO_URL="https://github.sydney.edu.au/emon0711/COMP5615_F13_05_P29"
CLONE_DIR="COMP5615_F13_05_P29"
VENV_NAME="venv"

echo "🚀 Starting setup process..."

# Clone the repository only if it doesn't exist as a directory
if [ -e "$CLONE_DIR" ]; then
    if [ -d "$CLONE_DIR/.git" ]; then
        echo "✓ Repository directory already exists and looks like a git repo — skipping clone."
        # Optionally pull latest changes (uncomment if you want an automatic pull)
        # echo "↻ Pulling latest changes..."
        # git -C "$CLONE_DIR" pull --rebase
    else
        echo "⚠️  A file or directory named '$CLONE_DIR' already exists but is not a git repository. Skipping clone."
        echo "If you want to replace it, remove or move it and run this script again."
    fi
else
    echo "📦 Cloning repository..."
    git clone "$REPO_URL" "$CLONE_DIR"
fi

# Navigate to repo
cd "$CLONE_DIR"

# Navigate to Python project directory and set up virtual environment
echo "🐍 Setting up Python virtual environment..."

# Ensure backend directory exists
if [ ! -d "backend" ]; then
    echo "❗ backend directory not found. Please check the repository structure."
    exit 1
fi
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "$VENV_NAME" ]; then
    python3 -m venv "$VENV_NAME"
    echo "✓ Virtual environment created"
else
    echo "✓ Virtual environment already exists"
fi

# Activate virtual environment
# shellcheck disable=SC1090
source "$VENV_NAME/bin/activate"

# Install Python dependencies if requirements.txt exists
if [ -f "requirements.txt" ]; then
    echo "📦 Installing Python dependencies..."
    pip install --upgrade pip
    pip install -r requirements.txt
else
    echo "⚠️  requirements.txt not found in backend — skipping pip install."
fi

# Deactivate virtual environment
deactivate

cd ..

# Install Node dependencies if frontend directory exists
if [ -d "frontend" ]; then
    echo "📦 Installing Node dependencies..."
    cd frontend
    npm install
    cd ..
else
    echo "⚠️  frontend directory not found — skipping npm install."
fi

echo "✅ Setup complete!"
echo ""
echo "To start the servers, run: ./start.sh"
```