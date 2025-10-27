#!/bin/bash
set -e

# Store the project root directory
PROJECT_ROOT=$(pwd)

echo "================================"
echo "Environment Info"
echo "================================"
echo "HOME: $HOME"
echo "PWD: $PWD"
echo "PROJECT_ROOT: $PROJECT_ROOT"
echo ""

echo "================================"
echo "Setting up Java..."
echo "================================"

# Check if Java is already available
if ! command -v java &> /dev/null; then
    echo "Java not found, downloading JDK 21..."
    mkdir -p $HOME/.java
    cd $HOME/.java
    wget https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.1%2B12/OpenJDK21U-jdk_x64_linux_hotspot_21.0.1_12.tar.gz
    tar -xzf OpenJDK21U-jdk_x64_linux_hotspot_21.0.1_12.tar.gz
    JAVA_HOME=$HOME/.java/jdk-21.0.1+12
    export JAVA_HOME
    export PATH=$JAVA_HOME/bin:$PATH

    echo "Java installed at: $JAVA_HOME"
    $JAVA_HOME/bin/java -version

    # Return to project root
    cd $PROJECT_ROOT
else
    echo "Java is available"
    java -version
    JAVA_HOME=$(dirname $(dirname $(readlink -f $(which java))))
    export JAVA_HOME
fi

echo ""
echo "================================"
echo "Building backend..."
echo "================================"
cd $PROJECT_ROOT/tariff
./mvnw clean package -DskipTests
cd $PROJECT_ROOT

echo ""
echo "================================"
echo "Building frontend..."
echo "================================"
cd $PROJECT_ROOT/frontend
bun install
bun run build
cd $PROJECT_ROOT

echo ""
echo "================================"
echo "Saving Java configuration..."
echo "================================"
# Save Java path to a file that will be readable at runtime
mkdir -p $PROJECT_ROOT/.java-runtime
echo "$JAVA_HOME" > $PROJECT_ROOT/.java-runtime/java_home.txt
echo "Java path saved to: $PROJECT_ROOT/.java-runtime/java_home.txt"
cat $PROJECT_ROOT/.java-runtime/java_home.txt

echo ""
echo "================================"
echo "Build complete!"
echo "================================"
