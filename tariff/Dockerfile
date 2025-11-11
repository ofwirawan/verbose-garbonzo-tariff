# Stage 1: Build the application
FROM eclipse-temurin:21-jdk as builder

WORKDIR /workspace
COPY .mvn/ .mvn
COPY mvnw pom.xml ./
RUN ./mvnw dependency:go-offline
COPY src ./src
COPY models ./models

# Build the JAR file
RUN ./mvnw package -DskipTests

# Stage 2: Create the final, minimal image
FROM eclipse-temurin:21-jre-jammy

WORKDIR /app

# Copy the built JAR from builder stage
COPY --from=builder /workspace/target/*.jar app.jar

# Create a non-root user for security
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Expose the default Spring Boot port
EXPOSE 8080

# Health check to verify the application is running
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD java -jar app.jar --check-health || exit 1

# Start the application with optimized JVM flags for containers
ENTRYPOINT ["java", \
  "-XX:+UseG1GC", \
  "-XX:MaxRAMPercentage=75.0", \
  "-XX:InitialRAMPercentage=50.0", \
  "-XX:+UseStringDeduplication", \
  "-Dcom.sun.management.jmxremote=false", \
  "-jar", "app.jar"]
