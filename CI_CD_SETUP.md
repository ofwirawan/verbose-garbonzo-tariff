# CI/CD Pipeline Setup Guide

This document describes the CI/CD pipelines for the verbose-garbonzo-tariff project.

## Overview

The project uses **GitHub Actions** to automate:
- **Continuous Integration (CI)**: Testing, linting, and building on every push/PR
- **Security Scanning**: Vulnerability detection, dependency checking, secret detection
- **Continuous Deployment (CD)**: Automated deployments to AWS EC2 (backend) and AWS Amplify (frontend)

## Workflows

### 1. CI Pipeline (`.github/workflows/ci.yml`)

Runs on:
- Push to `main`, `develop`, or `feature/**` branches
- Pull requests to `main` and `develop`

#### Jobs:

**Backend CI (`backend-ci`)**
- Sets up JDK 21
- Runs Maven clean and tests
- Builds JAR package
- Generates JaCoCo code coverage reports
- Uploads coverage to Codecov
- Generates test reports

**Frontend CI (`frontend-ci`)**
- Sets up Bun package manager
- Installs dependencies
- Runs ESLint linting
- Builds Next.js application
- Type-checks with TypeScript

**Security (`security`)**
- Runs Trivy vulnerability scanner on filesystem
- Scans for known vulnerabilities in dependencies

**CI Summary (`ci-summary`)**
- Reports overall CI status
- Fails if backend or frontend builds fail

### 2. Deployment Pipeline (`.github/workflows/deploy.yml`)

Runs only on:
- Push to `main` branch when backend or frontend files change
- Manual workflow dispatch

#### Jobs:

**Deploy Backend to AWS EC2 (`deploy-backend`)**
- SSH into EC2 instance
- Pulls latest code from main branch
- Builds JAR with Maven
- Restarts the tariff-app service

**Deploy Frontend to AWS Amplify (`deploy-frontend`)**
- Triggers Amplify deployment hook
- Frontend builds and deploys automatically

**Docker Build and Push (`docker-build`)**
- Builds Docker image from Dockerfile
- Pushes to GitHub Container Registry (ghcr.io)
- Creates tags for main branch, semantic versions, and commit SHA

### 3. Security Scanning Pipeline (`.github/workflows/security.yml`)

Runs on:
- Push to `main` and `develop` branches
- Pull requests to `main` and `develop`
- Scheduled daily at 2 AM UTC

#### Jobs:

**CodeQL Analysis (`codeql`)**
- SAST (Static Application Security Testing)
- Analyzes Java and JavaScript code
- Detects security vulnerabilities and code quality issues

**Dependency Vulnerability Check (`dependency-check`)**
- Uses Trivy to scan for known vulnerabilities
- Checks all dependencies and lock files
- Reports CRITICAL and HIGH severity issues

**Secret Detection (`secret-detection`)**
- Uses Gitleaks to detect hardcoded secrets
- Scans entire git history
- Prevents accidental credential commits

**Backend Dependency Check (`backend-deps`)**
- Runs OWASP Dependency Check Maven plugin
- Identifies vulnerable dependencies in Java projects

**Frontend Dependency Check (`frontend-deps`)**
- Runs npm/Bun audit
- Identifies vulnerable JavaScript dependencies

**SonarQube Code Quality (`sonarqube`)**
- Analyzes code for bugs, code smells, and vulnerabilities
- Generates code coverage metrics
- Requires SonarQube server and credentials

**Container Scanning (`container-scan`)**
- Builds Docker image locally
- Scans image with Trivy for vulnerabilities
- Prevents vulnerable images from being used

## Required GitHub Secrets

Add the following secrets in your GitHub repository settings (Settings → Secrets and variables → Actions):

### AWS Deployment Secrets

```
AWS_ACCESS_KEY_ID              # AWS IAM user access key
AWS_SECRET_ACCESS_KEY          # AWS IAM user secret key
AWS_REGION                     # AWS region (e.g., us-east-1)

EC2_HOST                       # EC2 instance public IP or hostname
EC2_USER                       # EC2 instance user (e.g., ec2-user, ubuntu)
EC2_SSH_KEY                    # Private SSH key for EC2 access
EC2_PORT                       # SSH port (default: 22)

AMPLIFY_APP_ID                 # AWS Amplify application ID
```

### Code Quality & Security Secrets

```
CODECOV_TOKEN                  # Codecov API token for coverage uploads
SNYK_TOKEN                     # Snyk API token for dependency scanning (optional)
SONARQUBE_HOST                 # SonarQube server URL (optional)
SONARQUBE_TOKEN                # SonarQube authentication token (optional)
```

## How to Set GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Enter the secret name and value
5. Click **Add secret**

## Setting Up Backend Deployment (AWS EC2)

### Prerequisites

1. EC2 instance running with Java 21 and Maven installed
2. The repository cloned on the EC2 instance
3. Systemd service configured for the application

### EC2 Setup Steps

```bash
# SSH into your EC2 instance
ssh -i your-key.pem ec2-user@your-ec2-ip

# Clone the repository
git clone https://github.com/your-username/verbose-garbonzo-tariff.git /home/ec2-user/tariff-app
cd /home/ec2-user/tariff-app

# Create systemd service file
sudo nano /etc/systemd/system/tariff-app.service
```

### Systemd Service File Example

```ini
[Unit]
Description=Tariff Application
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user/tariff-app
ExecStart=/usr/bin/java -jar /home/ec2-user/tariff-app/tariff/target/tariff-0.0.1-SNAPSHOT.jar
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start the service
sudo systemctl enable tariff-app
sudo systemctl start tariff-app
```

### EC2 SSH Key Setup

1. Generate or obtain your EC2 SSH key (`.pem` file)
2. Add it as a GitHub secret named `EC2_SSH_KEY`

```bash
# Display key content (copy entire output)
cat /path/to/your-key.pem
```

3. Paste the entire key content into the GitHub secret

## Setting Up Frontend Deployment (AWS Amplify)

### Prerequisites

1. AWS Amplify application created and connected to your GitHub repository
2. Amplify App ID available

### Amplify Setup Steps

1. Go to AWS Amplify Console
2. Select your application
3. Note the **App ID** from the application settings
4. Add `AMPLIFY_APP_ID` as a GitHub secret

## Running Workflows Locally (for testing)

### Using `act` (GitHub Actions emulator)

```bash
# Install act
brew install act  # macOS
# or https://github.com/nektos/act

# Run CI workflow locally
act push -j backend-ci
act push -j frontend-ci

# List available workflows
act -l
```

## Monitoring Workflows

1. Go to your GitHub repository
2. Click **Actions** tab
3. View real-time logs for running workflows
4. Click on a workflow to see detailed results

## Troubleshooting

### Backend Build Fails

```bash
# Check Maven output in GitHub Actions logs
# Common issues:
# - Java version mismatch: Ensure JDK 21 is available
# - Dependency issues: Run `mvn clean install` locally
# - Test failures: Check test reports in GitHub Actions
```

### Frontend Build Fails

```bash
# Check Bun/Node output in GitHub Actions logs
# Common issues:
# - Dependency resolution: Run `bun install` locally
# - TypeScript errors: Check tsconfig.json
# - ESLint failures: Run `bun run lint` locally
```

### Deployment Fails

```bash
# Check SSH connection
ssh -i path-to-key ec2-user@your-ec2-ip -p 22

# Verify systemd service status
sudo systemctl status tariff-app

# Check service logs
sudo journalctl -u tariff-app -f
```

### Secret Not Found in Workflow

1. Verify secret name matches exactly (case-sensitive)
2. Ensure secret is added to the correct repository (not organization)
3. Secrets cannot be accessed in pull_request events from forks

## Best Practices

### 1. Branch Protection Rules

Recommended settings for `main` branch:
- ✅ Require status checks to pass before merging
- ✅ Require code reviews before merging
- ✅ Dismiss stale pull request approvals when new commits are pushed
- ✅ Require branches to be up to date before merging

To set up:
1. Settings → Branches → Add rule
2. Branch name pattern: `main`
3. Enable recommended options

### 2. Environment-Specific Configuration

Use different secrets for staging and production:

```yaml
deploy:
  environment: production
  environment-url: ${{ secrets.PRODUCTION_URL }}
```

### 3. Artifact Retention

Configure artifact retention to reduce storage:

```yaml
- name: Upload Test Results
  uses: actions/upload-artifact@v4
  with:
    name: test-results
    path: tariff/target/surefire-reports/
    retention-days: 30
```

### 4. Workflow Concurrency

Prevent multiple deployments running simultaneously:

```yaml
concurrency:
  group: deployment
  cancel-in-progress: false
```

## Maintaining CI/CD Pipelines

### Regular Updates

- Review GitHub Actions security advisories monthly
- Update action versions quarterly
- Monitor dependency vulnerabilities in workflows
- Test workflow changes in a branch before merging

### Cost Optimization

- Limit concurrent jobs: 5 concurrent jobs (GitHub default)
- Use `cache` for dependency resolution
- Clean up old artifacts and workflow logs
- Consider self-hosted runners for large-scale builds

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Actions Best Practices](https://docs.github.com/en/actions/guides)
- [Spring Boot Testing](https://spring.io/guides/gs/testing-web/)
- [Next.js CI/CD](https://nextjs.org/docs/deployment)
- [AWS CodePipeline Integration](https://docs.aws.amazon.com/codepipeline/)

## Support

For issues or questions about the CI/CD pipeline:
1. Check GitHub Actions logs in the repository
2. Review workflow files in `.github/workflows/`
3. Test changes locally with `act`
4. Open an issue in the repository with CI/CD tags
