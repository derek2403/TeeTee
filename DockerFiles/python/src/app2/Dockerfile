FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    wget \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Create offload directory
RUN mkdir -p /app/offload

# Copy requirements first to leverage Docker cache
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app.py .

# Set environment variables for Hugging Face with long timeout
ENV TRANSFORMERS_CACHE=/root/.cache/huggingface
ENV HF_HOME=/root/.cache/huggingface
ENV HUGGINGFACE_HUB_CACHE=/root/.cache/huggingface
ENV HUGGINGFACE_HUB_DOWNLOAD_TIMEOUT=1200
ENV REQUESTS_CA_BUNDLE=/etc/ssl/certs/ca-certificates.crt
ENV TOKENIZERS_PARALLELISM=false

# Expose the application port
EXPOSE 5001

# Run the application
CMD ["python", "app.py"] 