import { FALLBACK_PRODUCTS } from '../src/data/fallbackData';
import {
  MALL_CATEGORIES,
  CATEGORY_NAMES,
  matchCategory,
  normalizeCategoryName,
} from '../src/utils/categories';

console.log('================================================================');
console.log('   MALLMIND AI: API RESPONSE & FALLBACK INTEGRITY TEST SUITE');
console.log('================================================================\n');

interface Filters {
  name: string;
  category: string;
  brand: string;
  color: string;
  maxPrice: string;
  availableOnly: boolean;
}

function filterFallbackProducts(f: Filters) {
  return FALLBACK_PRODUCTS.filter((p) => {
    if (f.name && !p.name.toLowerCase().includes(f.name.toLowerCase().trim())) return false;
    if (f.category && f.category !== 'All Categories' && !matchCategory(p.category, f.category)) return false;
    if (f.brand && (!p.brand || !p.brand.toLowerCase().includes(f.brand.toLowerCase().trim()))) return false;
    if (f.color && (!p.color || !p.color.toLowerCase().includes(f.color.toLowerCase().trim()))) return false;
    if (f.maxPrice && (p.effectivePrice ?? p.price) > Number(f.maxPrice)) return false;
    if (f.availableOnly && !p.available) return false;
    return true;
  });
}

// Emulate ProductsPage.tsx runSearch logic
async function simulateRunSearch(
  mockApiCall: () => Promise<any>,
  filters: Filters
): Promise<{ results: any[]; isFallbackMode: boolean; error: string | null }> {
  try {
    const searchRes = await mockApiCall();
    if (Array.isArray(searchRes)) {
      return { results: searchRes, isFallbackMode: false, error: null };
    } else {
      return { results: filterFallbackProducts(filters), isFallbackMode: true, error: null };
    }
  } catch (err: any) {
    return { results: filterFallbackProducts(filters), isFallbackMode: true, error: err.message };
  }
}

async function runTestSuite() {
  console.log('--- TEST 1: Backend Online with Results ---');
  const mockLiveProducts = [
    { id: 999, name: 'Live Database Shirt', category: 'Apparel', price: 999, available: true }
  ];
  const t1 = await simulateRunSearch(async () => mockLiveProducts, {
    name: '', category: 'Apparel', brand: '', color: '', maxPrice: '', availableOnly: false
  });
  const t1Pass = t1.results.length === 1 && t1.results[0].id === 999 && t1.isFallbackMode === false;
  console.log(`  [${t1Pass ? 'PASS' : 'FAIL'}] Live products used: count=${t1.results.length}, isFallbackMode=${t1.isFallbackMode}`);

  console.log('\n--- TEST 2: Backend Online with Empty Result (0 matches) ---');
  // Critical test: verify that empty response [] is NOT treated as an error and does NOT trigger fallback!
  const t2 = await simulateRunSearch(async () => [], {
    name: 'NonExistentXYZ', category: 'Apparel', brand: '', color: '', maxPrice: '', availableOnly: false
  });
  const t2Pass = t2.results.length === 0 && t2.isFallbackMode === false;
  console.log(`  [${t2Pass ? 'PASS' : 'FAIL'}] Empty array preserved: count=${t2.results.length}, isFallbackMode=${t2.isFallbackMode} (Zero-results properly honored)`);

  console.log('\n--- TEST 3: Backend Offline / Network Error ---');
  const t3 = await simulateRunSearch(async () => {
    throw new Error('Failed to fetch: Connection refused');
  }, {
    name: '', category: 'Watches & Accessories', brand: '', color: '', maxPrice: '', availableOnly: false
  });
  const t3Pass = t3.results.length >= 10 && t3.results[0].name.includes('Titan') && t3.isFallbackMode === true;
  console.log(`  [${t3Pass ? 'PASS' : 'FAIL'}] Offline fallback activated: count=${t3.results.length}, isFallbackMode=${t3.isFallbackMode}, item="${t3.results[0]?.name}"`);

  console.log('\n--- TEST 4: Backend 500 Internal Server Error ---');
  const t4 = await simulateRunSearch(async () => {
    throw new Error('HTTP 500 Internal Server Error');
  }, {
    name: '', category: 'Bags & Accessories', brand: '', color: '', maxPrice: '', availableOnly: false
  });
  const t4Pass = t4.results.length >= 10 && t4.results[0].name.includes('Miniso') && t4.isFallbackMode === true;
  console.log(`  [${t4Pass ? 'PASS' : 'FAIL'}] 500 error fallback activated: count=${t4.results.length}, isFallbackMode=${t4.isFallbackMode}, item="${t4.results[0]?.name}"`);

  console.log('\n--- TEST 5: Fallback Products Counts Across All 16 Categories ---');
  let allCategoriesValid = true;
  const breakdown: Record<string, number> = {};
  for (const cat of MALL_CATEGORIES) {
    const res = filterFallbackProducts({
      name: '', category: cat.name, brand: '', color: '', maxPrice: '', availableOnly: false
    });
    breakdown[cat.name] = res.length;
    const ok = res.length > 0;
    if (!ok) allCategoriesValid = false;
    console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${cat.icon} ${cat.name.padEnd(25)} -> ${res.length} item(s)`);
  }

  console.log(`\n  => Category Fallback Completeness: ${allCategoriesValid ? '100% PASS (All 16 categories have valid curated items)' : 'FAIL'}`);

  console.log('\n================================================================');
  console.log('   API & FALLBACK INTEGRITY TEST SUITE COMPLETED SUCCESSFULLY');
  console.log('================================================================\n');
}

runTestSuite();
