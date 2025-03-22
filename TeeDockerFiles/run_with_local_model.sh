#!/bin/bash

# Create directories in a location that's gitignored
mkdir -p ~/.cache/huggingface/models
mkdir -p ./models
mkdir -p ./offload

# Update model path to use cache directory
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