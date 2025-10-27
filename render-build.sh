#!/bin/bash
set -e

# Store the project root directory
PROJECT_ROOT=$(pwd)

echo "================================"
echo "Building application..."
echo "================================"

echo ""
echo "Building backend..."
cd $PROJECT_ROOT/tariff
./mvnw clean package -DskipTests
cd $PROJECT_ROOT

echo ""
echo "Building frontend..."
cd $PROJECT_ROOT/frontend
bun install
bun run build
cd $PROJECT_ROOT

echo ""
echo "================================"
echo "Build complete!"
echo "================================"
