#!/bin/bash
set -e

# Source Java environment if it was downloaded during build
if [ -f $HOME/.java_env.sh ]; then
    echo "Loading Java environment..."
    source $HOME/.java_env.sh
else
    # Fallback to checking standard locations
    export JAVA_HOME=${JAVA_HOME:-$HOME/.java/jdk-21.0.1+12}
    export PATH=$JAVA_HOME/bin:$PATH
fi

echo "JAVA_HOME: $JAVA_HOME"
echo "PATH: $PATH"
java -version

echo ""
echo "================================"
echo "Starting services..."
echo "================================"
echo ""

echo "Starting backend on port 8080..."
cd tariff
java -jar target/tariff-0.0.1-SNAPSHOT.jar &
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
