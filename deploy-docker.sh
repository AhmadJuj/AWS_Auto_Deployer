#!/bin/bash

# Quick Docker Deployment Script
# Run this to deploy everything in one command!

set -e

echo "🚀 MERN Deployer - Docker Quick Start"
echo "======================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.docker .env
    echo "⚠️  Please edit .env with your credentials before continuing!"
    echo "   Required: GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, AWS credentials"
    read -p "Press Enter after you've updated .env..."
fi

# Choose deployment method
echo ""
echo "Choose deployment method:"
echo "1) All-in-One Container (Simplest - Single container)"
echo "2) Docker Compose (Recommended - Separate containers)"
read -p "Enter choice (1 or 2): " choice

if [ "$choice" = "1" ]; then
    echo ""
    echo "🔨 Building all-in-one Docker image..."
    docker build -t mern-deployer -f Dockerfile .
    
    echo ""
    echo "🚀 Starting container..."
    docker run -d \
        -p 3000:3000 \
        -p 5000:5000 \
        --name mern-deployer \
        --env-file .env \
        --restart unless-stopped \
        mern-deployer
    
    echo ""
    echo "✅ Deployment complete!"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend:  http://localhost:5000"
    echo ""
    echo "View logs: docker logs -f mern-deployer"
    
elif [ "$choice" = "2" ]; then
    echo ""
    echo "🔨 Building with Docker Compose..."
    docker-compose up -d --build
    
    echo ""
    echo "✅ Deployment complete!"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend:  http://localhost:5000"
    echo ""
    echo "View logs: docker-compose logs -f"
    
else
    echo "Invalid choice"
    exit 1
fi

echo ""
echo "🎉 Your MERN Deployer is now running!"
