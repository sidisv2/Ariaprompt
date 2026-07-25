import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_DIR = path.resolve(__dirname, '../src');
const LOCALES_DIR = path.resolve(__dirname, '../src/locales');

// Load JSON translation files
const esJson = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, 'es/translation.json'), 'utf-8'));
const enJson = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, 'en/translation.json'), 'utf-8'));
const ptJson = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, 'pt/translation.json'), 'utf-8'));

// Helper to flatten nested JSON object into dot-notation keys
function getFlattenedKeys(obj: any, prefix = ''): Set<string> {
  let keys = new Set<string>();
  for (const k in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, k)) {
      const fullKey = prefix ? `${prefix}.${k}` : k;
      if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
        const childKeys = getFlattenedKeys(obj[k], fullKey);
        childKeys.forEach((ck) => keys.add(ck));
      } else {
        keys.add(fullKey);
      }
    }
  }
  return keys;
}

const esKeys = getFlattenedKeys(esJson);
const enKeys = getFlattenedKeys(enJson);
const ptKeys = getFlattenedKeys(ptJson);

// Recursively find all .ts and .tsx files in src/
function getAllSourceFiles(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllSourceFiles(filePath));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(filePath);
    }
  });
  return results;
}

const sourceFiles = getAllSourceFiles(SRC_DIR);

// Regex patterns to capture t('key.path') or t("key.path") or t(`key.path`)
// Also handles options object, e.g. t('key', { count: 2 })
const tKeyRegex = /\bt\(\s*['"`]([a-zA-Z0-9_.\-]+)['"`]/g;

const usedKeysInCode = new Set<{ key: string; file: string }>();
const usedKeysSet = new Set<string>();

sourceFiles.forEach((file) => {
  const content = fs.readFileSync(file, 'utf-8');
  let match;
  while ((match = tKeyRegex.exec(content)) !== null) {
    const key = match[1];
    // Ignore dynamic key patterns or variables if any
    if (key && !key.includes('${')) {
      usedKeysInCode.add({ key, file: path.relative(SRC_DIR, file) });
      usedKeysSet.add(key);
    }
  }
});

console.log('====================================================');
console.log('🔍 I18N AUDIT REPORT FOR ARIA PROP');
console.log('====================================================');
console.log(`📁 Source files scanned: ${sourceFiles.length}`);
console.log(`🔑 Total unique i18n keys referenced in code: ${usedKeysSet.size}`);
console.log(`🇪🇸 Total keys in es/translation.json: ${esKeys.size}`);
console.log(`🇺🇸 Total keys in en/translation.json: ${enKeys.size}`);
console.log(`🇧🇷 Total keys in pt/translation.json: ${ptKeys.size}`);
console.log('====================================================');

const missingInEs: string[] = [];
const missingInEn: string[] = [];
const missingInPt: string[] = [];

usedKeysSet.forEach((key) => {
  if (!esKeys.has(key)) missingInEs.push(key);
  if (!enKeys.has(key)) missingInEn.push(key);
  if (!ptKeys.has(key)) missingInPt.push(key);
});

console.log('\n❌ MISSING KEYS IN ES (Spanish):', missingInEs.length);
missingInEs.forEach((k) => console.log(`   - ${k}`));

console.log('\n❌ MISSING KEYS IN EN (English):', missingInEn.length);
missingInEn.forEach((k) => console.log(`   - ${k}`));

console.log('\n❌ MISSING KEYS IN PT (Portuguese):', missingInPt.length);
missingInPt.forEach((k) => console.log(`   - ${k}`));

console.log('\n====================================================');

if (missingInEs.length === 0 && missingInEn.length === 0 && missingInPt.length === 0) {
  console.log('🎉 PERFECT! 100% of i18n keys used in code are defined in ES, EN, and PT!');
  process.exit(0);
} else {
  console.log('⚠️ Action required: Fill missing keys in translation files.');
  process.exit(1);
}
