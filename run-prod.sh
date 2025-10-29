#!/bin/bash
set -e

PROJECT_ROOT=$(pwd)

echo "================================"
echo "Configuring Java for runtime..."
echo "================================"

# Check if Java is available
if ! command -v java &> /dev/null; then
    echo "Java not found, downloading..."
    mkdir -p $HOME/.java-render
    cd $HOME/.java-render

    # Check if already downloaded
    if [ ! -d "jdk-21.0.1+12" ]; then
        wget -q https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.1%2B12/OpenJDK21U-jdk_x64_linux_hotspot_21.0.1_12.tar.gz
        tar -xzf OpenJDK21U-jdk_x64_linux_hotspot_21.0.1_12.tar.gz
        rm OpenJDK21U-jdk_x64_linux_hotspot_21.0.1_12.tar.gz
    fi

    export JAVA_HOME=$HOME/.java-render/jdk-21.0.1+12
    export PATH=$JAVA_HOME/bin:$PATH
    cd $PROJECT_ROOT
    echo "Java downloaded and installed at: $JAVA_HOME"
else
    echo "Java found in PATH"
fi

echo ""
echo "Verifying Java:"
java -version

echo ""
echo "================================"
echo "Starting services..."
echo "================================"
echo ""

# Start backend
echo "Starting backend on port 8080..."
cd $PROJECT_ROOT/tariff
java -jar target/tariff-0.0.1-SNAPSHOT.jar &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"
cd $PROJECT_ROOT

# Start frontend
echo "Starting frontend on port 3000..."
cd $PROJECT_ROOT/frontend
bun start &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"
cd $PROJECT_ROOT

echo ""
echo "================================"
echo "Services started!"
echo "================================"
echo "Backend:  http://localhost:8080"
echo "Frontend: http://localhost:3000"
echo ""

# Wait for both processes
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true" EXIT
wait
