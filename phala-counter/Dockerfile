    FROM python:3.9-slim

    # Install Node.js and npm
    RUN apt-get update && apt-get install -y curl gnupg && \
        curl -fsSL https://deb.nodesource.com/setup_16.x | bash - && \
        apt-get install -y nodejs && \
        apt-get clean && rm -rf /var/lib/apt/lists/*

    WORKDIR /app

    # Install the Node dependency
    RUN npm install @phala/dstack-sdk

    # Copy Python requirements and install dependencies.
    COPY requirements.txt .
    RUN pip install --no-cache-dir -r requirements.txt

    # Copy the application code (Flask and Node script).
    COPY app.py ./
    COPY generate_ra.js ./

    # Expose the port the app will run on.
    EXPOSE 5000

    # Run the application using Gunicorn.
    CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app", "--log-level", "debug"]
