#!/bin/bash

# Source container detection
source "$(dirname "$0")/is-in-container.sh"

# In container: use pip install directly
if is_in_container; then
    echo "Running in container, checking Python installation..."
    
    # Check for Python
    if ! command -v python3 &> /dev/null; then
        echo "Python not found, installing Python..."
        apt-get update && apt-get install -y python3 python3-pip
    fi
    
    # Check for pip
    if ! command -v pip &> /dev/null && ! command -v pip3 &> /dev/null; then
        echo "pip not found, installing pip..."
        apt-get update && apt-get install -y python3-pip
    fi
    
    echo "Installing detect-secrets..."
    pip3 install detect-secrets
    exit $?
fi

# Not in container: check if user wants venv
read -p "Do you want to install detect-secrets in a virtual environment? (y/N) " use_venv

if [[ $use_venv =~ ^[Yy]$ ]]; then
    echo "Setting up detect-secrets in virtual environment..."
    docker build -t detect-secrets-setup -f Dockerfile.setup-detect-secrets . && \
    docker run --rm -v "$(pwd)/.venv:/target" detect-secrets-setup
else
    echo "Installing detect-secrets globally via pip..."
    pip install detect-secrets
fi
