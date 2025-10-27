#!/bin/bash
set -e

PROJECT_ROOT=$(pwd)

echo "================================"
echo "Configuring Java for runtime..."
echo "================================"

# Set JAVA_HOME if Java was downloaded during build
if [ -d "$HOME/.java-render/jdk-21.0.1+12" ]; then
    export JAVA_HOME=$HOME/.java-render/jdk-21.0.1+12
    export PATH=$JAVA_HOME/bin:$PATH
    echo "Using Java at: $JAVA_HOME"
elif command -v java &> /dev/null; then
    echo "Java already in PATH"
else
    echo "ERROR: Java not found!"
    exit 1
fi

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
