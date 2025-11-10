# Tariff Prediction System - Complete Guide

## Overview

This document explains how the verbose-garbonzo-tariff system works end-to-end: how it determines confidence levels and predicts optimal transaction timing.

---

## Part 1: How Confidence is Determined

Your system uses **two different confidence calculation methods** depending on data availability:

### Method A: Statistical Fallback (When ML Model Isn't Available)

This method is used when there's insufficient historical data or no trained ML model for a trade route.

**Formula:**
```
Base Confidence = 40%
Confidence = 40 + (50 × log(numRecords) / log(100))
Maximum Cap = 100%
```

**Why logarithmic?** It reflects realistic diminishing returns—your first few historical records help a lot, but eventually each additional record helps less.

**Examples:**
- 1 record: 40% (base only)
- 2 records: 48% (minimal data still risky)
- 5 records: 58% (reasonable confidence growing)
- 10 records: 65% (good historical basis)
- 50 records: 82% (strong confidence)
- 100+ records: 90-100% (very confident)

**Time-based penalty:** If forecasting more than 365 days into the future, reduce confidence by 15% (minimum 40%).

**Prediction bounds:** ±20% around the predicted rate (wider uncertainty)

---

### Method B: ML Model Predictions (When You Have Trained Models)

Trained models start with a higher base confidence.

**Formula (Training Time):**
```
Base Confidence = min(80%, 50% + (recordCount / 10))
Maximum Cap = 80% (even with unlimited data)
```

Example: 150 historical records = min(80, 50 + 15) = 65%

**Time-based penalty:** Same as fallback (±15% for forecasts >365 days)

**Prediction bounds:** ±10% around the predicted rate (narrower uncertainty, more confidence)

---

### Real-World Scenarios

| Scenario | Records | Method | Confidence | Bounds |
|----------|---------|--------|------------|--------|
| USA importing coffee (250 records) | 250 | ML Model | 75% | ±10% |
| Canada importing fertilizer (45 records) | 45 | ML Model | 54% | ±10% |
| Mexico importing alloy (8 records) | 8 | Fallback | 63% | ±20% |
| New trade route (0 records) | 0 | Fallback | 40% | ±20% |

---

### Confidence Interpretation Guide

| Confidence | Interpretation | Use Case | Risk Level |
|-----------|---------------|-----------|----|
| 90-100% | Very High | Act on recommendation | Low |
| 75-89% | High | Strong basis for decision | Low-Medium |
| 60-74% | Moderate | Consider with other factors | Medium |
| 40-59% | Low | Use for reference only | Medium-High |
| Below 40% | Very Low | No recommendation | High |

---

## Part 2: How It Predicts Optimal Transaction Timing

The system identifies the best times to transact in the next 365 days through a multi-step process.

### Step 1: Make Daily Predictions for 365 Days

The system predicts what the tariff rate will be for every single day of the next year:

```
Jan 1: Predicted 5.2%
Jan 2: Predicted 5.1%
Jan 3: Predicted 5.0%
Jan 4: Predicted 4.9%
... (continues for all 365 days)
```

### Step 2: Group Into Weeks

Instead of showing you 365 daily numbers, it groups them into weeks:

```
Week 1 (Jan 1-7): Average = 5.08%
Week 2 (Jan 8-14): Average = 5.04%
Week 3 (Jan 15-21): Average = 4.98%
... (52 weeks total)
```

For each week, it also calculates:
- **Min rate**: Lowest predicted rate during that week
- **Max rate**: Highest predicted rate during that week
- **Average confidence**: Average of daily confidence scores for that week

### Step 3: Find the 3 Cheapest Weeks

The system looks at all 52 weeks and picks the 3 with the lowest average rates:

```
1. Week 18 (April 28 - May 4): 4.10%
2. Week 20 (May 12 - May 18): 4.25%
3. Week 22 (May 26 - June 1): 4.35%
```

### Step 4: Compare to Current Rate

Current rate (today): 5.50%

```
Week 18: 4.10% is 1.4% cheaper → Save 25% on tariffs
         On a $10,000 import: Save $250

Week 20: 4.25% is 1.25% cheaper → Save 23%
         On a $10,000 import: Save $230

Week 22: 4.35% is 1.15% cheaper → Save 21%
         On a $10,000 import: Save $210
```

**Important:** The system only recommends weeks that are cheaper than the current rate.

### Step 5: Send the Recommendation

The system tells you:

```json
{
  "optimalPeriods": [
    {
      "startDate": "2025-04-28",
      "endDate": "2025-05-04",
      "avgRate": "4.10%",
      "currentRate": "5.50%",
      "savingsPercent": "25.45%",
      "estimatedSavingsAmount": "$254.50",
      "confidence": 75,
      "reason": "FTA renewal period typically shows lower rates"
    }
  ]
}
```

### Step 6: Find Periods to Avoid (Top 2 Highest-Rate Weeks)

Mirror process for the worst times:
1. Sort weeks by rate (highest first)
2. Take the top 2 highest-rate weeks
3. Only include weeks more expensive than current rate
4. Show estimated additional cost

```json
{
  "avoidPeriods": [
    {
      "startDate": "2025-01-06",
      "endDate": "2025-01-12",
      "avgRate": "6.80%",
      "currentRate": "5.50%",
      "increasePercent": "23.64%",
      "estimatedAdditionalCostAmount": "$236.40",
      "confidence": 68,
      "reason": "Policy adjustment period historically increases rates"
    }
  ]
}
```

---

## Part 3: How It Knows These Patterns Exist

The system doesn't magically know April is cheaper. It learned from your historical data.

### The Data Learning Process

You've been importing for years. Your database has actual historical rates:

```
Jan 2022: 5.4%
Feb 2022: 5.3%
Mar 2022: 5.2%
Apr 2022: 4.1%  ← Much cheaper!
May 2022: 4.3%  ← Still cheap
Jun 2022: 4.5%  ← Cheap
Jul 2022: 5.5%  ← Back up

Jan 2021: 5.5%
Feb 2021: 5.4%
Mar 2021: 5.2%
Apr 2021: 4.0%  ← Much cheaper again!
May 2021: 4.2%  ← Still cheap
Jun 2021: 4.6%  ← Cheap
Jul 2021: 5.6%  ← Back up
```

### What the System Notices

When it looks at the historical data, it sees a clear pattern:
- **April, May, June** are consistently cheaper (15-25% discount)
- **January is consistently expensive** (5-10% premium)

**Why?** Free Trade Agreement (FTA) renewals happen in spring, so tariffs drop during Q2 (April-June). Policy adjustments in January cause rate increases.

### How It Encodes Seasonal Patterns

The system uses a mathematical technique called **trigonometric encoding** to represent months as a circular cycle (since December is close to January cyclically, not far):

```
For April (month 4):
  month_sin = sin(2π × 4 / 12) ≈ 0.866
  month_cos = cos(2π × 4 / 12) ≈ 0.5
  This creates a unique "fingerprint" for April

For January (month 1):
  month_sin = sin(2π × 1 / 12) ≈ 0.5
  month_cos = cos(2π × 1 / 12) ≈ -0.866
  This creates a unique "fingerprint" for January
```

These fingerprints are mathematically different, allowing the model to learn distinct patterns for each month.

### How the Model Learns the Pattern

From historical data analysis:
- When month_sin ≈ 0.866 (April-ish): Average rate = 4.2%
- When month_sin ≈ 0.5 (January-ish): Average rate = 5.4%

The model learns this relationship and applies it when predicting the future.

### Other Patterns Detected

The system also creates features for:

**Temporal Patterns:**
- Year progress (0-365 days): Identifies trends within a year
- Quarter-based patterns: Q1, Q2, Q3, Q4 behavior

**Rate History Patterns:**
- 3-year average: Baseline for predictions
- 5-year average: Longer-term trend detection
- Rate volatility: How stable/unstable the rates are
- Trend direction: Is this trade route's rates increasing, decreasing, or stable?

**Trade-Specific Patterns:**
- Free Trade Agreement presence: Does an FTA exist? If yes, expect lower rates
- Duty suspensions: Are temporary suspensions active? If yes, expect lower rates
- Years since FTA: How mature is the agreement?

---

## Complete Example: USA Importing Electronics from China

### Scenario
Trade Route: USA → China → Electronics (HS6: 291030)
Current Rate: 5.50%
Historical Data: 150 records from past 5 years

### System Processing

**Step 1: Check Data & Confidence**
```
Historical records: 150
ML Model available? YES
Trained? YES

Confidence Base = min(80, 50 + 150/10) = min(80, 65) = 65%
Prediction Bounds = ±10% (ML model method)
```

**Step 2: Predict Next 365 Days**
```
Daily predictions using ML model + seasonal patterns:
- January 6: 5.8% (high - policy adjustment month)
- April 28: 4.1% (low - FTA renewal month Q2)
- July 15: 5.2% (moderate)
- September 10: 5.9% (high - another policy adjustment month)
```

**Step 3: Weekly Aggregation**
```
Week 1 (Jan 1-7): avg=5.75%, min=5.6%, max=5.9%, confidence=65%
...
Week 18 (Apr 28-May 4): avg=4.10%, min=3.9%, max=4.3%, confidence=68%
...
Week 52 (Dec 23-29): avg=5.4%, min=5.2%, max=5.6%, confidence=62%
```

**Step 4: Identify Optimal & Avoid**
```
Top 3 Lowest:
1. Week 18 (Apr 28-May 4): 4.10% → Save 25% ($250 on $10k)
2. Week 20 (May 12-18): 4.25% → Save 23% ($230 on $10k)
3. Week 22 (May 26-Jun 1): 4.35% → Save 21% ($210 on $10k)

Top 2 Highest:
1. Week 37 (Sep 8-14): 5.90% → Cost 7% more ($70 on $10k)
2. Week 2 (Jan 6-12): 5.75% → Cost 5% more ($50 on $10k)
```

**Step 5: API Response**
```json
{
  "optimalPeriods": [
    {
      "startDate": "2025-04-28",
      "endDate": "2025-05-04",
      "avgRate": "4.10%",
      "savingsPercent": "25.45%",
      "estimatedSavingsAmount": "$254.50",
      "confidence": 68,
      "reason": "FTA renewal period typically shows lower rates"
    },
    ...
  ],
  "avoidPeriods": [
    {
      "startDate": "2025-09-08",
      "endDate": "2025-09-14",
      "avgRate": "5.90%",
      "increasePercent": "7.27%",
      "estimatedAdditionalCostAmount": "$72.70",
      "confidence": 65,
      "reason": "Policy adjustment period historically increases rates"
    },
    ...
  ],
  "averageConfidence": 66,
  "potentialSavings": "$254.50",
  "potentialSavingsPercent": "25.45%",
  "modelVersion": "1.0.0",
  "hasInsufficientData": false
}
```

---

## System Architecture Summary

### Data Flow

```
User Request
    ↓
1. Get Current Rate
   └─ Query database for today's rate
    ↓
2. Predict Next 365 Days
   ├─ Train models if needed (once on first request)
   ├─ Daily predictions for each day
   │  └─ Extract features (month, day of year, historical avg, etc.)
   │  └─ Use ML model OR fallback statistical method
   └─ Return daily ForecastResult objects
    ↓
3. Weekly Aggregation
   ├─ Group 7 days together
   ├─ Calculate avg, min, max rates
   └─ Return DateRangeForecast objects (52 weeks)
    ↓
4. Identify Optimal & Avoid Periods
   ├─ Sort by rate (ascending/descending)
   ├─ Take top 3 lowest / top 2 highest
   └─ Filter by comparison to current rate
    ↓
5. Generate Recommendations
   ├─ Calculate savings/costs
   ├─ Determine seasonal reasons
   └─ Return AIRecommendationResponse
```

### Key Files

| File | Purpose |
|------|---------|
| **TariffMLService.java** | ML model training & prediction, fallback forecasting |
| **AIRecommendationService.java** | Timing recommendations, period identification |
| **FeatureEngineeringService.java** | Feature extraction (temporal, rate history, policy) |
| **MeasureRepository.java** | Historical data queries |
| **WitsTariffDataClient.java** | Fetches historical data from WITS API for training |

---

## Key Takeaways

1. **Confidence scales with data** - More historical records = higher confidence
2. **Predictions are seasonal** - April/May typically cheaper, January typically expensive
3. **Weekly aggregation** - Shows practical time periods, not overwhelming daily data
4. **Dual prediction methods** - ML models when available, statistical fallback when not
5. **Conservative approach** - Starts at 40% base confidence, only increases with evidence
6. **Practical savings** - System estimates real dollar impact on $10k trades for context

---

## Configuration

**ML Model Settings** (application.properties):
```properties
app.ml.model.enabled=true
app.ml.model.path=./models
app.ml.model.version=1.0.0
app.ml.model.min-training-samples=3
```

**WITS Data Fetching:**
```properties
wits.baseUrl=https://wits.worldbank.org/api
wits.tariff.dataset=TARIFF
```

**Training Schedule:**
```properties
app.ml.training.schedule.cron=0 0 2 ? * SUN  # Every Sunday at 2 AM
```
