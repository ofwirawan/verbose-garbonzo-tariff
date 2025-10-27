#!/bin/bash
set -e

PROJECT_ROOT=$(pwd)

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
