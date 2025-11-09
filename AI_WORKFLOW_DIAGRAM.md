# AI Workflow - Visual Diagrams & Quick Reference

## 🎬 High-Level User Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         START: User on Dashboard                    │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Enter Tariff   │
                    │  Parameters     │
                    │  (5 Fields)     │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Click:         │
                    │  "Calculate     │
                    │   Tariff"       │
                    └────────┬────────┘
                             │
                    (API Call to Backend)
                             │
                             ▼
                    ┌─────────────────┐
                    │  See Results    │
                    │  (3 Tabs)       │
                    │  Result✓        │
                    │  Comparison     │
                    │  AI Insights⭐  │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Click:         │
                    │  "AI Insights"  │
                    │  Tab            │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Empty State    │
                    │  with Button:   │
                    │  "Generate      │
                    │   Recomm."      │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Click:         │
                    │  "Generate      │
                    │   Recomm."      │
                    │  BUTTON         │
                    └────────┬────────┘
                             │
                (🚀 AI ENGINE STARTS HERE 🚀)
                             │
                             ▼
                    ┌─────────────────┐
                    │  Loading        │
                    │  Spinner        │
                    │  "Analyzing..." │
                    └────────┬────────┘
                             │
                (Backend Processing)
                             │
                             ▼
                    ┌─────────────────┐
                    │  See Results:   │
                    │  • Summary Card │
                    │  • 3 Optimal    │
                    │  • 2 Avoid      │
                    │  • Explanation  │
                    └────────┬────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      END: User sees recommendations                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Component Interaction Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                           USER BROWSER                               │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ TariffChart.tsx (Parent Container)                          │   │
│  │ ├─ State: importingCountry, exportingCountry, etc.          │   │
│  │ ├─ State: calculationResult                                 │   │
│  │ ├─ State: activeTab ("result" | "comparison" | "ai-insights")   │
│  │ └─ State: comparisonResults, etc.                           │   │
│  │                                                             │   │
│  │  ┌────────────────────────────────────────────────────┐    │   │
│  │  │ TAB 1: Result Tab                                  │    │   │
│  │  │ ┌──────────────────────────────────────────────┐   │    │   │
│  │  │ │ ResultComponents.tsx                         │   │    │   │
│  │  │ │ • Cost Summary                               │   │    │   │
│  │  │ │ • Calculation Details                        │   │    │   │
│  │  │ │ • Comparison Selector                        │   │    │   │
│  │  │ └──────────────────────────────────────────────┘   │    │   │
│  │  └────────────────────────────────────────────────────┘    │   │
│  │                                                             │   │
│  │  ┌────────────────────────────────────────────────────┐    │   │
│  │  │ TAB 2: Comparison Tab                             │    │   │
│  │  │ ┌──────────────────────────────────────────────┐   │    │   │
│  │  │ │ ComparisonResults.tsx                        │   │    │   │
│  │  │ │ • Country Rankings                           │   │    │   │
│  │  │ │ • Price Comparison                           │   │    │   │
│  │  │ └──────────────────────────────────────────────┘   │    │   │
│  │  └────────────────────────────────────────────────────┘    │   │
│  │                                                             │   │
│  │  ┌────────────────────────────────────────────────────┐    │   │
│  │  │ TAB 3: AI Insights Tab ⭐ (NEW)                    │    │   │
│  │  │ ┌──────────────────────────────────────────────┐   │    │   │
│  │  │ │ AIInsightsTab.tsx                            │   │    │   │
│  │  │ │ • State: loadingState, recommendation, error │   │    │   │
│  │  │ │                                              │   │    │   │
│  │  │ │ EMPTY STATE:                                 │   │    │   │
│  │  │ │  ┌────────────────────────────────────────┐  │   │    │   │
│  │  │ │  │ 🟡 Button: "Generate Recommendations" │  │   │    │   │
│  │  │ │  │    (TRIGGERS API CALL)                 │  │   │    │   │
│  │  │ │  └────────────────────────────────────────┘  │   │    │   │
│  │  │ │                                              │   │    │   │
│  │  │ │ LOADING STATE (after button clicked):       │   │    │   │
│  │  │ │  ┌────────────────────────────────────────┐  │   │    │   │
│  │  │ │  │ 🔄 Spinner                            │  │   │    │   │
│  │  │ │  │ "Analyzing historical data..."        │  │   │    │   │
│  │  │ │  └────────────────────────────────────────┘  │   │    │   │
│  │  │ │                                              │   │    │   │
│  │  │ │ SUCCESS STATE (after data received):        │   │    │   │
│  │  │ │  ┌────────────────────────────────────────┐  │   │    │   │
│  │  │ │  │ ConfidenceIndicator.tsx               │  │   │    │   │
│  │  │ │  │ (shows avg confidence: 40-100%)       │  │   │    │   │
│  │  │ │  └────────────────────────────────────────┘  │   │    │   │
│  │  │ │  ┌────────────────────────────────────────┐  │   │    │   │
│  │  │ │  │ TimingRecommendationCard #1            │  │   │    │   │
│  │  │ │  │ • Optimal Period (green)               │  │   │    │   │
│  │  │ │  │ • Dates, rates, savings                │  │   │    │   │
│  │  │ │  │ • Reason & confidence                  │  │   │    │   │
│  │  │ │  └────────────────────────────────────────┘  │   │    │   │
│  │  │ │  ┌────────────────────────────────────────┐  │   │    │   │
│  │  │ │  │ TimingRecommendationCard #2            │  │   │    │   │
│  │  │ │  │ (similar)                              │  │   │    │   │
│  │  │ │  └────────────────────────────────────────┘  │   │    │   │
│  │  │ │  ┌────────────────────────────────────────┐  │   │    │   │
│  │  │ │  │ TimingRecommendationCard #3            │  │   │    │   │
│  │  │ │  │ (similar)                              │  │   │    │   │
│  │  │ │  └────────────────────────────────────────┘  │   │    │   │
│  │  │ │  ┌────────────────────────────────────────┐  │   │    │   │
│  │  │ │  │ TimingRecommendationCard #4 (Avoid)    │  │   │    │   │
│  │  │ │  │ • Avoid Period (red)                   │  │   │    │   │
│  │  │ │  │ • Dates, rates, costs                  │  │   │    │   │
│  │  │ │  │ • Reason & confidence                  │  │   │    │   │
│  │  │ │  └────────────────────────────────────────┘  │   │    │   │
│  │  │ │  ┌────────────────────────────────────────┐  │   │    │   │
│  │  │ │  │ TimingRecommendationCard #5 (Avoid)    │  │   │    │   │
│  │  │ │  │ (similar)                              │  │   │    │   │
│  │  │ │  └────────────────────────────────────────┘  │   │    │   │
│  │  │ │  ┌────────────────────────────────────────┐  │   │    │   │
│  │  │ │  │ Button: "Regenerate Recommendations"   │  │   │    │   │
│  │  │ │  └────────────────────────────────────────┘  │   │    │   │
│  │  │ └──────────────────────────────────────────────┘   │    │   │
│  │  └────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
           │
           │ HTTP POST /api/ai/recommendation
           │ (with JWT, importerCode, exporterCode, hs6Code)
           │
           ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      BACKEND (Spring Boot Server)                    │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ AIController.java                                           │   │
│  │ POST /api/ai/recommendation                                 │   │
│  │ ├─ @AuthenticationPrincipal UserInfo userInfo               │   │
│  │ ├─ Validate: userInfo != null (401 if invalid)              │   │
│  │ ├─ Extract: profileType from userInfo                       │   │
│  │ └─ Call: aiRecommendationService.getTimingRecommendation()  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│           │                                                         │
│           ▼                                                         │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ AIRecommendationService.java                                │   │
│  │ getTimingRecommendation(importerCode, exporterCode,         │   │
│  │                         hs6Code, profileType)               │   │
│  │                                                             │   │
│  │ CACHE CHECK:                                                │   │
│  │ ├─ Key: "USA-CHN-620342-BUSINESS_OWNER"                     │   │
│  │ └─ IF CACHED → Return immediately                           │   │
│  │                                                             │   │
│  │ ELSE:                                                       │   │
│  │ ├─ getCurrentRate(importerCode, hs6Code)                    │   │
│  │ ├─ mlService.predictRateRange(365 days)                     │   │
│  │ ├─ findOptimalPeriods(forecasts) → 3 periods               │   │
│  │ ├─ findAvoidPeriods(forecasts) → 2 periods                 │   │
│  │ ├─ calculatePotentialSavings(optimalPeriods)               │   │
│  │ ├─ generateExplanation(profileType)                        │   │
│  │ ├─ Build AIRecommendationResponse                          │   │
│  │ └─ Cache response & Return                                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
│           │                                                         │
│           ▼                                                         │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ TariffMLService.java                                        │   │
│  │ predictRateRange(importerCode, exporterCode, hs6Code,       │   │
│  │                  startDate, endDate)                        │   │
│  │                                                             │   │
│  │ FOR EACH WEEK (52 weeks):                                   │   │
│  │ ├─ predictTariffRate() for each day                         │   │
│  │ ├─ Aggregate to weekly: avg, min, max rates                 │   │
│  │ ├─ Calculate average confidence                             │   │
│  │ └─ Create DateRangeForecast                                 │   │
│  │                                                             │   │
│  │ RETURNS: List<DateRangeForecast> (52 items)                │   │
│  └─────────────────────────────────────────────────────────────┘   │
│           │                                                         │
│           ▼                                                         │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ FeatureEngineeringService.java                              │   │
│  │ (called by TariffMLService for each day prediction)         │   │
│  │                                                             │   │
│  │ extractFeatures(importerCode, exporterCode,                 │   │
│  │                 hs6Code, targetDate)                        │   │
│  │                                                             │   │
│  │ DATA QUERIES (5 years historical):                          │   │
│  │ ├─ MeasureRepository.findHistoricalRates()                  │   │
│  │ ├─ PreferenceRepository.findHistoricalPreferences()         │   │
│  │ ├─ SuspensionRepository.findHistoricalSuspensions()         │   │
│  │ └─ TransactionRepository.getUserProductPatterns()          │   │
│  │                                                             │   │
│  │ FEATURE EXTRACTION (20+ features):                          │   │
│  │ ├─ Temporal: year, quarter, month, dayOfYear               │   │
│  │ ├─ Rate History: avg, volatility, trend                    │   │
│  │ ├─ Trade Patterns: frequency, value, weight                │   │
│  │ ├─ Policy Indicators: FTA status, suspensions              │   │
│  │ └─ Geographic: importer/exporter codes                     │   │
│  │                                                             │   │
│  │ RETURNS: TariffFeatures object                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│           │                                                         │
│           ▼                                                         │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Repositories (Data Access Layer)                            │   │
│  │ ├─ MeasureRepository.findHistoricalRates()                  │   │
│  │ ├─ MeasureRepository.findValidRate()                        │   │
│  │ ├─ PreferenceRepository.findHistoricalPreferences()         │   │
│  │ ├─ SuspensionRepository.findHistoricalSuspensions()         │   │
│  │ ├─ TransactionRepository.getUserProductPatterns()          │   │
│  │ └─ Returns database records (SQL queries)                   │   │
│  │                                                             │   │
│  │ ┌─────────────────────────────────────────────┐             │   │
│  │ │ DATABASE                                    │             │   │
│  │ │ ├─ measure (historical tariff rates)        │             │   │
│  │ │ ├─ preference (FTA/preferential rates)      │             │   │
│  │ │ ├─ suspension (rate suspensions)            │             │   │
│  │ │ ├─ transaction (user trade history)         │             │   │
│  │ │ └─ [... other tables ...]                   │             │   │
│  │ └─────────────────────────────────────────────┘             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
           │
           │ JSON Response: AIRecommendationResponse
           │ (with optimalPeriods, avoidPeriods, explanation, etc.)
           │
           ▼
        (Back to Frontend)
```

---

## 📋 File Triggering Sequence

```
1. USER INTERACTION
   └─ Click "Generate Recommendations" button
      (in AIInsightsTab.tsx)

2. FRONTEND EXECUTION
   └─ AIInsightsTab.tsx
      └─ handleGenerateRecommendations()
         └─ ai-service.ts: getAIRecommendation()
            └─ HTTP POST request

3. HTTP TRANSPORT
   └─ POST /api/ai/recommendation
      └─ Headers: Authorization, Content-Type
      └─ Body: AIRecommendationRequest (JSON)

4. BACKEND ENTRY
   └─ AIController.java
      └─ @PostMapping("/recommendation")
         └─ getRecommendation(request, userInfo)
            └─ Call AIRecommendationService

5. BUSINESS LOGIC
   └─ AIRecommendationService.java
      └─ getTimingRecommendation()
         ├─ Call TariffMLService (prediction)
         ├─ Call findOptimalPeriods()
         ├─ Call findAvoidPeriods()
         ├─ Call calculatePotentialSavings()
         ├─ Call generateExplanation(profileType)
         └─ Return AIRecommendationResponse

6. ML/DATA PROCESSING
   └─ TariffMLService.java
      └─ predictRateRange()
         └─ FOR EACH WEEK:
            └─ predictTariffRate()
               └─ FeatureEngineeringService.java
                  └─ extractFeatures()
                     ├─ MeasureRepository queries
                     ├─ PreferenceRepository queries
                     ├─ SuspensionRepository queries
                     └─ Calculate 20+ features

7. DATA ACCESS
   └─ Repositories (all access database)
      ├─ MeasureRepository
      ├─ PreferenceRepository
      ├─ SuspensionRepository
      ├─ TransactionRepository
      └─ Database (executes SQL)

8. RESPONSE BUILDING
   └─ Build response object with:
      ├─ optimalPeriods (3 items)
      ├─ avoidPeriods (2 items)
      ├─ explanation (profile-specific)
      ├─ currentRate
      ├─ potentialSavings
      ├─ averageConfidence
      └─ Cache result

9. HTTP RESPONSE
   └─ JSON response sent to frontend
      └─ Status: 200 OK
      └─ Body: AIRecommendationResponse

10. FRONTEND RENDERING
    └─ ai-service.ts receives response
       └─ AIInsightsTab.tsx
          └─ recommendation state updated
             └─ Component re-renders
                ├─ Render summary card
                ├─ Render optimal periods
                │  └─ TimingRecommendationCard.tsx
                │     └─ ConfidenceIndicator.tsx
                └─ Render avoid periods
                   └─ TimingRecommendationCard.tsx
                      └─ ConfidenceIndicator.tsx

11. USER SEES RESULTS
    └─ Beautiful recommendation cards displayed
       ├─ Current rate
       ├─ Savings/costs
       ├─ Confidence scores
       ├─ Dates (DD/MM/YYYY)
       └─ Explanations
```

---

## 🔑 Key Trigger Points

| Step | File | Method/Component | User Action |
|------|------|------------------|-------------|
| 1 | AIInsightsTab.tsx | Button click | "Generate Recommendations" |
| 2 | ai-service.ts | getAIRecommendation() | Network request |
| 3 | AIController.java | getRecommendation() | HTTP POST received |
| 4 | AIRecommendationService.java | getTimingRecommendation() | Business logic starts |
| 5 | TariffMLService.java | predictRateRange() | ML prediction begins |
| 6 | FeatureEngineeringService.java | extractFeatures() | Data extraction |
| 7 | Repositories | Query methods | Database queries |
| 8 | AIRecommendationService.java | Build response | Processing complete |
| 9 | ai-service.ts | Response handler | JSON received |
| 10 | AIInsightsTab.tsx | setState() | UI updates |
| 11 | TimingRecommendationCard.tsx | render() | Cards displayed |

---

## 🎯 Quick Reference: What Gets Called When

```
User clicks "Generate" button
├─ FRONTEND
│  ├─ AIInsightsTab.tsx (loadingState = "loading")
│  └─ ai-service.ts (HTTP POST)
│
├─ NETWORK
│  └─ POST /api/ai/recommendation
│
└─ BACKEND
   ├─ AIController.java (validates auth)
   ├─ AIRecommendationService.java (orchestration)
   │  ├─ Calls TariffMLService
   │  │  ├─ Calls FeatureEngineeringService (per day)
   │  │  │  ├─ Queries MeasureRepository
   │  │  │  ├─ Queries PreferenceRepository
   │  │  │  ├─ Queries SuspensionRepository
   │  │  │  └─ Returns TariffFeatures
   │  │  └─ Returns List<DateRangeForecast> (52 weeks)
   │  │
   │  ├─ Analyzes forecasts
   │  ├─ Finds optimal periods (top 3 lowest rates)
   │  ├─ Finds avoid periods (top 2 highest rates)
   │  ├─ Calculates savings
   │  ├─ Generates explanation (based on profileType)
   │  └─ Returns AIRecommendationResponse
   │
   └─ Caches response (future requests faster)

NETWORK RESPONSE
└─ JSON: AIRecommendationResponse

FRONTEND RECEIVES
└─ AIInsightsTab.tsx
   ├─ Sets recommendation state
   ├─ Sets loadingState = "success"
   ├─ Renders success template
   ├─ Renders TimingRecommendationCard (x5)
   └─ Each card renders ConfidenceIndicator
```

---

## 📊 Data Classes Exchanged

```
FRONTEND SENDS:
AIRecommendationRequest
{
  importerCode: "USA",
  exporterCode: "CHN",
  hs6Code: "620342"
}

BACKEND PROCESSES:
├─ Queries historical data (5 years)
├─ Extracts 20+ features per day
├─ Predicts 365 days (52 weeks)
├─ Identifies patterns
└─ Calculates recommendations

BACKEND RETURNS:
AIRecommendationResponse
{
  optimalPeriods: [3 OptimalPeriod objects],
  avoidPeriods: [2 AvoidPeriod objects],
  explanation: "Profile-specific text",
  currentRate: 5.50,
  potentialSavings: 825.00,
  potentialSavingsPercent: 15.00,
  averageConfidence: 75,
  modelVersion: "1.0.0",
  hasInsufficientData: false
}

FRONTEND RENDERS:
├─ Summary Card
├─ Optimal Period Cards (x3)
└─ Avoid Period Cards (x2)
```

---

This diagram shows exactly how the AI recommendation engine is triggered and which files participate at each stage! 🚀
