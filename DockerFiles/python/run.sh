#!/bin/bash

# Create directories for caching and offloading
mkdir -p ~/.cache/huggingface
mkdir -p ./offload

# Clean up existing containers before starting
docker-compose down

# Pre-download model on host to ensure it works
echo "Downloading model on host before starting Docker..."
./download_model.sh

# If pre-download failed, exit
if [ $? -ne 0 ]; then
    echo "Failed to download model. Please check your internet connection."
    exit 1
fi

# Build and start the containers
echo "Building and starting containers..."
docker-compose up --build

# Note: removed the -d flag to see logs directly 