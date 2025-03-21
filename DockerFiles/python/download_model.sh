#!/bin/bash

echo "Downloading model files to local cache..."
mkdir -p ~/.cache/huggingface
mkdir -p ./offload

# Install dependencies
pip install --upgrade pip
pip install torch transformers accelerate
pip install --no-deps xformers optimum bitsandbytes

# Set environment variables for timeouts
export HUGGINGFACE_HUB_DOWNLOAD_TIMEOUT=1800
export TOKENIZERS_PARALLELISM=false

# Run the download script with better error handling
echo "Starting model download process (this could take several minutes)..."
python download_model.py

# Check return code
if [ $? -ne 0 ]; then
    echo "Error: Model download failed."
    exit 1
fi

echo "Download completed. You can now run docker-compose up." 