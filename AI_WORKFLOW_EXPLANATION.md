# AI Recommendation Workflow - Step-by-Step Explanation

## 🎯 Complete User Interaction Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERACTION WORKFLOW                    │
└─────────────────────────────────────────────────────────────────────┘

STEP 1: User Opens Dashboard
┌──────────────────────────────────────────────────────────────────┐
│ FILES INVOLVED:                                                  │
│ • TariffChart.tsx (displays form)                               │
│ • SharedComponents.tsx (Combobox, inputs)                       │
│ • service.ts (data fetching hooks)                              │
└──────────────────────────────────────────────────────────────────┘
USER ACTION:
  → Navigates to tariff calculation page
  → Sees form with fields: Importing Country, Exporting Country,
    Product Code, Trade Value, Net Weight, Transaction Date, etc.

COMPONENT FLOW:
  1. TariffChart.tsx loads
  2. useTariffData() hook fetches countries and products
  3. Form renders with all input fields
  4. Two additional tabs visible: "Result" and "Comparison"
     (AI Insights tab only appears after calculation)


STEP 2: User Fills in Form & Calculates Tariff
┌──────────────────────────────────────────────────────────────────┐
│ FILES INVOLVED:                                                  │
│ • TariffChart.tsx (form state management)                       │
│ • service.ts (calculateTariff API call)                         │
│ • TariffController.java (backend endpoint)                      │
│ • TariffService.java (business logic)                           │
└──────────────────────────────────────────────────────────────────┘
USER ACTION:
  → Selects Importing Country: "USA"
  → Selects Exporting Country: "China"
  → Selects Product Code: "620342" (textile)
  → Enters Trade Value: "15000"
  → Enters Transaction Date: "2025-01-15"
  → Clicks "Calculate Tariff" button

COMPONENT FLOW:
  1. Form state updates in TariffChart.tsx
  2. handleCalculate() is triggered
  3. calculateTariff(request) called from service.ts
  4. HTTP POST to /api/calculate with:
     {
       importerCode: "USA",
       exporterCode: "CHN",
       hs6: "620342",
       tradeOriginal: 15000,
       transactionDate: "2025-01-15",
       ...
     }

BACKEND:
  1. TariffController.calculate() receives request
  2. TariffService.calculate() processes:
     - Fetches measure rates from database
     - Applies suspensions if applicable
     - Calculates duties and landed costs
  3. Returns CalculateResponse with:
     - Applied rates
     - Final trade amount
     - Warnings/notes
  4. Response sent back to frontend


STEP 3: Results Display & User Sees AI Insights Tab
┌──────────────────────────────────────────────────────────────────┐
│ FILES INVOLVED:                                                  │
│ • TariffChart.tsx (displays results + tabs)                     │
│ • ResultComponents.tsx (shows calculation details)              │
│ • ComparisonCountrySelector.tsx (comparison feature)            │
│ • AIInsightsTab.tsx (NEW - AI recommendations tab)              │
└──────────────────────────────────────────────────────────────────┘
USER SEES:
  → Tariff calculation results in "Result" tab
  → Three tabs now visible:
    1. "Result" - Current calculation
    2. "Comparison" - (for comparing countries)
    3. "AI Insights" - ⭐️ NEW AI RECOMMENDATIONS TAB

COMPONENT FLOW:
  1. TariffChart.tsx receives calculationResult
  2. activeTab state updated
  3. Conditional rendering shows:
     - CalculationResults component
     - Tabs with three triggers
  4. AIInsightsTab component is mounted when user clicks tab
     (but not loaded/executed yet - lazy rendering)


STEP 4: User Clicks "AI Insights" Tab
┌──────────────────────────────────────────────────────────────────┐
│ FILES INVOLVED:                                                  │
│ • TariffChart.tsx (tab management)                              │
│ • AIInsightsTab.tsx (container component)                       │
└──────────────────────────────────────────────────────────────────┘
USER ACTION:
  → Clicks on "AI Insights" tab

COMPONENT FLOW:
  1. TariffChart.tsx activeTab state changes to "ai-insights"
  2. Tabs component renders TabsContent for "ai-insights"
  3. AIInsightsTab component mounts with props:
     {
       importerCode: "USA",
       exporterCode: "CHN",
       hs6Code: "620342"
     }
  4. AIInsightsTab initializes with:
     - loadingState: "idle"
     - recommendation: null
     - error: null
  5. Renders EMPTY STATE:
     - Icon: Lightning bolt (Zap)
     - Title: "AI Timing Insights"
     - Description: "Get AI-powered recommendations..."
     - Button: "Generate Recommendations" (yellow button)


STEP 5: User Clicks "Generate Recommendations" Button
┌──────────────────────────────────────────────────────────────────┐
│ FILES INVOLVED:                                                  │
│ • AIInsightsTab.tsx (triggers API call)                         │
│ • ai-service.ts (API client)                                    │
│ • AIController.java (REST endpoint)                             │
│ • AIRecommendationService.java (business logic)                 │
│ • TariffMLService.java (ML predictions)                         │
│ • FeatureEngineeringService.java (feature extraction)           │
└──────────────────────────────────────────────────────────────────┘
USER ACTION:
  → Clicks "Generate Recommendations" button

COMPONENT FLOW (Frontend):
  1. AIInsightsTab.handleGenerateRecommendations() triggered
  2. loadingState changed to "loading"
  3. error cleared
  4. Creates AIRecommendationRequest:
     {
       importerCode: "USA",
       exporterCode: "CHN",
       hs6Code: "620342"
     }
  5. Calls getAIRecommendation(request) from ai-service.ts
  6. ai-service.ts makes HTTP POST:
     - URL: {API_BASE_URL}/api/ai/recommendation
     - Method: POST
     - Headers:
       { Authorization: "Bearer {JWT_TOKEN}",
         Content-Type: "application/json" }
     - Body: AIRecommendationRequest

COMPONENT STATE CHANGES:
  1. Page shows LOADING STATE:
     - Spinner animation
     - Text: "Analyzing historical data and generating recommendations..."


STEP 6: Backend Processes AI Recommendation Request
┌──────────────────────────────────────────────────────────────────┐
│ FILES INVOLVED:                                                  │
│ • AIController.java (receives request)                          │
│ • AIRecommendationService.java (orchestration)                  │
│ • TariffMLService.java (forecasting)                            │
│ • FeatureEngineeringService.java (features)                     │
│ • Repositories (query data)                                     │
└──────────────────────────────────────────────────────────────────┘

6.1 AIController.getRecommendation() executes:
    ✓ Validates authentication:
      - Checks if userInfo exists
      - Returns 401 if not authenticated
    ✓ Gets user's profile type from JWT
    ✓ Calls aiRecommendationService.getTimingRecommendation()

6.2 AIRecommendationService.getTimingRecommendation() executes:
    ✓ Checks cache for (importerCode, exporterCode, hs6Code, profileType)
    ✓ If cached, returns immediately
    ✓ If not cached, continues:

    Step A: Get current rate
    └─ Calls getCurrentRate(importerCode, hs6Code)
    └─ Queries MeasureRepository.findValidRate()
    └─ Returns: BigDecimal (e.g., 5.5%)

    Step B: Predict rates for next 365 days
    └─ Calls mlService.predictRateRange()
    └─ TariffMLService processes:

       For each week in 365 days:
       1. Call predictTariffRate() for each day
       2. TariffMLService.predictTariffRate():
          - Queries MeasureRepository for historical data
          - Calls FeatureEngineeringService.extractFeatures()
          - FeatureEngineeringService:
            * Queries historical measures (5 years)
            * Queries historical preferences (FTA data)
            * Queries historical suspensions
            * Calculates 20+ features:
              - Temporal: year, quarter, month, dayOfYear
              - Rate history: avg last 3/5 years, volatility, trend
              - Trade patterns: frequency, value
              - Policy: FTA status, suspensions
              - Geographic: country codes
          - Returns TariffFeatures object

       3. Creates ForecastResult with:
          - Predicted rate
          - Confidence score (40-100%)
          - Confidence interval

       4. Aggregates daily predictions to weekly:
          - Average rate for week
          - Min/max rates
          - Average confidence

       Returns: List<DateRangeForecast> (52 weekly forecasts)

    Step C: Identify optimal periods
    └─ Calls findOptimalPeriods(forecasts, currentRate)
    └─ Sorts forecasts by rate (ascending)
    └─ Takes top 3 periods with lowest rates
    └─ For each period calculates:
       - Savings percentage: (currentRate - forecastRate) / currentRate * 100
       - Estimated savings: savingsPercent * 10000 / 100
       - Reason: FTA renewal pattern, historical data, etc.
    └─ Returns: List<OptimalPeriod>

    Step D: Identify avoid periods
    └─ Calls findAvoidPeriods(forecasts, currentRate)
    └─ Sorts forecasts by rate (descending)
    └─ Takes top 2 periods with highest rates
    └─ For each period calculates:
       - Increase percentage: (forecastRate - currentRate) / currentRate * 100
       - Estimated cost: increasePercent * 10000 / 100
       - Reason: Policy adjustment, seasonal spike, etc.
    └─ Returns: List<AvoidPeriod>

    Step E: Calculate potential savings
    └─ Calls calculatePotentialSavings(optimalPeriods, currentRate)
    └─ Gets best (first) optimal period
    └─ Calculates: savingsPercent * 10000 / 100
    └─ Returns: BigDecimal (savings amount)

    Step F: Generate personalized explanation
    └─ Calls generateExplanation(optimalPeriods, avoidPeriods,
                                 userProfile, importerCode, hs6Code)
    └─ Checks user profile type:

       IF BUSINESS_OWNER:
         "Based on historical tariff data analysis, we've identified
          the best timing for your imports/exports. The optimal period
          is [DATE] to [DATE] with an estimated rate of X% (Y% savings).
          Schedule your transactions during recommended periods to
          maximize cost efficiency. Avoid [DATE] to [DATE] when rates
          are expected to increase to X%."

       IF POLICY_ANALYST:
         "Historical tariff analysis for HS6 code [CODE]: We observe
          seasonal variations in tariff rates. Q2 (April-June) typically
          shows lower rates due to preferential trade agreement renewal
          cycles. Current data shows rate volatility of ±2-3% throughout
          the year. These patterns can inform policy discussions on
          trade timing and economic impacts."

       IF STUDENT:
         "Educational insight: Tariff rates for this product vary
          throughout the year. This variation depends on international
          trade agreements, policy changes, and market conditions. By
          analyzing historical patterns, we can identify periods when
          rates are typically lower or higher. This demonstrates how
          macroeconomic factors affect import/export decisions."

    Step G: Build response
    └─ Returns AIRecommendationResponse:
       {
         optimalPeriods: [List of 3 OptimalPeriod objects],
         avoidPeriods: [List of 2 AvoidPeriod objects],
         explanation: "...",
         currentRate: 5.5,
         potentialSavings: 825.00,
         potentialSavingsPercent: 15.00,
         averageConfidence: 75,
         modelVersion: "1.0.0",
         hasInsufficientData: false
       }

    Step H: Cache result
    └─ Spring Cache stores result with key:
       "USA-CHN-620342-BUSINESS_OWNER"
    └─ Future identical requests return cached result


STEP 7: Frontend Receives Response & Displays Results
┌──────────────────────────────────────────────────────────────────┐
│ FILES INVOLVED:                                                  │
│ • ai-service.ts (receives response)                             │
│ • AIInsightsTab.tsx (displays response)                         │
│ • TimingRecommendationCard.tsx (period cards)                   │
│ • ConfidenceIndicator.tsx (confidence display)                  │
└──────────────────────────────────────────────────────────────────┘

7.1 Response received in AIInsightsTab:
    ✓ loadingState changed to "success"
    ✓ recommendation state updated with response
    ✓ Component re-renders

7.2 AIInsightsTab renders SUCCESS STATE:

    A. SUMMARY CARD displays:
    ┌─────────────────────────────────────────────┐
    │ Analysis Summary        v1.0.0              │
    │ "3 Optimal Periods"                         │
    ├─────────────────────────────────────────────┤
    │ Current Rate: 5.50%                         │
    │ Max Potential Savings: 15.00% ($1,500.00)   │
    │ Average Confidence: [75% - BLUE BAR]        │
    ├─────────────────────────────────────────────┤
    │ "[Profile-specific explanation text]"       │
    └─────────────────────────────────────────────┘

    B. OPTIMAL PERIODS SECTION:
    ┌─────────────────────────────────────────────┐
    │ 🎯 Best Times to Import/Export [3 periods]  │
    │                                             │
    │ ┌─────────────────────────────────────────┐ │
    │ │ Optimal Period #1                       │ │
    │ ├─────────────────────────────────────────┤ │
    │ │ Period: 15/04/2025 to 30/06/2025       │ │
    │ │ Days until: 127 days                     │ │
    │ ├─────────────────────────────────────────┤ │
    │ │ Current Rate: 5.50%                     │ │
    │ │ Expected Rate: 4.67%                    │ │
    │ ├─────────────────────────────────────────┤ │
    │ │ Potential Savings                       │ │
    │ │ 15.00% = $1,500.00                      │ │
    │ │ Confidence: [85% - GREEN BAR]           │ │
    │ ├─────────────────────────────────────────┤ │
    │ │ Why:                                     │ │
    │ │ "FTA renewal period typically shows     │ │
    │ │  lower rates"                           │ │
    │ └─────────────────────────────────────────┘ │
    │                                             │
    │ [Similar cards for Optimal Period #2, #3]   │
    └─────────────────────────────────────────────┘

    C. AVOID PERIODS SECTION:
    ┌─────────────────────────────────────────────┐
    │ ⚠️ Periods to Avoid [2 periods]              │
    │                                             │
    │ ┌─────────────────────────────────────────┐ │
    │ │ Period to Avoid #1                      │ │
    │ ├─────────────────────────────────────────┤ │
    │ │ Period: 01/01/2026 to 31/01/2026       │ │
    │ │ Status: Future [Upcoming]                │ │
    │ ├─────────────────────────────────────────┤ │
    │ │ Current Rate: 5.50%                     │ │
    │ │ Expected Rate: 6.27%                    │ │
    │ ├─────────────────────────────────────────┤ │
    │ │ Potential Additional Cost                │ │
    │ │ 14.00% = $1,400.00                      │ │
    │ │ Confidence: [70% - BLUE BAR]            │ │
    │ ├─────────────────────────────────────────┤ │
    │ │ Why:                                     │ │
    │ │ "Policy adjustment period historically  │ │
    │ │  increases rates"                       │ │
    │ └─────────────────────────────────────────┘ │
    │                                             │
    │ [Similar card for Period to Avoid #2]       │
    └─────────────────────────────────────────────┘

    D. REGENERATE BUTTON:
    └─ "Regenerate Recommendations" button at bottom
    └─ Allows user to refresh without leaving tab


STEP 8: User Interactions After Viewing Results
┌──────────────────────────────────────────────────────────────────┐
│ USER OPTIONS:                                                    │
│ 1. View another recommendation (regenerate button)              │
│ 2. Switch to different tab (Result/Comparison)                 │
│ 3. Modify form and recalculate                                 │
│ 4. Share/export recommendations                                │
└──────────────────────────────────────────────────────────────────┘

USER ACTION: Clicks "Regenerate Recommendations"
COMPONENT FLOW:
  1. handleGenerateRecommendations() triggered again
  2. New request sent to backend (if not in cache)
  3. Results updated

USER ACTION: Changes form and recalculates
COMPONENT FLOW:
  1. TariffChart receives new calculation
  2. New AIRecommendationRequest generated with new parameters
  3. Cache miss (different parameters)
  4. New AI analysis performed
  5. New results displayed
```

---

## 📊 Data Flow Summary

### Request Path:
```
User clicks "Generate"
    ↓
AIInsightsTab.handleGenerateRecommendations()
    ↓
ai-service.ts: getAIRecommendation(request)
    ↓
HTTP POST /api/ai/recommendation
    ↓
AIController.getRecommendation()
    ↓
AIRecommendationService.getTimingRecommendation()
    ↓
[Complex processing...]
    ↓
AIRecommendationResponse (JSON)
```

### Response Path:
```
AIRecommendationResponse (JSON)
    ↓
ai-service.ts receives response
    ↓
AIInsightsTab.useState(recommendation) updated
    ↓
Component re-renders with SUCCESS state
    ↓
TimingRecommendationCard components rendered
    ↓
ConfidenceIndicator components rendered
    ↓
User sees beautiful recommendation cards
```

---

## 🔑 Key Files and Their Roles

| File | Role | Triggered When |
|------|------|---|
| **TariffChart.tsx** | Main container, tab management | Page load, form submit |
| **AIInsightsTab.tsx** | Container for AI recommendations | User clicks AI Insights tab |
| **ai-service.ts** | API client functions | Generate button clicked |
| **AIController.java** | REST endpoint handler | HTTP POST received |
| **AIRecommendationService.java** | Main business logic | Controller calls it |
| **TariffMLService.java** | Rate prediction/forecasting | AIRecommendationService calls it |
| **FeatureEngineeringService.java** | Feature extraction from data | TariffMLService calls it |
| **TimingRecommendationCard.tsx** | Individual period display | Results rendered |
| **ConfidenceIndicator.tsx** | Confidence visual | Period cards rendered |
| **Repositories** | Data queries | Feature engineering queries historical data |

---

## 🎬 Complete Timeline Example

```
12:00:00 → User opens dashboard
12:00:05 → User fills form: USA, CHN, 620342, $15,000
12:00:10 → User clicks "Calculate Tariff"
12:00:15 → API response received, results show, 3 tabs visible
12:00:20 → User clicks "AI Insights" tab
12:00:22 → AIInsightsTab mounts, shows empty state with button
12:00:25 → User clicks "Generate Recommendations"
12:00:26 → Loading spinner appears
12:00:27 → Backend receives request
12:00:28 → AIRecommendationService starts processing
12:00:29 → TariffMLService queries historical data
12:00:30 → FeatureEngineeringService extracts 20+ features
12:00:32 → ML predictions completed for 365 days
12:00:33 → Optimal/avoid periods identified
12:00:34 → Personalized explanation generated
12:00:35 → Response sent to frontend
12:00:36 → Frontend renders success state
12:00:37 → User sees recommendation cards with savings
12:00:40 → User can scroll through all recommendations
12:00:45 → User can regenerate or switch tabs
```

---

## 🔐 Authentication & Security Flow

```
User logs in
    ↓
JWT token stored in localStorage
    ↓
User calculates tariff
    ↓
User clicks "Generate Recommendations"
    ↓
ai-service.ts retrieves JWT from localStorage
    ↓
Adds Authorization header: "Bearer {JWT_TOKEN}"
    ↓
HTTP POST includes JWT
    ↓
AIController checks @AuthenticationPrincipal UserInfo
    ↓
If valid: Extracts profileType from user object
    ↓
Passes profileType to AIRecommendationService
    ↓
Personalized explanation generated based on profileType
    ↓
Response includes profile-specific content
```

---

## 🎯 Summary

The AI workflow is triggered entirely by the user clicking the "Generate Recommendations" button in the AIInsightsTab. The entire process:

1. **Frontend** initiates HTTP request with tariff parameters
2. **Backend** analyzes 5 years of historical data
3. **ML Service** predicts rates for 365 days ahead
4. **Feature Engineering** extracts 20+ features for analysis
5. **Business Logic** identifies optimal and avoid periods
6. **Personalization** customizes explanation based on user profile
7. **Caching** stores results for performance
8. **Frontend** renders beautiful recommendation cards with confidence indicators

All triggered by one button click! 🚀
