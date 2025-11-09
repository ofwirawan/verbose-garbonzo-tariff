# AI Recommendation Feature - Deployment & Testing Checklist

## 🔧 Pre-Deployment Setup

### Backend Compilation
- [ ] Clone/pull latest code
- [ ] Run `mvn clean compile` - verify no errors
- [ ] Ensure Java 17+ is installed
- [ ] Check pom.xml has Tribuo dependencies (v4.3.2)
- [ ] Verify Spring Boot version compatibility

### Database Migration
- [ ] Run any pending Flyway/Liquibase migrations
- [ ] Verify `user_info.profile_type` column exists
- [ ] Column type: VARCHAR(50), Enumerated(STRING)
- [ ] Add sample profile types to test users (optional)
- [ ] Backup database before migration

### Frontend Build
- [ ] Ensure Node.js/Bun is available
- [ ] Run `npm install` or `bun install`
- [ ] Run `npm run build` or `bun run build`
- [ ] Verify no TypeScript compilation errors
- [ ] Check bundle size is acceptable

### Configuration
- [ ] Set `NEXT_PUBLIC_API_URL` environment variable
- [ ] Configure Spring Cache (default: simple/local)
- [ ] Set Tribuo model path if using custom models
- [ ] Configure JWT secret for authentication
- [ ] Set log levels (SLF4J) appropriately

## 🧪 Functional Testing

### Backend Unit Tests

#### AIRecommendationService
- [ ] Test `getTimingRecommendation()` with valid parameters
- [ ] Test period identification logic
- [ ] Test savings calculation
- [ ] Test profile-specific explanation generation
- [ ] Test error handling with missing data
- [ ] Test caching functionality

#### TariffMLService
- [ ] Test `predictTariffRate()` for single date
- [ ] Test `predictRateRange()` for date range
- [ ] Test fallback forecast with no historical data
- [ ] Test confidence adjustment for future dates
- [ ] Test weekly aggregation logic

#### FeatureEngineeringService
- [ ] Test feature extraction
- [ ] Test volatility calculation
- [ ] Test trend direction calculation
- [ ] Test FTA years calculation
- [ ] Test with minimal historical data

#### Repositories
- [ ] Test `findHistoricalRates()` returns correct records
- [ ] Test date range filtering
- [ ] Test null handling
- [ ] Verify indices on tariff history queries

### API Endpoint Tests

#### Authentication
- [ ] Test without JWT token → 401 response
- [ ] Test with invalid JWT → 401 response
- [ ] Test with valid JWT → 200 response
- [ ] Test token expiration handling

#### Request Validation
- [ ] Test with missing importerCode → 400 response
- [ ] Test with missing hs6Code → 400 response
- [ ] Test with invalid country code → appropriate error
- [ ] Test with null body → 400 response
- [ ] Test with malformed JSON → 400 response

#### Business Logic
- [ ] Test with importer that has data → recommendations returned
- [ ] Test with importer without data → empty response or error
- [ ] Test with different exporter codes → different recommendations
- [ ] Test with different profile types → different explanations
- [ ] Test response structure matches schema

#### Edge Cases
- [ ] Test with very recent transaction date → proper confidence
- [ ] Test with future date (2026+) → predictions used
- [ ] Test with very old date (1990s) → historical data used
- [ ] Test with no suspensions → handles null
- [ ] Test with multiple overlapping suspensions

### Frontend Component Tests

#### AIInsightsTab
- [ ] Initial empty state displays correctly
- [ ] "Generate Recommendations" button visible
- [ ] Loading state shows spinner
- [ ] Success state shows all sections
- [ ] Error state shows error message
- [ ] Regenerate button works
- [ ] All sections render without errors

#### TimingRecommendationCard
- [ ] Optimal period has correct styling (green)
- [ ] Avoid period has correct styling (red)
- [ ] Date formatting is DD/MM/YYYY
- [ ] Rank number displays correctly
- [ ] Savings/cost calculations correct
- [ ] Confidence indicator renders
- [ ] Status badges (Past, Upcoming) appear correctly
- [ ] Days until period calculated correctly

#### ConfidenceIndicator
- [ ] Green bar for 80%+
- [ ] Blue bar for 60-79%
- [ ] Yellow bar for 40-59%
- [ ] Red bar for <40%
- [ ] Progress bar width matches percentage
- [ ] Label and percentage display correctly
- [ ] Tooltip appears on hover
- [ ] All size variants (sm, md, lg) work

### Integration Tests

#### End-to-End Flow
- [ ] User logs in
- [ ] User navigates to TariffChart
- [ ] User enters parameters and calculates
- [ ] Results display
- [ ] AI Insights tab visible
- [ ] User clicks AI Insights tab
- [ ] User clicks Generate Recommendations
- [ ] API call succeeds with JWT auth
- [ ] Recommendations display properly
- [ ] User can regenerate

#### Data Consistency
- [ ] Savings calculation matches displayed percentage
- [ ] Current rate matches tariff calculation
- [ ] Confidence scores reasonable (40-100%)
- [ ] Period dates are valid
- [ ] Start date < End date
- [ ] All fields populated in response

#### Performance
- [ ] First request takes <1s (cold start)
- [ ] Subsequent requests for same data <500ms (cached)
- [ ] No memory leaks with repeated calls
- [ ] Frontend renders without lag
- [ ] No N+1 query problems

## 📊 Data Validation

### Sample Test Data
- [ ] Prepare test cases with different HS6 codes
- [ ] Prepare test cases with different country combinations
- [ ] Prepare test cases with <1 year history (expect low confidence)
- [ ] Prepare test cases with >5 years history (expect high confidence)
- [ ] Include products with suspensions
- [ ] Include products with FTA preferences

### Date Format Testing
- [ ] Verify dates display as DD/MM/YYYY everywhere
- [ ] Test with dates in far past (1990s)
- [ ] Test with dates in future (2025+)
- [ ] Test leap year dates (Feb 29)
- [ ] Test year boundary dates

## 🔒 Security Testing

### Authentication
- [ ] JWT validation works
- [ ] Expired tokens rejected
- [ ] Invalid signatures rejected
- [ ] Tokens in wrong format rejected

### Authorization
- [ ] User can only see own profile type
- [ ] AdminUser (if exists) can see all profile types
- [ ] No data leakage between users

### Input Validation
- [ ] SQL injection attempts rejected
- [ ] XSS attempts sanitized
- [ ] Large payload handling (DoS protection)
- [ ] Invalid characters in parameters handled

### API Security
- [ ] No sensitive data in logs
- [ ] No stack traces exposed to clients
- [ ] Error messages don't leak system info
- [ ] CORS properly configured
- [ ] Rate limiting in place (optional)

## 📈 Performance Testing

### Load Testing
- [ ] API handles 10 concurrent requests
- [ ] API handles 100 concurrent requests
- [ ] Response times stable under load
- [ ] No memory leaks
- [ ] Cache hit ratio >70% after warm-up

### Database Performance
- [ ] Historical rate query <100ms
- [ ] Feature extraction <200ms
- [ ] Complete recommendation <500ms
- [ ] Indices properly used (check query plans)

### Frontend Performance
- [ ] Page renders with <1s TTI
- [ ] Recommendations display without lag
- [ ] Card transitions smooth
- [ ] No unnecessary re-renders

## 📝 Documentation Testing

- [ ] README.md is clear and complete
- [ ] API documentation is accurate
- [ ] Code comments are clear
- [ ] JavaDoc comments present in Java
- [ ] TypeDoc comments present in TypeScript
- [ ] Architecture diagram makes sense
- [ ] Examples work as written

## 🚀 Deployment Verification

### Pre-Production
- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] No outstanding TODOs in code
- [ ] Dependencies up to date
- [ ] Security scan passed

### Staging Environment
- [ ] Backend builds and runs
- [ ] Frontend builds and runs
- [ ] API endpoint accessible
- [ ] Authentication works
- [ ] Sample recommendations generated
- [ ] All UI components render
- [ ] No console errors
- [ ] No browser warnings

### Production Deployment
- [ ] Database migration successful
- [ ] Application starts without errors
- [ ] Health check endpoint returns 200
- [ ] API is accessible
- [ ] Logging is working
- [ ] Monitoring alerts configured
- [ ] Rollback plan prepared

## ✅ Post-Deployment Verification

### Smoke Tests
- [ ] API returns 200 for valid requests
- [ ] Authentication works
- [ ] Recommendations are generated
- [ ] No 500 errors in logs
- [ ] Performance metrics acceptable

### Monitoring
- [ ] API response times logged
- [ ] Error rates monitored
- [ ] Cache hit rates tracked
- [ ] User adoption tracked
- [ ] Feedback collected

## 🐛 Known Issues to Watch

- [ ] Tribuo model loading on first request (warm-up time)
- [ ] Large historical datasets may slow feature engineering
- [ ] Caching invalidation strategy (ensure appropriate TTL)
- [ ] Database connection pool tuning for concurrent requests
- [ ] Frontend date parsing across timezones

## 📋 Rollback Plan

If issues occur:
1. [ ] Revert database migrations if any
2. [ ] Revert code to previous version
3. [ ] Clear application cache
4. [ ] Restart application
5. [ ] Verify health check
6. [ ] Monitor error logs
7. [ ] Notify users if downtime occurred

## 📞 Support & Escalation

### Development Issues
- [ ] Check AI_IMPLEMENTATION_SUMMARY.md
- [ ] Check AI_QUICK_REFERENCE.md
- [ ] Review server logs
- [ ] Check database connectivity

### Production Issues
- [ ] Assess impact scope
- [ ] Activate incident response
- [ ] Check monitoring dashboards
- [ ] Review recent changes
- [ ] Consider rollback

## ✨ Success Criteria

All of the following must be true:
- [ ] All tests passing
- [ ] No compilation errors
- [ ] No security vulnerabilities
- [ ] Performance acceptable (<1s first request, <500ms cached)
- [ ] API endpoint functional
- [ ] Frontend integrated and working
- [ ] Documentation complete
- [ ] Team trained on feature
- [ ] Monitoring in place
- [ ] Rollback plan prepared

---

**Template Version**: 1.0
**Last Updated**: November 9, 2025
**Status**: Ready for Use
**Owner**: Development Team
