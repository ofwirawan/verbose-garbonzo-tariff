#!/bin/bash
set -e

echo "Building backend..."
cd tariff
./mvnw clean install -DskipTests
cd ..

echo "Building frontend..."
cd frontend
bun install
bun run build
cd ..

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
