#!/bin/bash
set -e

echo "================================"
echo "Setting up Java..."
echo "================================"

# Check if Java is already available
if ! command -v java &> /dev/null; then
    echo "Java not found, downloading JDK 21..."
    mkdir -p $HOME/.java
    cd $HOME/.java
    wget https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.1%2B12/OpenJDK21U-jdk_x64_linux_hotspot_21.0.1_12.tar.gz
    tar -xzf OpenJDK21U-jdk_x64_linux_hotspot_21.0.1_12.tar.gz
    export JAVA_HOME=$HOME/.java/jdk-21.0.1+12
    export PATH=$JAVA_HOME/bin:$PATH
    cd -
else
    echo "Java is available"
    java -version
fi

echo ""
echo "================================"
echo "Building backend..."
echo "================================"
cd tariff
./mvnw clean package -DskipTests
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
