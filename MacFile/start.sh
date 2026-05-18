#!/bin/bash

# Exit on any error
set -e

# Configuration
VENV_NAME="venv"  # Should match the name in setup.sh

echo "🚀 Starting development servers..."

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Start npm (frontend) in background
echo "🌐 Starting frontend server..."
cd "$SCRIPT_DIR/COMP5615_F13_05_P29/frontend"  
npm start &
FRONTEND_PID=$!

# Wait a moment for npm to start
sleep 2

# Start uvicorn (backend) with virtual environment
echo "🐍 Starting backend server..."
cd "$SCRIPT_DIR/COMP5615_F13_05_P29/backend"

# Activate virtual environment and start uvicorn
source "$VENV_NAME/bin/activate"
uvicorn app.main:app --reload --port 5001 &
BACKEND_PID=$!

echo "✅ Both servers started!"
echo "   Frontend PID: $FRONTEND_PID"
echo "   Backend PID: $BACKEND_PID"
echo ""
echo "Press Ctrl+C to stop both servers..."

# Handle Ctrl+C to stop both processes
trap "echo '🛑 Stopping servers...'; kill $FRONTEND_PID $BACKEND_PID 2>/dev/null; exit" INT

# Wait for both processes
wait