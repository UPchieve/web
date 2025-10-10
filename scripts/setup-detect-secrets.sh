#!/bin/bash

echo "Setting up detect-secrets in local virtual environment..."

# Check for Python 3
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python 3 is required but not installed."
    exit 1
fi

# Create venv if it doesn't exist
if [ ! -d ".venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv .venv
fi

# Install detect-secrets
echo "📥 Installing detect-secrets..."
.venv/bin/pip install --upgrade pip --quiet
.venv/bin/pip install detect-secrets

echo "✅ Setup complete! detect-secrets is now available."
