# Sharded LLM in Docker with TEE Support (CPU Version)

This project demonstrates how to split a large language model (LLM) across two containers, which could be deployed in separate Trusted Execution Environments (TEEs) for enhanced security.

## Model Architecture

The setup uses a Llama 3 model (DeepHermes-3-Llama-3-3B-Preview) split across two containers:
- **app1**: Runs the first half of the model's layers
- **app2**: Runs the second half of the model's layers

## Requirements

- Docker and Docker Compose
- At least 16GB of system RAM
- Patience (CPU inference will be slow!)

## Local Development

### Build and Run Locally

1. Make sure you have Docker and Docker Compose installed.

2. Build and run both containers:

```bash
cd DockerFiles/python
docker-compose up --build
```

### Using the Client

Three ways to interact with the model:

#### 1. Command-Line Client (Interactive)

```bash
# Run in interactive mode
python client.py
```

#### 2. Command-Line Client (Single Query)

```bash
# Run a single query and exit
python client.py --prompt "Explain quantum computing in simple terms"
```

#### 3. HTTP Request

```bash
curl -X POST http://localhost:5000/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Explain quantum computing in simple terms"}'
```

### Cleaning Up Downloads

If you need to clean up partially downloaded model files:

```bash
# Make it executable first
chmod +x cleanup.sh
# Run it
./cleanup.sh
```

### Build and Push to Docker Hub

```bash
# For app1
cd DockerFiles/python/src/app1
docker build -t <username>/llm-node1-cpu:latest .
docker push <username>/llm-node1-cpu:latest

# For app2
cd ../app2
docker build -t <username>/llm-node2-cpu:latest .
docker push <username>/llm-node2-cpu:latest
```

## Deployment on Oyster

1. Edit the `oyster-docker-compose.yml` file to replace `<username>` with your Docker Hub username.

2. Deploy the enclave:

```bash
# Replace <key> with private key of the wallet
oyster-cvm deploy --wallet-private-key <key> --duration-in-minutes 60 --docker-compose oyster-docker-compose.yml
```

3. Interact with the model:

```bash
# If deployed locally
python client.py

# If deployed remotely
python client.py --host <ip> --port 5000
```

## How It Works

1. The input prompt is received by app1
2. app1 processes the prompt through the first half of the model layers
3. The intermediate activations are sent to app2
4. app2 completes the processing through the remaining layers
5. The generated text is returned to the client via app1

## Security Considerations

When deployed in TEEs:
- Each container has access to only a portion of the model
- Intermediate activations are only exposed during transit between TEEs
- Input data is protected within the TEE environment

## Performance Considerations

When running in CPU mode:
- Expect much slower inference times (minutes instead of seconds)
- Consider using a smaller model for faster responses
- Reduce `max_new_tokens` in app2.py for shorter outputs

## Model Customization

To use a different model, modify the `model_name` variable in both app1/app.py and app2/app.py files. 