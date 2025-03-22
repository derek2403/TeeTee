#!/bin/bash
set -e

# Replace with your Docker Hub username
DOCKER_USERNAME="derek2403"

# Make sure Docker buildx is available
docker buildx version

# Check if "multiarch" builder exists and use it, otherwise create it
if docker buildx inspect multiarch > /dev/null 2>&1; then
  echo "Using existing multiarch builder"
  docker buildx use multiarch
else
  echo "Creating new multiarch builder"
  docker buildx create --name multiarch --use
fi

# Build and push app2
echo "Building and pushing app2..."
docker buildx build \
  --platform linux/amd64 \
  -t $DOCKER_USERNAME/app2:latest \
  --push \
  ./src/app2

# Build and push app1
echo "Building and pushing app1..."
docker buildx build \
  --platform linux/amd64 \
  -t $DOCKER_USERNAME/app1:latest \
  --push \
  ./src/app1

echo "Done! Images have been pushed to Docker Hub." 