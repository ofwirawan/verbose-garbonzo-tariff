/**
 * Generate SQL seed file from WITS data JSON
 * Run with: node scripts/generateSeedFile.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function generateSeedFile() {
  // Read the JSON data file
  const dataPath = path.join(__dirname, "../data/wits_tariff_data.json");

  if (!fs.existsSync(dataPath)) {
    console.error("❌ Error: wits_tariff_data.json not found!");
    console.log("Please run: node scripts/fetchWitsData.mjs first");
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));

  console.log(`Found ${data.length} records`);

  // Generate SQL INSERT statements
  let sql = `-- WITS Tariff Data Seed File
-- Generated: ${new Date().toISOString()}
-- Records: ${data.length}

`;

  // Create the SQL insert statements in batches
  const batchSize = 100;
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);

    sql += `-- Batch ${Math.floor(i / batchSize) + 1}\n`;
    sql += `INSERT INTO measure (importer_code, product_code, valid_from, valid_to, mfn_adval_rate, specific_rate_per_kg)
VALUES\n`;

    const values = batch
      .map((record) => {
        return `  ('${record.importer_code}', '${record.product_code}', '${
          record.valid_from
        }', '${record.valid_to}', ${record.mfn_adval_rate}, ${
          record.specific_rate_per_kg || "NULL"
        })`;
      })
      .join(",\n");

    sql += values;
    sql += `\nON CONFLICT (importer_code, product_code, valid_from) DO UPDATE
  SET mfn_adval_rate = EXCLUDED.mfn_adval_rate,
      valid_to = EXCLUDED.valid_to;\n\n`;
  }

  // Save seed file
  const seedDir = path.join(__dirname, "../supabase/seeds");
  if (!fs.existsSync(seedDir)) {
    fs.mkdirSync(seedDir, { recursive: true });
  }

  const seedPath = path.join(seedDir, "wits_tariff_data.sql");
  fs.writeFileSync(seedPath, sql);

  console.log(`✅ Seed file generated: ${seedPath}`);
  console.log(`\nTo seed your Supabase database:`);
  console.log(`1. Copy the SQL file content`);
  console.log(`2. Run it in your Supabase SQL Editor`);
  console.log(`   OR`);
  console.log(`3. Use: psql YOUR_DATABASE_URL < ${seedPath}`);
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  generateSeedFile();
}

export { generateSeedFile };
