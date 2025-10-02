/**
 * Manual script to fetch WITS tariff data and save to JSON file
 * Run with: node scripts/fetchWitsData.mjs
 *
 * Fetches data for all 198 countries and 387 chemical products
 * Requires: country_rows.csv and product_rows.csv in the same directory
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const START_YEAR = 2023;
const END_YEAR = 2023;
const YEARS = Array.from({ length: END_YEAR - START_YEAR + 1 }, (_, i) =>
  (START_YEAR + i).toString()
);

// Load countries from CSV
function loadCountries() {
  const csvPath = path.join(__dirname, "country_rows.csv");

  if (!fs.existsSync(csvPath)) {
    console.error(
      "❌ country_rows.csv not found! Please place it in the scripts directory."
    );
    process.exit(1);
  }

  const csvContent = fs.readFileSync(csvPath, "utf8");
  const lines = csvContent.split("\n").slice(1); // Skip header

  return lines
    .filter((line) => line.trim())
    .map((line) => {
      const [code, name, numericCode] = line.split(",");
      return {
        code: code.trim(),
        name: name.trim().replace(/"/g, ""),
        numericCode: numericCode.trim(),
      };
    });
}

// Load products from CSV
function loadProducts() {
  const csvPath = path.join(__dirname, "product_rows.csv");

  if (!fs.existsSync(csvPath)) {
    console.error(
      "❌ product_rows.csv not found! Please place it in the scripts directory."
    );
    process.exit(1);
  }

  const csvContent = fs.readFileSync(csvPath, "utf8");
  const lines = csvContent.split("\n").slice(1); // Skip header

  return lines
    .filter((line) => line.trim())
    .map((line) => {
      // Remove carriage returns and handle CSV parsing
      const cleanLine = line.replace(/\r/g, "").trim();
      const match = cleanLine.match(/^([^,]+),(.+)$/);
      if (match) {
        return {
          code: match[1].trim(),
          name: match[2].trim().replace(/^"|"$/g, ""),
        };
      }
      return null;
    })
    .filter(Boolean);
}

// Parse XML using a simple regex approach
function extractTariffRateFromXml(xmlText) {
  const patterns = [
    /OBS_VALUE="([0-9.]+)"/i,
    /value="([0-9.]+)"/i,
    /rate="([0-9.]+)"/i,
    /average="([0-9.]+)"/i,
  ];

  for (const pattern of patterns) {
    const match = xmlText.match(pattern);
    if (match && match[1]) {
      const rate = parseFloat(match[1]);
      if (!isNaN(rate)) {
        return rate;
      }
    }
  }

  return null;
}

async function fetchWitsData() {
  console.log("\n========================================");
  console.log("Loading CSV files...");
  console.log("========================================\n");

  const COUNTRIES = loadCountries();
  const PRODUCTS = loadProducts();

  const totalRequests = COUNTRIES.length * PRODUCTS.length * YEARS.length;
  let currentRequest = 0;
  const allData = [];

  console.log(`Countries loaded: ${COUNTRIES.length}`);
  console.log(`Products loaded: ${PRODUCTS.length}`);
  console.log(`Years: ${YEARS.length} (${START_YEAR}-${END_YEAR})`);
  console.log(`Total API requests: ${totalRequests.toLocaleString()}`);
  console.log(
    `Estimated time: ~${Math.round((totalRequests * 0.5) / 60)} minutes`
  );
  console.log("========================================\n");

  const startTime = Date.now();

  for (let c = 0; c < COUNTRIES.length; c++) {
    const country = COUNTRIES[c];
    console.log(
      `\n[${c + 1}/${COUNTRIES.length}] ${country.code} - ${country.name}`
    );

    for (let p = 0; p < PRODUCTS.length; p++) {
      const product = PRODUCTS[p];

      // Show progress every 10 products
      if (p % 10 === 0) {
        process.stdout.write(
          `  Product ${p + 1}/${PRODUCTS.length}: ${product.code}...\n`
        );
      }

      for (const year of YEARS) {
        currentRequest++;
        const url = `https://wits.worldbank.org/API/V1/SDMX/V21/datasource/TRN/reporter/${country.numericCode}/partner/000/product/${product.code}/year/${year}/datatype/reported`;

        try {
          const response = await fetch(url);

          if (!response.ok) {
            continue;
          }

          const xmlText = await response.text();
          const tariffRate = extractTariffRateFromXml(xmlText);

          if (tariffRate !== null) {
            allData.push({
              importer_code: country.code,
              product_code: product.code,
              valid_from: `${year}-01-01`,
              valid_to: `${year}-12-31`,
              mfn_adval_rate: tariffRate,
              specific_rate_per_kg: null,
              country_name: country.name,
              product_name: product.name,
            });
          }

          // Delay to avoid overwhelming the API
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch {
          // Silent fail, continue
        }

        // Show progress every 100 requests
        if (currentRequest % 100 === 0) {
          const elapsed = (Date.now() - startTime) / 1000;
          const rate = currentRequest / elapsed;
          const remaining = (totalRequests - currentRequest) / rate;
          console.log(
            `  Progress: ${currentRequest}/${totalRequests} (${(
              (currentRequest / totalRequests) *
              100
            ).toFixed(1)}%) | Records: ${allData.length} | ETA: ${Math.round(
              remaining / 60
            )}min`
          );
        }
      }
    }
  }

  // Save to JSON file
  const outputDir = path.join(__dirname, "../data");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, "wits_tariff_data.json");
  fs.writeFileSync(outputPath, JSON.stringify(allData, null, 2));

  const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

  console.log("\n========================================");
  console.log(`✅ Data saved to: ${outputPath}`);
  console.log(`Total records: ${allData.length.toLocaleString()}`);
  console.log(`Total time: ${totalTime} minutes`);
  console.log("========================================\n");

  return allData;
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  fetchWitsData().catch(console.error);
}

export { fetchWitsData };
