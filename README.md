# Tariff Calculation & Prediction System

An AI-powered platform that helps businesses, policy analysts, and students calculate tariffs, understand global trade patterns, and identify optimal timing for international transactions.

## 🎯 Key Features

### Tariff Calculation Engine

- **Instant Calculations**: Calculate tariffs based on HS6 product codes (6-digit international codes)
- **Multiple Rate Types**: MFN (Most Favored Nation), preferential rates via Free Trade Agreements, and duty suspensions
- **Accurate Duty Handling**: Supports specific and compound duty structures
- **Total Cost Analysis**: Includes tariff + freight + insurance for complete landed cost assessment

### AI-Powered Timing Recommendations

- **365-Day Forecast**: Predicts optimal periods for transactions over the next year
- **Smart Insights**: Identifies 3 best periods (lowest rates) and 2 periods to avoid (highest rates)
- **Savings Calculator**: Shows potential savings in both percentage and dollar amounts
- **Weekly Aggregation**: 52 weeks of structured recommendations with confidence scores

### Machine Learning Predictions

- **Dual-Method Approach**:
  - ML regression trees when sufficient historical data exists
  - Statistical fallback for limited data scenarios
- **Confidence Scoring**: 40-100% confidence based on data availability
- **Seasonal Pattern Detection**: Identifies trends (e.g., April-June typically cheaper, January expensive)
- **Intelligent Feature Engineering**: Uses temporal, rate history, and trade policy features

### Admin Dashboard

- **User Management**: Create, update, and manage user accounts with role-based access
- **Data Maintenance**: Manage countries, products, tariff rates, and trade preferences
- **Transaction Analytics**: Track and analyze all import/export transactions
- **Insights & Reports**: Global comparisons, tariff hotspots, and trend analysis

### User Profiles & Personalization

- **Three Profile Types**: Business Owner, Policy Analyst, Student
- **Tailored Recommendations**: Profile-specific insights and AI-powered summaries
- **Gemini Integration**: AI generates natural language explanations of tariff patterns

### Freight & Insurance Integration

- **Multi-Mode Support**: Ocean and air freight calculations
- **Freightos API**: Real-time shipping rate integration
- **Total Landed Cost**: Combined tariff, freight, and insurance costs
- **Cost Transparency**: Clear breakdown of all cost components

---

## 🏗️ Architecture

### Technology Stack

#### Backend

- **Framework**: Spring Boot 3.5.6 with Spring Security
- **Language**: Java 21
- **Database**: PostgreSQL (Supabase)
- **Authentication**: JWT tokens with refresh mechanism
- **ML Library**: Tribuo 4.3.2 (Regression Tree models)
- **External APIs**: World Bank WITS, Freightos, Google Gemini

#### Frontend

- **Framework**: Next.js 15.5.3 (React 19.1.0)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Components**: Radix UI, Lucide React, Tabler Icons
- **Forms**: React Hook Form + Zod validation
- **Database Client**: Prisma ORM
- **Charts**: Recharts for data visualization
- **Package Manager**: Bun (faster alternative to npm)

#### DevOps

- **Containerization**: Docker (multi-stage builds)
- **CI/CD**: GitHub Actions
- **Backend**: AWS EC2 with systemd service management
- **Frontend**: AWS Amplify (serverless, auto-scaled)
- **Container Registry**: GitHub Container Registry (GHCR)

---

## 🚀 Quick Start

### Prerequisites

- Java 21+
- Node.js 18+ or Bun
- PostgreSQL or Supabase account
- Git

### Local Development Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/vindyanggiono/verbose-garbonzo-tariff.git
   cd verbose-garbonzo-tariff
   ```

2. **Configure environment variables**

   **Backend** (`tariff/.env`):

   ```env
   SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/tariff_db
   SPRING_DATASOURCE_USERNAME=postgres
   SPRING_DATASOURCE_PASSWORD=your_password
   JWT_SECRET=your-32-byte-hex-secret-key
   WITS_BASE_URL=https://wits.worldbank.org/api/v1
   GEMINI_API_KEY=your_gemini_api_key
   FREIGHT_API_URL=https://api.freightos.com
   ```

   **Frontend** (`frontend/.env`):

   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/tariff_db"
   NEXT_PUBLIC_API_URL=http://localhost:8080
   ```

3. **Start the application**

   ```bash
   # Run both backend and frontend
   ./run-local.sh
   ```

   Or manually:

   ```bash
   # Terminal 1: Backend (port 8080)
   cd tariff
   mvn spring-boot:run

   # Terminal 2: Frontend (port 3000)
   cd frontend
   bun install
   bun run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080
   - Swagger UI: http://localhost:8080/swagger-ui.html

---

## 📊 API Documentation

### Core Endpoints

**Tariff Calculation**

```bash
POST /api/calculate
Content-Type: application/json

{
  "importer_code": "USA",
  "exporter_code": "CHN",
  "hs6code": "100190",
  "quantity": 1000
}
```

**AI Recommendations**

```bash
POST /api/ai/recommendation
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "importer_code": "USA",
  "exporter_code": "CHN",
  "hs6code": "100190",
  "quantity": 500
}
```

**User Authentication**

```bash
# Signup
POST /api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password",
  "profile_type": "BUSINESS_OWNER"
}

# Login
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password"
}

# Response
{
  "access_token": "eyJhbGciOiJIUzI1NiJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiJ9...",
  "expires_in": 3600
}
```

See [Swagger UI](http://localhost:8080/swagger-ui.html) for complete API documentation.

---

## 🤖 Machine Learning System

The prediction engine uses a sophisticated two-method approach:

### Method 1: Statistical Fallback (< 3 historical records)

- Base confidence: 40%
- Formula: `40 + (50 × log(records) / log(100))`
- Prediction bounds: ±20%

### Method 2: Machine Learning (≥ 3 historical records)

- Uses Tribuo regression tree models
- Base confidence: min(80%, 50% + (records/10))
- Prediction bounds: ±10%

### Features Engineered

- **Temporal**: Month (sine/cosine encoding), day of year, day of week
- **Rate History**: 3-year average, 5-year average, volatility, trend
- **Trade Factors**: FTA presence, duty suspensions, years since FTA

### Output

- Daily rate predictions for 365 days
- Weekly aggregations with confidence scores
- Identification of 3 optimal periods and 2 periods to avoid

For detailed ML documentation, see [TARIFF_PREDICTION_SYSTEM.md](TARIFF_PREDICTION_SYSTEM.md).

---

## 📁 Project Structure

```
verbose-garbonzo-tariff/
├── tariff/                              # Spring Boot Backend
│   ├── src/main/java/.../
│   │   ├── controller/                  # REST API endpoints
│   │   │   ├── TariffController         # Tariff calculations
│   │   │   ├── AIController             # AI recommendations
│   │   │   ├── UserController           # Authentication & profiles
│   │   │   ├── MetadataController       # Countries & products
│   │   │   ├── HistoryController        # Transaction history
│   │   │   ├── StatisticsController     # Analytics
│   │   │   └── admin/                   # Admin-only endpoints
│   │   ├── service/                     # Business logic
│   │   │   ├── TariffService            # Core calculations
│   │   │   ├── TariffMLService          # ML predictions
│   │   │   ├── AIRecommendationService  # Timing optimization
│   │   │   ├── FreightService           # Shipping costs
│   │   │   ├── GeminiSummaryService     # AI text generation
│   │   │   └── JwtService               # Token management
│   │   ├── model/                       # DTOs & data models
│   │   ├── repository/                  # Database access
│   │   ├── config/                      # Spring configurations
│   │   └── filter/                      # JWT authentication filter
│   ├── models/                          # Serialized ML models
│   ├── pom.xml                          # Maven dependencies
│   └── Dockerfile                       # Container build config
│
├── frontend/                            # Next.js React App
│   ├── app/                             # Next.js App Router
│   │   ├── dashboard/                   # Main tariff calculation UI
│   │   ├── admin/                       # Admin management pages
│   │   ├── insights/                    # Analytics & reports
│   │   ├── profile/                     # User profile management
│   │   └── signup/                      # Auth pages
│   ├── components/                      # Reusable React components
│   ├── lib/                             # Utilities & helpers
│   ├── hooks/                           # Custom React hooks
│   ├── prisma/                          # Database schema
│   └── middleware.ts                    # Authentication middleware
│
├── .github/workflows/                   # GitHub Actions
│   ├── ci.yml                           # CI pipeline
│   ├── deploy.yml                       # CD pipeline
│   ├── security.yml                     # Security scanning
│   └── docker-build-push.yml            # Docker builds
│
├── TARIFF_PREDICTION_SYSTEM.md          # ML system documentation
├── CI_CD_SETUP.md                       # Deployment guide
├── run-local.sh                         # Start development environment
└── README.md                            # This file
```

---

## 🧪 Testing

### Backend Tests

```bash
cd tariff
mvn test                    # Run all tests
mvn test -Dtest=TariffTest  # Run specific test
mvn jacoco:report           # Generate code coverage report
```

**Test Coverage:**

- Controllers (admin & main endpoints)
- Services (tariff, ML, recommendations)
- Repository integration tests
- Exception handling tests

### Frontend Testing

```bash
cd frontend
bun run lint                # ESLint checks
bun run build               # TypeScript & build validation
```

**CI Automation:**

- GitHub Actions runs all tests automatically on pull requests
- Code coverage tracked via Codecov
- Security scanning (CodeQL, Trivy, Gitleaks)

---

## 🐳 Docker Deployment

### Build Docker Image

```bash
docker build -t tariff-app:latest .
docker run -p 8080:8080 \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://host.docker.internal:5432/tariff_db \
  -e SPRING_DATASOURCE_USERNAME=postgres \
  -e SPRING_DATASOURCE_PASSWORD=your_password \
  -e JWT_SECRET=your-32-byte-hex-secret \
  tariff-app:latest
```

### Docker Compose (with PostgreSQL)

```bash
docker-compose up -d
```

---

## ☁️ Cloud Deployment

### AWS Deployment

**Backend (EC2):**

```bash
# SSH into EC2 instance
ssh -i key.pem ec2-user@your-instance-ip

# Clone repository & deploy
git clone https://github.com/vindyanggiono/verbose-garbonzo-tariff.git
cd verbose-garbonzo-tariff/tariff
mvn clean package
java -jar target/tariff-app.jar
```

The system auto-restarts via systemd service on failure.

**Frontend (AWS Amplify):**

- Connected to GitHub main branch
- Automatically builds and deploys on push
- Environment variables configured in Amplify console

**Database (Supabase):**

- PostgreSQL managed instance
- Connection pooling via PgBouncer
- Automatic backups enabled

See [CI_CD_SETUP.md](CI_CD_SETUP.md) for detailed deployment instructions.

### Render.com Deployment (Free Tier)

```bash
# Build script handles Java 21 installation
bash render-build.sh

# Run production
bash run-prod.sh
```

---

## 🔐 Security Features

### Authentication & Authorization

- JWT token-based authentication with refresh mechanism
- Spring Security integration with role-based access control
- Secure password hashing (Spring Security crypto)
- Protected admin endpoints (ADMIN role required)

### API Security

- CORS configuration for allowed origins
- Input validation using JSR-303 annotations
- Parameterized database queries (SQL injection prevention)
- Comprehensive exception handling with security context

### CI/CD Security

- CodeQL (SAST) for code vulnerability scanning
- Trivy & OWASP Dependency-Check for dependency vulnerabilities
- Gitleaks for secret detection
- Container image scanning before registry push
- npm/Bun audit for frontend dependencies

### Data Protection

- PostgreSQL with encrypted connections
- Connection pooling via HikariCP
- Prepared statements for all queries
- Secure environment variable management

---

## 📈 Performance Optimizations

### Caching

- Spring Cache abstraction with configurable backends
- Scheduled refresh of reference data (countries, products)
- ML model serialization and caching
- Reduced API calls to external services

### Database

- HikariCP connection pooling (20 connections)
- Query optimization with proper indexing
- Batch insert/update operations
- Connection timeout: 30 seconds

### Frontend

- Next.js Turbopack for 5-10x faster builds
- Bun for 25x faster package installation
- Lazy component loading
- Image optimization and responsive sizing

### ML System

- Model serialization for quick inference
- Incremental model updates (no full retraining)
- Confidence-based result caching

---

## 🔄 CI/CD Pipeline

Every push to main triggers:

1. **Continuous Integration**

   - Backend: Maven build, JUnit tests, JaCoCo coverage
   - Frontend: Bun dependencies, ESLint, TypeScript check, build
   - Security: CodeQL, Trivy, Gitleaks

2. **Container Build**

   - Multi-stage Docker build for minimal image size
   - Push to GitHub Container Registry (GHCR)

3. **Deployment** (main branch only)
   - Backend: SSH into EC2, git pull, Maven rebuild, systemd restart
   - Frontend: Trigger Amplify deployment
   - Zero-downtime using service restart strategy

See [CI_CD_SETUP.md](CI_CD_SETUP.md) for complete CI/CD documentation.

---

## 📚 Documentation

- **[TARIFF_PREDICTION_SYSTEM.md](TARIFF_PREDICTION_SYSTEM.md)** - Complete ML prediction system guide with formulas and examples
- **[CI_CD_SETUP.md](CI_CD_SETUP.md)** - GitHub Actions workflow configuration and deployment instructions
- **[API Documentation](http://localhost:8080/swagger-ui.html)** - Interactive Swagger UI (local only)
- **Inline Documentation** - Comprehensive JavaDoc in all services and controllers

---

## 🎓 Database Schema

### Key Tables

| Table         | Purpose                              |
| ------------- | ------------------------------------ |
| `user_info`   | User accounts, authentication, roles |
| `country`     | Country codes and metadata           |
| `product`     | HS6 tariff product codes             |
| `transaction` | Import/export transactions           |
| `measure`     | Tariff rates and duties              |
| `preference`  | Preferential trade agreement rates   |
| `suspension`  | Duty suspensions                     |

### Entity Relationships

```
User (1) ──→ (∞) Transaction
Country (1) ──→ (∞) Transaction
Product (1) ──→ (∞) Transaction
Country (1) ──→ (∞) Measure ←─ (1) Product
Country (1) ──→ (∞) Preference ←─ (1) Country
Measure (1) ──→ (∞) Suspension
```

---

## 🛠️ Development Guide

### Running the Backend in Development

```bash
cd tariff
mvn spring-boot:run
# Runs with live reload (via Spring Dev Tools)
```

### Running Frontend in Development

```bash
cd frontend
bun install
bun run dev
# Runs with hot module replacement (HMR)
```

### Adding a New API Endpoint

1. Create `@RestController` in `controller/` package
2. Implement endpoint method with `@GetMapping`, `@PostMapping`, etc.
3. Add `@RequestBody` DTOs in `model/` package
4. Write service logic in `service/` package
5. Add JUnit test in `src/test/` with same package structure

### Adding a New Service

1. Create class in `service/` extending `@Service`
2. Inject dependencies via constructor injection
3. Add `@Transactional` for database operations
4. Write unit tests with `@SpringBootTest` or mocks

### Adding a New Database Entity

1. Create JPA entity in `model/` with `@Entity` and `@Table`
2. Create `@Repository` interface extending `JpaRepository`
3. Update Prisma schema for frontend (`frontend/prisma/schema.prisma`)
4. Run `prisma migrate dev --name description`

---

## 🐛 Troubleshooting

### Backend won't start

- Check PostgreSQL is running: `psql -U postgres`
- Verify `JWT_SECRET` is set (32-byte hex string)
- Check logs: `tail -f ~/.logs/tariff-app.log`

### Frontend can't connect to backend

- Verify backend is running: `curl http://localhost:8080/api/countries`
- Check `NEXT_PUBLIC_API_URL` in `frontend/.env`
- Clear browser cache and cookies

### ML models failing

- Ensure at least 3 historical records exist for training
- Check model files in `tariff/models/` directory
- Verify feature engineering service isn't throwing errors

### Database connection issues

- Check Supabase connection string format
- Verify PostgreSQL user has database creation privileges
- Check firewall rules allow connection from your IP

### Tests failing in CI

- Run tests locally first: `mvn test`
- Check GitHub Actions logs for detailed error messages
- Ensure all environment variables are set in GitHub Secrets

---

## 📞 Support

For issues or questions:

1. Check existing [GitHub Issues](https://github.com/vindyanggiono/verbose-garbonzo-tariff/issues)
2. Review [CI_CD_SETUP.md](CI_CD_SETUP.md) for deployment troubleshooting
3. Check [TARIFF_PREDICTION_SYSTEM.md](TARIFF_PREDICTION_SYSTEM.md) for ML questions
4. Create a new issue with:
   - Clear problem description
   - Steps to reproduce
   - Error logs/screenshots
   - Environment details (OS, Java version, Node version)

---

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

All pull requests must pass:

- CI tests (Maven build, Bun build)
- Security scans (CodeQL, Trivy)
- Code style (ESLint, Checkstyle)

---

## 👨‍💻 Key Technologies at a Glance

| Layer                   | Technology                    | Version |
| ----------------------- | ----------------------------- | ------- |
| **Backend**             | Spring Boot                   | 3.5.6   |
| **Language (Backend)**  | Java                          | 21      |
| **Frontend**            | Next.js                       | 15.5.3  |
| **Language (Frontend)** | TypeScript                    | 5       |
| **Database**            | PostgreSQL                    | 14+     |
| **Styling**             | Tailwind CSS                  | 4       |
| **ML Library**          | Tribuo                        | 4.3.2   |
| **Authentication**      | JWT                           | -       |
| **Container**           | Docker                        | Latest  |
| **Deployment**          | AWS (EC2, Amplify) + Supabase | -       |

---

**Built with ❤️ for global trade**
