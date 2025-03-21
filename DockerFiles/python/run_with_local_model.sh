#!/bin/bash

# Create directories
mkdir -p ./models
mkdir -p ./offload

# Check if model is already downloaded
if [ ! -d "./models/tinyllama-1b" ]; then
    echo "Model not found locally. Downloading first..."
    pip install torch transformers
    python download_tinyllama.py
    
    # Check if download was successful
    if [ $? -ne 0 ]; then
        echo "Model download failed. Please check your internet connection."
        exit 1
    fi
fi

# Clean up existing containers
echo "Cleaning up existing containers..."
docker-compose down

# Build and start the containers
echo "Building and starting containers with local model..."
docker-compose up --build 