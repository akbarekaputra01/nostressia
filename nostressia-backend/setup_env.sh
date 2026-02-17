#!/bin/bash
# Setup script for Nostressia Backend - Git Bash/Linux/Mac
# This script ensures Python 3.10 is used for the virtual environment

echo "================================================"
echo "Nostressia Backend Environment Setup"
echo "================================================"
echo ""

# Check if .venv exists
if [ -d ".venv" ]; then
    echo "[WARNING] Existing .venv detected."
    echo "Please ensure no Python processes are using it."
    read -p "Press Enter to continue (or Ctrl+C to cancel)..."
    echo "Removing old .venv..."
    rm -rf .venv
    if [ $? -ne 0 ]; then
        echo "[ERROR] Failed to remove .venv. Please close all Python processes and try again."
        exit 1
    fi
fi

echo "Creating new virtual environment with Python 3.10..."

# Try different Python 3.10 commands
if command -v py &> /dev/null; then
    # Windows with py launcher
    py -3.10 -m venv .venv
elif command -v python3.10 &> /dev/null; then
    # Linux/Mac with python3.10
    python3.10 -m venv .venv
else
    echo "[ERROR] Python 3.10 not found. Please install Python 3.10."
    exit 1
fi

if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to create virtual environment."
    exit 1
fi

echo ""
echo "Verifying Python version..."
.venv/Scripts/python --version 2>/dev/null || .venv/bin/python --version

echo ""
echo "Installing dependencies..."
if [ -f ".venv/Scripts/python" ]; then
    # Windows
    .venv/Scripts/python -m pip install --upgrade pip
    .venv/Scripts/pip install -r requirements.txt
else
    # Linux/Mac
    .venv/bin/python -m pip install --upgrade pip
    .venv/bin/pip install -r requirements.txt
fi

if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to install dependencies."
    exit 1
fi

echo ""
echo "================================================"
echo "Setup complete!"
echo "================================================"
echo ""
echo "To activate the environment, run:"
if [ -f ".venv/Scripts/activate" ]; then
    echo "  source .venv/Scripts/activate"
else
    echo "  source .venv/bin/activate"
fi
echo ""
echo "To start the backend server, run:"
echo "  uvicorn main:app --host 0.0.0.0 --port 8000 --reload"
echo ""
