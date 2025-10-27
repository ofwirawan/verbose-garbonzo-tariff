#!/bin/bash

set -e

echo "Starting backend..."
cd tariff
./mvnw spring-boot:run &
BACKEND_PID=$!
cd ..

echo "Starting frontend..."
cd frontend
bun run dev &
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
