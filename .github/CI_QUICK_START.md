# CI Pipeline Quick Start

You already have three workflows set up. Here's what to do next to enable them:

## What's Already Created

✅ **CI Pipeline** (`.github/workflows/ci.yml`)
- Runs on: Push to `main`, `develop`, `feature/**` branches and PRs
- Tests backend with Maven (JUnit + REST Assured)
- Builds frontend with Bun (Next.js + TypeScript)
- Generates code coverage reports
- No secrets required to run

✅ **Security Scanning** (`.github/workflows/security.yml`)
- CodeQL analysis (SAST)
- Trivy vulnerability scanning
- Secret detection (Gitleaks)
- Dependency checks (npm audit, OWASP)
- Most features run without secrets (CodeQL is free for public repos)

✅ **Docker Build** (`.github/workflows/docker-build-push.yml`)
- Already exists - pushes to GitHub Container Registry

## Next Steps for CI Only

### 1. Test the CI Pipeline (No Setup Required!)

Just push a commit to trigger it:

```bash
git add .
git commit -m "Enable CI pipeline"
git push origin main
```

Then check progress:
- Go to **Actions** tab in your GitHub repo
- You should see workflows running automatically

### 2. Optional: Add Codecov for Coverage Reports

If you want coverage badges and reports:

1. Go to https://codecov.io
2. Sign in with GitHub
3. Select your repository
4. Copy the token
5. Add as GitHub secret: **Settings → Secrets → `CODECOV_TOKEN`**

The CI will then automatically upload coverage reports.

### 3. Optional: Enable Branch Protection

Require tests to pass before merging:

1. **Settings → Branches → Add rule**
2. Branch name: `main`
3. Check: "Require status checks to pass before merging"
4. Select: `backend-ci` and `frontend-ci`
5. Save

### 4. Monitor CI Runs

```bash
# View workflow history
gh run list

# View detailed logs
gh run view <RUN_ID> --log

# Watch live (in real-time)
gh run watch
```

## Workflow Details

### CI Pipeline (`ci.yml`)

**Backend Tests:**
```
JDK 21 Setup → Maven Clean → Run Tests → Build JAR → Code Coverage
```

**Frontend Build:**
```
Bun Setup → Install Dependencies → ESLint → Next.js Build → TypeScript Check
```

**What it checks:**
- ✅ Backend compiles successfully
- ✅ All JUnit tests pass
- ✅ Frontend builds without errors
- ✅ TypeScript has no type errors
- ✅ ESLint passes (with warnings allowed)
- ✅ Code coverage generated

### Security Scanning (`security.yml`)

**Runs automatically:**
- On every push to `main`/`develop`
- On pull requests
- Daily at 2 AM UTC

**What it checks:**
- ✅ Static code analysis (CodeQL)
- ✅ Known vulnerabilities in dependencies (Trivy)
- ✅ Hardcoded secrets (Gitleaks)
- ✅ Java dependencies (OWASP)
- ✅ JavaScript dependencies (npm audit)

### Docker Build (`docker-build-push.yml`)

**Already configured to:**
- Build on push to `main` and `feature/**`
- Skip push on pull requests
- Tag images with branch name, semver, and commit SHA
- Push to `ghcr.io` (GitHub Container Registry)

## Common Configurations

### Modify CI to Run Tests Only (No Build)

Edit `.github/workflows/ci.yml`:

```yaml
- name: Build backend
  run: mvn -f tariff/pom.xml test  # Removes: -DskipTests from test step
```

### Run CI on Different Branches

Edit triggers in `ci.yml`:

```yaml
on:
  push:
    branches:
      - main
      - develop
      - staging  # Add more branches
  pull_request:
    branches:
      - main
      - develop
```

### Skip CI for Certain Commits

In your commit message:

```bash
git commit -m "docs: update README [skip ci]"
```

Or:

```bash
git commit -m "chore: update dependencies [ci skip]"
```

### Run Security Scans on Different Schedule

Edit `security.yml` cron:

```yaml
schedule:
  - cron: '0 0 * * *'   # Daily at midnight UTC
  - cron: '0 2 * * 0'   # Weekly on Sunday at 2 AM
```

## Troubleshooting CI Failures

### Backend Tests Fail

Check the output in Actions tab:
1. Look for test name that failed
2. Run test locally: `cd tariff && mvn test`
3. Fix the issue
4. Commit and push again

### Frontend Build Fails

Check the output in Actions tab:
1. Check for TypeScript errors: `cd frontend && bunx tsc --noEmit`
2. Check ESLint: `cd frontend && bun run lint`
3. Build locally: `cd frontend && bun run build`
4. Fix issues and retry

### Workflow Not Running

- Verify branch is `main`, `develop`, or `feature/**`
- Check `.github/workflows/ci.yml` exists
- Check file isn't commented out
- Push a new commit (workflows don't run on old commits)

### Coverage Not Uploading

- Don't worry if Codecov fails (marked as `continue-on-error: true`)
- It's optional and requires `CODECOV_TOKEN` secret
- Tests still run and report to GitHub Actions

## View Workflow Details

### See Test Results

1. Go to **Actions** tab
2. Click workflow run name
3. Click job name (e.g., `Backend - Build & Test`)
4. Expand step to see detailed logs

### Download Test Reports

After a run completes:
1. Click the workflow run
2. Scroll down to **Artifacts**
3. Download `.zip` files with test results

### View Code Coverage

If you configured Codecov:
- Coverage badge in README
- Historical coverage trends
- File-by-file coverage breakdown

## Next: Go to Production?

When ready to enable deployments:
- See `deploy.yml` for AWS EC2 + Amplify setup
- Requires AWS credentials as GitHub secrets
- CI must pass before deployment runs

For now, focus on:
1. ✅ Running CI locally to catch issues early
2. ✅ Getting tests passing in the pipeline
3. ✅ Setting up branch protection rules
4. ✅ Monitoring coverage trends

That's it! Your CI pipeline is ready to use. 🚀
