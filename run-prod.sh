#!/bin/bash
set -e

echo "================================"
echo "Loading Java environment..."
echo "================================"

# Try to source the Java environment file first
if [ -f $HOME/.java_env.sh ]; then
    echo "Found Java environment file, sourcing it..."
    source $HOME/.java_env.sh
    echo "JAVA_HOME from file: $JAVA_HOME"
fi

# Check if Java exists at the expected location
if [ ! -d "$JAVA_HOME" ]; then
    echo "JAVA_HOME directory not found at: $JAVA_HOME"
    echo "Searching for Java installation..."

    # Try common locations
    if [ -d "$HOME/.java/jdk-21.0.1+12" ]; then
        export JAVA_HOME=$HOME/.java/jdk-21.0.1+12
        export PATH=$JAVA_HOME/bin:$PATH
        echo "Found Java at: $JAVA_HOME"
    else
        echo "ERROR: Could not find Java installation!"
        exit 1
    fi
fi

echo "Verifying Java..."
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
