#!/bin/bash
set -e

PROJECT_ROOT=$(pwd)

echo "================================"
echo "Building application..."
echo "================================"

echo ""
echo "Building backend..."
cd $PROJECT_ROOT/tariff
./mvnw clean package -DskipTests -q
echo "Backend built successfully"
cd $PROJECT_ROOT

echo ""
echo "Building frontend..."
cd $PROJECT_ROOT/frontend
bun install --frozen-lockfile
bun run build
echo "Frontend built successfully"
cd $PROJECT_ROOT

echo ""
echo "================================"
echo "Build complete!"
echo "================================"
