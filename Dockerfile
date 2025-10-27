# Stage 1: Build backend (Java/Maven)
FROM eclipse-temurin:21-jdk as backend-builder
WORKDIR /app/tariff
COPY tariff/pom.xml .
COPY tariff/.mvn .mvn
COPY tariff/mvnw .
RUN chmod +x mvnw && ./mvnw dependency:go-offline
COPY tariff/src ./src
RUN ./mvnw clean install -DskipTests

# Stage 2: Build frontend (Bun/Next.js)
FROM oven/bun:latest as frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json .
COPY frontend/bun.lockb* .
RUN bun install --frozen-lockfile
COPY frontend .
RUN bun run build

# Stage 3: Runtime (minimal image)
FROM eclipse-temurin:21-jre
WORKDIR /app

# Install bun runtime
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
RUN curl -fsSL https://bun.sh/install | bash

# Copy built backend
COPY --from=backend-builder /app/tariff/target/tariff-*.jar ./app.jar

# Copy built frontend
COPY --from=frontend-builder /app/frontend/.next ./frontend/.next
COPY --from=frontend-builder /app/frontend/public ./frontend/public
COPY --from=frontend-builder /app/frontend/node_modules ./frontend/node_modules
COPY --from=frontend-builder /app/frontend/package.json ./frontend/

# Expose ports
EXPOSE 8080 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8080/actuator/health || exit 1

# Start both services
CMD ["sh", "-c", "java -jar /app/app.jar & /root/.bun/bin/bun start --prefix /app/frontend & wait"]
