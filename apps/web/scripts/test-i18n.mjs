#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, "..");
const srcDir = path.join(webRoot, "src");
const i18nPath = path.join(srcDir, "lib", "i18n-context.tsx");

console.log("=== PolicyPilot i18n Automated Coverage & Completeness Test ===");

if (!fs.existsSync(i18nPath)) {
  console.error(`ERROR: i18n file not found at ${i18nPath}`);
  process.exit(1);
}

const i18nContent = fs.readFileSync(i18nPath, "utf-8");

// Extract UI_STRINGS block
const startAnchor = "export const UI_STRINGS: Record<string, Record<LanguageCode, string>> = {";
const endAnchor = "export const LOCALIZED_SCHEME_MAP";

const startIndex = i18nContent.indexOf(startAnchor);
const endIndex = i18nContent.indexOf(endAnchor);

if (startIndex === -1 || endIndex === -1) {
  console.error("ERROR: Failed to extract UI_STRINGS from i18n-context.tsx");
  process.exit(1);
}

const uiStringsBlock = i18nContent.slice(startIndex + startAnchor.length, endIndex);

// Parse keys and language coverage from UI_STRINGS block
const entryRegex = /^\s*["']([^"']+)["']:\s*\{([^}]+)\}/gm;
const dictionary = new Map();
let m;

while ((m = entryRegex.exec(uiStringsBlock)) !== null) {
  const key = m[1];
  const body = m[2];
  const langValues = {};
  for (const lang of ["en", "te", "hi", "ur"]) {
    const lMatch = body.match(new RegExp(`["']${lang}["']:\\s*["']([^"']*)["']`));
    if (lMatch) {
      langValues[lang] = lMatch[1];
    }
  }
  dictionary.set(key, langValues);
}

console.log(`Indexed ${dictionary.size} keys from UI_STRINGS`);

// Validate 4-language completeness
const requiredLangs = ["en", "te", "hi", "ur"];
const incompleteEntries = [];

for (const [key, langs] of dictionary.entries()) {
  for (const l of requiredLangs) {
    if (!langs[l] || langs[l].trim() === "") {
      incompleteEntries.push({ key, lang: l });
    }
  }
}

if (incompleteEntries.length > 0) {
  console.error(`FAIL: Found ${incompleteEntries.length} incomplete or empty language translations:`);
  for (const item of incompleteEntries.slice(0, 10)) {
    console.error(`  - Key "${item.key}" is missing translation for "${item.lang}"`);
  }
  process.exit(1);
}
console.log(`PASS: All ${dictionary.size} dictionary entries contain non-empty translations for en, te, hi, and ur.`);

// Scan all source code files for t("key") or t('key')
const tCallRegex = /\bt\(\s*["']([^"']+)["']/g;
const usedKeys = new Map();

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDir(fullPath);
    } else if (file.endsWith(".tsx") || file.endsWith(".ts")) {
      const content = fs.readFileSync(fullPath, "utf-8");
      let match;
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        while ((match = tCallRegex.exec(line)) !== null) {
          const k = match[1];
          if (!usedKeys.has(k)) {
            usedKeys.set(k, []);
          }
          usedKeys.get(k).push(`${path.relative(srcDir, fullPath)}:${i + 1}`);
        }
      }
    }
  }
}

scanDir(srcDir);
console.log(`Found ${usedKeys.size} unique translation keys referenced in UI source code.`);

// Audit used keys against dictionary
const missingKeys = [];
for (const [key, locations] of usedKeys.entries()) {
  const isDirect = dictionary.has(key);
  const isDotted = key.includes("_") && dictionary.has(key.replace(/_/g, "."));
  const isUnderscored = key.includes(".") && dictionary.has(key.replace(/\./g, "_"));

  if (!isDirect && !isDotted && !isUnderscored) {
    missingKeys.push({ key, loc: locations[0] });
  }
}

if (missingKeys.length > 0) {
  console.error(`FAIL: Found ${missingKeys.length} unmapped translation keys in source code:`);
  for (const item of missingKeys) {
    console.error(`  - Key "${item.key}" at ${item.loc} not found in dictionary!`);
  }
  process.exit(1);
}

console.log(`PASS: 100% of the ${usedKeys.size} referenced keys resolve accurately in all 4 languages!`);
console.log("=== All i18n checks PASSED successfully ===");
process.exit(0);
