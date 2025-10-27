#!/bin/bash
set -e

# Store the project root directory
PROJECT_ROOT=$(pwd)

echo "================================"
echo "Setting up Java..."
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
    mkdir -p $HOME/.java-build
    cd $HOME/.java-build
    wget -q https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.1%2B12/OpenJDK21U-jdk_x64_linux_hotspot_21.0.1_12.tar.gz
    tar -xzf OpenJDK21U-jdk_x64_linux_hotspot_21.0.1_12.tar.gz
    export JAVA_HOME=$HOME/.java-build/jdk-21.0.1+12
    export PATH=$JAVA_HOME/bin:$PATH
    cd $PROJECT_ROOT
    echo "Java installed at: $JAVA_HOME"
fi

echo "Verifying Java..."
java -version

echo ""
echo "================================"
echo "Building application..."
echo "================================"

echo ""
echo "Building backend..."
cd $PROJECT_ROOT/tariff
./mvnw clean package -DskipTests
cd $PROJECT_ROOT

echo ""
echo "Building frontend..."
cd $PROJECT_ROOT/frontend
bun install
bun run build
cd $PROJECT_ROOT

echo ""
echo "================================"
echo "Build complete!"
echo "================================"
