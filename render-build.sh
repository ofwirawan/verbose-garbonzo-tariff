#!/bin/bash
set -e

export JAVA_HOME=/usr/lib/jvm/java-21-openjdk
export PATH=$JAVA_HOME/bin:$PATH

echo "Checking Java installation..."
java -version

echo ""
echo "================================"
echo "Building backend..."
echo "================================"
cd tariff
./mvnw clean install -DskipTests
cd ..

echo ""
echo "================================"
echo "Building frontend..."
echo "================================"
cd frontend
bun install
bun run build
cd ..

echo ""
echo "================================"
echo "Build complete!"
echo "================================"
