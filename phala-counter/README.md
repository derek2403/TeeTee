# Phala Network TEE Counter

A simple counter application designed for Phala Network TEE (Trusted Execution Environment) with Remote Attestation (RA) reporting.

## Features

- RESTful API for a simple counter
- Dockerized application
- Supports Phala Network TEE integration via socket mounting
- Includes Remote Attestation (RA) reporting for every API call
- Custom RA report generation endpoint

## API Endpoints

- `/` - Welcome page with available endpoints
- `/counter` - Get the current counter value
- `/counter/increment` - Increment the counter by 1
- `/counter/reset` - Reset the counter to 0
- `/ra-report` - Generate a custom RA report with user-provided data (POST endpoint)

## Remote Attestation Reports

Each API response includes a Remote Attestation (RA) report that verifies the execution of the code in the Trusted Execution Environment (TEE). The RA report contains:

- A timestamp of when the report was generated
- Information about the base image
- A TDX quote in hex format
- Event logs
- RTMRs (Root of Trust Measurement Registers)
- The attested data (including details of the action performed)

## Building and Running Locally

### Prerequisites

- Docker and Docker Compose installed
- Docker Hub account (for pushing the image)

### Build and Run

1. Clone this repository
2. Navigate to the project directory
3. Build and run using Docker Compose:

```bash
# Set your Docker Hub username
export DOCKER_HUB_USERNAME=yourusername

# Build and run
docker-compose up --build
```

The application will be available at `http://localhost:5000`

## Pushing to Docker Hub

```bash
# Log in to Docker Hub
docker login

# Build the image
docker build -t $DOCKER_HUB_USERNAME/phala-counter:latest .

# Push the image to Docker Hub
docker push $DOCKER_HUB_USERNAME/phala-counter:latest
```

## Deployment

1. Pull the image from Docker Hub:

```bash
docker pull $DOCKER_HUB_USERNAME/phala-counter:latest
```

2. Run with Docker Compose:

```bash
# Set your Docker Hub username
export DOCKER_HUB_USERNAME=yourusername

# Start the service
docker-compose up -d
```

The application will be accessible at the assigned IP address on port 5000.

## Phala Network TEE Integration

This application is designed to work with Phala Network TEE by mounting the required socket:

```yaml
volumes:
  - /var/run/tappd.sock:/var/run/tappd.sock
```

### Using Custom RA Reports

You can generate a custom RA report by sending a POST request to the `/ra-report` endpoint:

```bash
curl -X POST -H "Content-Type: application/json" -d '{"key": "value", "custom": "data"}' https://your-app-url/ra-report
```

This will generate an RA report that includes your custom data, which can be verified to have been processed inside the TEE. 