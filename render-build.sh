#!/bin/bash
set -e

PROJECT_ROOT=$(pwd)

echo "================================"
echo "Setting up Java..."
echo "================================"

# Download Java if not available
if ! command -v java &> /dev/null; then
    echo "Downloading Java 21..."
    mkdir -p $HOME/.java-render
    cd $HOME/.java-render
    wget -q https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.1%2B12/OpenJDK21U-jdk_x64_linux_hotspot_21.0.1_12.tar.gz
    tar -xzf OpenJDK21U-jdk_x64_linux_hotspot_21.0.1_12.tar.gz
    export JAVA_HOME=$HOME/.java-render/jdk-21.0.1+12
    export PATH=$JAVA_HOME/bin:$PATH
    cd $PROJECT_ROOT
    echo "Java installed at: $JAVA_HOME"
else
    echo "Java found in PATH"
fi

echo "Java version:"
java -version

echo ""
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
