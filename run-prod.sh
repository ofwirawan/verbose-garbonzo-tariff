#!/bin/bash
set -e

echo "================================"
echo "Setting up Java runtime..."
echo "================================"

# Function to find Java
find_java() {
    # Check if java command exists
    if command -v java &> /dev/null; then
        echo "Found java in PATH"
        return 0
    fi

    # Check common locations
    local locations=(
        "/opt/render/.java/jdk-21.0.1+12/bin/java"
        "$HOME/.java/jdk-21.0.1+12/bin/java"
        "/usr/lib/jvm/java-21-openjdk/bin/java"
        "/usr/lib/jvm/default-java/bin/java"
    )

    for loc in "${locations[@]}"; do
        if [ -x "$loc" ]; then
            echo "Found java at: $loc"
            export JAVA_HOME=$(dirname $(dirname "$loc"))
            export PATH=$JAVA_HOME/bin:$PATH
            return 0
        fi
    done

    return 1
}

# Try to find existing Java
if ! find_java; then
    echo "Java not found, downloading JDK 21..."
    mkdir -p $HOME/.java-runtime
    cd $HOME/.java-runtime
    wget -q https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.1%2B12/OpenJDK21U-jdk_x64_linux_hotspot_21.0.1_12.tar.gz
    tar -xzf OpenJDK21U-jdk_x64_linux_hotspot_21.0.1_12.tar.gz
    export JAVA_HOME=$HOME/.java-runtime/jdk-21.0.1+12
    export PATH=$JAVA_HOME/bin:$PATH
    cd -
    echo "Java downloaded and installed"
fi

echo "Verifying Java..."
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
