# Stage 1: Build the application (This part was perfect)
FROM eclipse-temurin:21-jdk as builder

WORKDIR /workspace
COPY .mvn/ .mvn
COPY mvnw pom.xml ./
RUN ./mvnw dependency:go-offline
COPY src ./src
COPY models ./models
RUN ./mvnw package -DskipTests

# Stage 2: Create the final, minimal image
FROM eclipse-temurin:21-jre-jammy

WORKDIR /app

# --- FIX 1: Install curl ---
# We must switch back to root to install packages
USER root
RUN apt-get update && \
    apt-get install -y curl && \
    # Clean up the apt cache to keep the image small
    rm -rf /var/lib/apt/lists/*

# Copy the built JAR from builder stage
COPY --from=builder /workspace/target/*.jar app.jar

# Create a non-root user (Good security)
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
# --- FIX 2: Switch back to appuser ---
USER appuser

# Expose the default Spring Boot port
EXPOSE 8080

# --- FIX 3: Change the HEALTHCHECK ---
# 1. Use curl to check the web endpoint (much faster)
# 2. Increase start-period to 90s to give your ML service time to load
HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

# Start the application (Your entrypoint was good)
ENTRYPOINT ["java", \
  "-XX:+UseG1GC", \
  "-XX:MaxRAMPercentage=75.0", \
  "-XX:InitialRAMPercentage=50.0", \
  "-XX:+UseStringDeduplication", \
  "-Dcom.sun.management.jmxremote=false", \
  "-jar", "app.jar"]