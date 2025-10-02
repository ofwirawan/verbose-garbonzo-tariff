# WITS Data Fetching & Seeding Scripts

Manual scripts to fetch WITS tariff data and seed your Supabase database.

## Overview

This workflow allows you to:

1. Fetch tariff data from WITS API for **198 countries** and **387 chemical products** (2015-2023)
2. Save the data to a JSON file
3. Generate a SQL seed file
4. Import into your Supabase database

## Prerequisites

- Node.js v18+ (for native `fetch` support)
- CSV files: `country_rows.csv` and `product_rows.csv` (should be in `scripts/` directory)

## Step 1: Fetch WITS Data

Run the fetch script to download tariff data:

```bash
cd frontend
node scripts/fetchWitsData.mjs
```

**What it does:**

- Loads 198 countries from `country_rows.csv`
- Loads 387 products from `product_rows.csv`
- Fetches tariff rates for each country-product-year combination (2015-2023)
- Saves results to `data/wits_tariff_data.json`

**Estimated time:** ~30-60 minutes (depends on API response times and network)

**Note:** The script includes a 500ms delay between requests to avoid overwhelming the WITS API.

## Step 2: Generate Seed File

After fetching, generate the SQL seed file:

```bash
node scripts/generateSeedFile.mjs
```

**What it does:**

- Reads `data/wits_tariff_data.json`
- Generates SQL `INSERT` statements with `UPSERT` logic
- Saves to `supabase/seeds/wits_tariff_data.sql`

## Step 3: Seed Supabase Database

### Option A: Supabase SQL Editor (Recommended)

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Open `supabase/seeds/wits_tariff_data.sql`
4. Copy and paste the contents
5. Run the SQL

### Option B: Command Line (psql)

```bash
psql YOUR_SUPABASE_DATABASE_URL < frontend/supabase/seeds/wits_tariff_data.sql
```

## Data Details

### Countries (198 total)

All countries from `country_rows.csv` including:

- USA, China, Germany, Japan, UK, Canada, India
- All EU members
- And 191 more...

### Products (387 total)

All HS Chapter 29 (Organic Chemicals) products from `product_rows.csv`:

- 290110 - Saturated hydrocarbons
- 290121 - Ethylene
- 290220 - Benzene
- 290531 - Ethylene glycol
- And 383 more...

### Years

2015-2023 (9 years)

### Total Possible Records

198 countries × 387 products × 9 years = **689,706 potential records**

**Actual records will be less** as WITS doesn't have data for all combinations.

## Configuration

Edit `fetchWitsData.mjs` to modify:

- `START_YEAR` and `END_YEAR` constants
- API delay (currently 500ms)
- Progress reporting frequency

## Troubleshooting

### Script fails with "CSV not found"

Make sure `country_rows.csv` and `product_rows.csv` are in the `scripts/` directory.

### No data in JSON file

Check if the WITS API is accessible and returning data. Try running for a smaller subset first.

### Seed file too large for Supabase SQL Editor

Split the seed file into smaller batches or use the `psql` command line option.

## Files Generated

- `data/wits_tariff_data.json` - Raw fetched data in JSON format
- `supabase/seeds/wits_tariff_data.sql` - SQL seed file for database import

## After Seeding

Once the data is in your database, the **TariffHistory** page will automatically query from Supabase instead of calling the WITS API.

Visit: `http://localhost:3000/TariffHistory`
