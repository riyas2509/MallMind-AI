import { FALLBACK_PRODUCTS, FALLBACK_SHOPS } from '../src/data/fallbackData';
import {
  MALL_CATEGORIES,
  CATEGORY_NAMES,
  matchCategory,
  normalizeCategoryName,
} from '../src/utils/categories';

console.log('================================================================');
console.log('       MALLMIND AI: COMPREHENSIVE CATALOGUE INTEGRITY AUDIT');
console.log('================================================================\n');

// 1. Audit Product IDs and Basic Attributes
console.log('--- 1. AUDIT OF ALL 25 CURATED DEMONSTRATION PRODUCTS ---');
const ids = new Set<number>();
const duplicates: number[] = [];
let allValid = true;

const categoryProductCounts: Record<string, number> = {};
MALL_CATEGORIES.forEach((c) => (categoryProductCounts[c.name] = 0));

FALLBACK_PRODUCTS.forEach((p, idx) => {
  if (ids.has(p.id)) duplicates.push(p.id);
  ids.add(p.id);

  // Check matching shop in FALLBACK_SHOPS
  const shop = FALLBACK_SHOPS.find((s) => s.id === p.shopId);
  const shopFloorMatches = shop ? shop.floorNumber === p.shopFloorNumber : false;

  const validPrice = typeof p.price === 'number' && p.price > 0;
  const validImage = typeof p.imageUrl === 'string' && p.imageUrl.startsWith('http');
  const canonicalCategory = normalizeCategoryName(p.category);
  const isCanonical = canonicalCategory === p.category;

  if (!isCanonical || !validPrice || !validImage) {
    allValid = false;
  }

  console.log(
    `[Item ${String(p.id).padStart(2)}] Category: "${p.category}" ${isCanonical ? '✓' : '✗ (Non-canonical!)'}`
  );
  console.log(`         Name:  ${p.name}`);
  console.log(`         Brand: ${p.brand || 'N/A'} | Color: ${p.color || 'N/A'}`);
  console.log(`         Price: ₹${p.price} (Discount: ₹${p.discountPrice ?? 'None'}, Effective: ₹${p.effectivePrice ?? p.price})`);
  console.log(`         Shop:  "${p.shopName}" (ID: ${p.shopId}, Floor: ${p.shopFloorNumber}) ${shop ? '✓ Exists' : '✗ Not in FALLBACK_SHOPS'} | Floor Match: ${shopFloorMatches ? '✓' : '✗'}`);
  console.log(`         Avail: ${p.available} | Image: ${validImage ? '✓ Valid URL' : '✗ Invalid'}`);
  console.log('----------------------------------------------------------------');
});

console.log(`\nProduct ID Count: ${ids.size} unique IDs out of ${FALLBACK_PRODUCTS.length} records.`);
console.log(`Duplicate IDs: ${duplicates.length > 0 ? duplicates.join(', ') : 'NONE (100% Unique)'}`);

// 2. Cross-Category Leak Check
console.log('\n--- 2. CROSS-CATEGORY LEAK AUDIT (Checking for unexpected matches) ---');
MALL_CATEGORIES.forEach((cat) => {
  const matching = FALLBACK_PRODUCTS.filter((p) => matchCategory(p.category, cat.name));
  console.log(`Category: "${cat.name}" -> ${matching.length} product(s)`);
  matching.forEach((m) => {
    const isDirectMatch = m.category.toLowerCase() === cat.name.toLowerCase();
    console.log(`   - [ID ${m.id}] "${m.name}" (Direct Category: "${m.category}") ${isDirectMatch ? '✓ Exact' : '⚠ Cross-matched'}`);
  });
});
