#!/bin/bash
set -e

echo "================================"
echo "Loading Java environment..."
echo "================================"

# Get project root (current directory when script starts)
PROJECT_ROOT=$(pwd)
JAVA_HOME_FILE="$PROJECT_ROOT/.java-runtime/java_home.txt"

# Read Java home from the file saved during build
if [ -f "$JAVA_HOME_FILE" ]; then
    export JAVA_HOME=$(cat "$JAVA_HOME_FILE")
    export PATH=$JAVA_HOME/bin:$PATH
    echo "Loaded JAVA_HOME from build: $JAVA_HOME"
else
    echo "ERROR: Java home file not found at: $JAVA_HOME_FILE"
    echo "Available files in project root:"
    ls -la $PROJECT_ROOT/.java-runtime 2>/dev/null || echo "No .java-runtime directory found"
    exit 1
fi

# Verify Java exists
if [ ! -x "$JAVA_HOME/bin/java" ]; then
    echo "ERROR: Java executable not found at: $JAVA_HOME/bin/java"
    exit 1
fi

echo "Verifying Java installation..."
$JAVA_HOME/bin/java -version

echo ""
echo "================================"
echo "Starting services..."
echo "================================"
echo ""

echo "Starting backend on port 8080..."
cd tariff
$JAVA_HOME/bin/java -jar target/tariff-0.0.1-SNAPSHOT.jar &
BACKEND_PID=$!
cd ..

echo "Starting frontend on port 3000..."
cd frontend
bun start &
FRONTEND_PID=$!
cd ..

echo ""
echo "================================"
echo "Both services started!"
echo "================================"
echo "Backend:  http://localhost:8080"
echo "Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both services"
echo "================================"
echo ""

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait
