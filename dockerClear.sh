#!/bin/bash

echo "🧹 Cleaning up Docker resources..."

echo "Stopping all containers..."
docker stop $(docker ps -a -q) 2>/dev/null || true

echo "Removing all containers..."
docker rm $(docker ps -a -q) 2>/dev/null || true

echo "Removing all images..."
docker rmi $(docker images -q) 2>/dev/null || true

echo "Removing all volumes..."
docker volume rm $(docker volume ls -q) 2>/dev/null || true

echo "Removing all networks..."
docker network prune -f

echo "Removing all unused data (including build cache)..."
docker system prune -a -f --volumes

echo "✨ Docker cleanup complete!" 