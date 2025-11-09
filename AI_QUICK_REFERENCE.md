# AI Recommendation Feature - Quick Reference

## 🎯 Feature Overview
AI-powered tariff timing recommendations that suggest optimal import/export periods based on historical tariff data analysis. Fully personalized based on user profile type (Business Owner, Policy Analyst, or Student).

## 🏗️ How It Works

### User Flow
1. User enters tariff calculation parameters
2. User clicks "Calculate Tariff"
3. Results display with three tabs: Result, Comparison, **AI Insights** (NEW)
4. User clicks "AI Insights" tab
5. User clicks "Generate Recommendations"
6. AI analyzes data and shows:
   - Current tariff rate
   - Maximum potential savings
   - Average confidence level
   - Optimal periods to import/export
   - Periods to avoid
   - Personalized explanation

### Data Analysis
- Analyzes 365-day forecast window
- Looks at 5-year historical data
- Identifies 3 optimal periods (lowest rates)
- Identifies 2 periods to avoid (highest rates)
- Calculates savings based on $10k trade value estimate
- Provides confidence scores (40-100%)

## 📁 Key Files

### Backend
```
tariff/src/main/java/com/verbosegarbonzo/tariff/
├── controller/
│   └── AIController.java              # REST endpoint
├── service/
│   ├── AIRecommendationService.java   # Main logic
│   ├── TariffMLService.java           # ML/forecasting
│   └── FeatureEngineeringService.java # Feature extraction
└── model/
    ├── ProfileType.java               # User profile types
    ├── TariffFeatures.java            # ML feature vector
    ├── ForecastResult.java            # Single prediction
    ├── DateRangeForecast.java         # Range prediction
    ├── AIRecommendationRequest.java   # API input
    ├── AIRecommendationResponse.java  # API output
    ├── OptimalPeriod.java             # Best period data
    └── AvoidPeriod.java               # High-rate period data
```

### Frontend
```
frontend/app/dashboard/components/
├── TariffChart.tsx                    # Main integration
├── AIInsightsTab.tsx                  # Recommendation container
├── TimingRecommendationCard.tsx       # Period display
├── ConfidenceIndicator.tsx            # Confidence UI
└── utils/
    ├── ai-service.ts                  # API service
    ├── types.ts                       # TypeScript types
    └── service.ts                     # Other services
```

## 🔌 API Endpoint

### POST /api/ai/recommendation
```javascript
// Request
{
  "importerCode": "USA",
  "exporterCode": "CHN",
  "hs6Code": "620342"
}

// Response
{
  "optimalPeriods": [
    {
      "startDate": "2025-04-01",
      "endDate": "2025-06-30",
      "avgRate": 8.5,
      "currentRate": 10.2,
      "savingsPercent": 16.67,
      "estimatedSavingsAmount": 1666.67,
      "confidence": 85,
      "reason": "FTA renewal period typically shows lower rates"
    }
  ],
  "avoidPeriods": [...],
  "explanation": "...",
  "currentRate": 10.2,
  "potentialSavings": 1666.67,
  "potentialSavingsPercent": 16.67,
  "averageConfidence": 82,
  "modelVersion": "1.0.0",
  "hasInsufficientData": false
}
```

## 🎨 UI Components

### ConfidenceIndicator
- Shows confidence level with progress bar
- Color-coded: Green (80+), Blue (60-79), Yellow (40-59), Red (<40)
- Sizes: sm, md, lg
- Optional label and percentage display

### TimingRecommendationCard
- Displays period recommendation (optimal or avoid)
- Shows date range (DD/MM/YYYY format)
- Days until period countdown
- Rate information and comparisons
- Savings/cost amount in USD
- Confidence indicator
- Reason explanation
- Status badges (Past, Upcoming)

### AIInsightsTab
- Empty state with "Generate Recommendations" button
- Loading state with spinner
- Error state with retry button
- Success state showing:
  - Summary card (current rate, max savings, avg confidence)
  - Optimal periods section (up to 3 periods)
  - Avoid periods section (up to 2 periods)
  - Regenerate button

## 👥 User Profile Types

### BUSINESS_OWNER
Focused explanation on cost efficiency and transaction timing
```
"The optimal period is [date] to [date] with an estimated rate of X% (Y% savings).
Schedule your transactions during recommended periods to maximize cost efficiency."
```

### POLICY_ANALYST
Focused on economic analysis and policy implications
```
"Historical tariff analysis shows seasonal variations in rates. Q2 (April-June) typically
shows lower rates due to preferential trade agreement renewal cycles."
```

### STUDENT
Educational insights on tariff dynamics
```
"Educational insight: Tariff rates for this product vary throughout the year.
This variation depends on international trade agreements, policy changes, and market conditions."
```

## 🔐 Authentication
- Requires valid JWT token in Authorization header
- Returns 401 if not authenticated
- User profile type determines explanation format
- Defaults to BUSINESS_OWNER if profile not set

## 📊 Data Sources
- Historical tariff rates (from WITS data)
- Preference/FTA information
- Suspension data
- User transaction history
- All cached for performance

## ⚙️ Configuration

### Spring Cache
```properties
spring.cache.type=simple
# Cache key: importerCode-exporterCode-hs6Code-profileType
# TTL: Application default
```

### ML Model
```properties
app.ml.model.path=./models/tariff_forecast_v1.tribuo
app.ml.model.version=1.0.0
```

## 🧪 Testing Tips

### Backend
```bash
# Test endpoint
curl -X POST http://localhost:8080/api/ai/recommendation \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"importerCode":"USA","exporterCode":"CHN","hs6Code":"620342"}'
```

### Frontend
```typescript
// Import service
import { getAIRecommendation } from './utils/ai-service';

// Test call
const response = await getAIRecommendation({
  importerCode: 'USA',
  exporterCode: 'CHN',
  hs6Code: '620342'
});
```

## 🐛 Common Issues

### Issue: 401 Unauthorized
**Solution**: Ensure JWT token is valid and included in Authorization header

### Issue: Empty recommendations
**Solution**: Check if historical data exists for this importer/hs6 combination

### Issue: Low confidence scores
**Solution**: This indicates limited historical data; recommendations are still valid but less certain

### Issue: API returns 500
**Solution**: Check server logs for MeasureRepository or FeatureEngineeringService errors

## 📈 Performance Notes

- Forecasts computed on-demand, cached by (importer, exporter, hs6, profile)
- 365-day window aggregated to 52 weekly data points
- Typical response time: 200-500ms (after cache warming)
- Historical data lookback: 5 years

## 🔮 Future Enhancements

- [ ] Real Random Forest ML model instead of statistical forecasting
- [ ] Real-time tariff data updates
- [ ] Email alerts for upcoming optimal/avoid periods
- [ ] PDF/CSV export of recommendations
- [ ] Batch analysis for multiple products
- [ ] Custom rate change thresholds
- [ ] Accuracy tracking of past recommendations
- [ ] External economic indicator integration

## 📚 Related Documentation

- See [AI_IMPLEMENTATION_SUMMARY.md](./AI_IMPLEMENTATION_SUMMARY.md) for detailed architecture
- See individual class JavaDoc for implementation details
- See README.md for overall project setup

## 🎓 Key Concepts

### Optimal Period
Period when tariff rates are expected to be significantly lower than current rate.
- Ranked by savings potential
- Includes confidence score
- Explains reason for rate decrease

### Avoid Period
Period when tariff rates are expected to be significantly higher than current rate.
- Ranked by cost increase
- Includes confidence score
- Explains reason for rate increase

### Confidence Level
Indicates reliability of prediction based on:
- Amount of historical data available
- Forecast distance (nearer = higher confidence)
- Rate volatility in historical data
- Consistency of patterns

## 💡 Pro Tips

1. **Best Results**: Works best with products that have 3+ years of history
2. **Timing**: Plan transactions 3-6 months ahead using these recommendations
3. **Combine with Comparison**: Use alongside the Comparison Tool for country analysis
4. **Multiple Profile Views**: Try different profile types to see different explanations
5. **Threshold Planning**: Avoid periods with >20% cost increase when possible

---

**Last Updated**: November 9, 2025
**Status**: Production Ready
**Version**: 1.0.0
