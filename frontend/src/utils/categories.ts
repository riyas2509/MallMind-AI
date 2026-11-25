/**
 * Centralized Category Definitions, Aliases, and Flexible Matching
 * for MallMind AI (Nexus Ahmedabad One, Vastrapur, Ahmedabad).
 */

export interface CategoryMeta {
  name: string;
  slug: string;
  icon: string;
  badgeColor: string;
  description: string;
}

export const MALL_CATEGORIES: CategoryMeta[] = [
  {
    name: 'Apparel',
    slug: 'apparel',
    icon: '👔',
    badgeColor: '#24584A',
    description: 'European high-street fashion, denim, everyday casuals, and winter jackets.',
  },
  {
    name: 'Footwear',
    slug: 'footwear',
    icon: '👟',
    badgeColor: '#B58A52',
    description: 'Ergonomic runners, formal leather shoes, memory foam sneakers, and loafers.',
  },
  {
    name: 'Sportswear',
    slug: 'sportswear',
    icon: '🏃',
    badgeColor: '#276EF1',
    description: 'Performance training gear, marathon shoes, track pants, and dri-fit apparel.',
  },
  {
    name: 'Electronics',
    slug: 'electronics',
    icon: '💻',
    badgeColor: '#3B82F6',
    description: 'Flagship smartphones, Apple MacBooks, soundbars, cameras, and noise-cancelling headphones.',
  },
  {
    name: 'Dining & Food Court',
    slug: 'dining-food-court',
    icon: '🍽️',
    badgeColor: '#D97706',
    description: 'Artisanal coffees, gourmet burgers, footlong subs, dosas, and global quick-service dining.',
  },
  {
    name: 'Beauty & Cosmetics',
    slug: 'beauty-cosmetics',
    icon: '💄',
    badgeColor: '#EC4899',
    description: 'Prestige botanical skincare, lipsticks, cruelty-free body butters, and designer fragrances.',
  },
  {
    name: 'Ethnic Wear',
    slug: 'ethnic-wear',
    icon: '🥻',
    badgeColor: '#8B5CF6',
    description: 'Handcrafted artisan kurtas, bridal lehengas, silk bandhani, and royal wedding sherwanis.',
  },
  {
    name: 'Home Decor',
    slug: 'home-decor',
    icon: '🛋️',
    badgeColor: '#10B981',
    description: 'Modern living room furnishings, luxury velvet cushions, tableware, and interior lighting.',
  },
  {
    name: 'Toys & Games',
    slug: 'toys-games',
    icon: '🧸',
    badgeColor: '#F59E0B',
    description: 'Lego Technic sets, Barbie dolls, RC racing cars, and family board games.',
  },
  {
    name: 'Books & Stationery',
    slug: 'books-stationery',
    icon: '📚',
    badgeColor: '#6366F1',
    description: 'National bestsellers, business finance, Gujarati literature, journals, and art supplies.',
  },
  {
    name: 'Opticals',
    slug: 'opticals',
    icon: '👓',
    badgeColor: '#06B6D4',
    description: 'Acetate aviator sunglasses, prescription frames, blue-cut computer lenses, and eye care.',
  },
  {
    name: 'Watches & Accessories',
    slug: 'watches-accessories',
    icon: '⌚',
    badgeColor: '#0284C7',
    description: 'Precision chronograph watches, luxury analog timepieces, smart bands, and straps.',
  },
  {
    name: 'Bags & Accessories',
    slug: 'bags-accessories',
    icon: '🎒',
    badgeColor: '#64748B',
    description: 'Japanese lifestyle commuter backpacks, travel organizers, wallets, and plushies.',
  },
  {
    name: 'Hypermarket & Groceries',
    slug: 'hypermarket-groceries',
    icon: '🛒',
    badgeColor: '#059669',
    description: 'Royal basmati rice, organic cold-pressed oils, gourmet dry fruits, and pantry staples.',
  },
  {
    name: 'Pharmacy & Wellness',
    slug: 'pharmacy-wellness',
    icon: '💊',
    badgeColor: '#EF4444',
    description: 'Emergency first aid kits, digital health monitors, vitamins, and healthcare wellness.',
  },
  {
    name: 'Entertainment & Cinema',
    slug: 'entertainment-cinema',
    icon: '🎬',
    badgeColor: '#7C3AED',
    description: 'Cinepolis 9-screen IMAX multiplex theatre and Timezone bowling and VR arcade.',
  },
];

export const CATEGORY_NAMES: string[] = MALL_CATEGORIES.map((c) => c.name);

// Canonical alias dictionary to handle alternate spellings, combined labels, and slugs
const CATEGORY_ALIASES: Record<string, string> = {
  // Apparel
  'apparel': 'Apparel',
  'fashion': 'Apparel',
  'fashion & apparel': 'Apparel',
  'clothing': 'Apparel',
  'clothes': 'Apparel',

  // Footwear
  'footwear': 'Footwear',
  'shoes': 'Footwear',
  'footwear & sportswear': 'Footwear',

  // Sportswear
  'sportswear': 'Sportswear',
  'sports': 'Sportswear',
  'athletic': 'Sportswear',

  // Electronics
  'electronics': 'Electronics',
  'electronics & gadgets': 'Electronics',
  'gadgets': 'Electronics',
  'mobile & gadgets': 'Electronics',
  'tech': 'Electronics',

  // Dining
  'dining & food court': 'Dining & Food Court',
  'food court & dining': 'Dining & Food Court',
  'food & dining': 'Dining & Food Court',
  'dining': 'Dining & Food Court',
  'food': 'Dining & Food Court',
  'food court': 'Dining & Food Court',
  'restaurants': 'Dining & Food Court',

  // Beauty
  'beauty & cosmetics': 'Beauty & Cosmetics',
  'cosmetics': 'Beauty & Cosmetics',
  'beauty': 'Beauty & Cosmetics',

  // Home Decor
  'home decor': 'Home Decor',
  'home & living': 'Home Decor',
  'home': 'Home Decor',
  'furniture': 'Home Decor',

  // Toys & Games
  'toys & games': 'Toys & Games',
  'toys': 'Toys & Games',
  'games': 'Toys & Games',

  // Books
  'books & stationery': 'Books & Stationery',
  'books': 'Books & Stationery',
  'stationery': 'Books & Stationery',

  // Opticals
  'opticals': 'Opticals',
  'eyewear': 'Opticals',
  'sunglasses': 'Opticals',

  // Watches & Accessories
  'watches & accessories': 'Watches & Accessories',
  'watches': 'Watches & Accessories',
  'timepieces': 'Watches & Accessories',

  // Bags
  'bags & accessories': 'Bags & Accessories',
  'bags': 'Bags & Accessories',
  'accessories': 'Bags & Accessories',
  'luggage': 'Bags & Accessories',

  // Groceries
  'hypermarket & groceries': 'Hypermarket & Groceries',
  'groceries & supermarket': 'Hypermarket & Groceries',
  'hypermarket': 'Hypermarket & Groceries',
  'groceries': 'Hypermarket & Groceries',
  'grocery': 'Hypermarket & Groceries',
  'supermarket': 'Hypermarket & Groceries',

  // Pharmacy
  'pharmacy & wellness': 'Pharmacy & Wellness',
  'wellness & pharmacy': 'Pharmacy & Wellness',
  'pharmacy & health': 'Pharmacy & Wellness',
  'pharmacy': 'Pharmacy & Wellness',
  'health': 'Pharmacy & Wellness',
  'wellness': 'Pharmacy & Wellness',

  // Ethnic Wear
  'ethnic wear': 'Ethnic Wear',
  'traditional wear': 'Ethnic Wear',
  'indian wear': 'Ethnic Wear',
  'ethnic': 'Ethnic Wear',
  'traditional': 'Ethnic Wear',

  // Entertainment
  'entertainment & cinema': 'Entertainment & Cinema',
  'cinema & entertainment': 'Entertainment & Cinema',
  'multiplex & cinema': 'Entertainment & Cinema',
  'cinema': 'Entertainment & Cinema',
  'movies': 'Entertainment & Cinema',
  'entertainment': 'Entertainment & Cinema',
};

/**
 * Normalizes any category string (display label, alias, or slug) to the canonical category name.
 */
export function normalizeCategoryName(input?: string | null): string {
  if (!input) return '';
  const trimmed = input.trim();
  if (!trimmed || trimmed === 'ALL' || trimmed === 'All Categories') return '';

  const lower = trimmed.toLowerCase();

  // 1. Direct slug or name match
  for (const cat of MALL_CATEGORIES) {
    if (cat.slug === lower || cat.name.toLowerCase() === lower) {
      return cat.name;
    }
  }

  // 2. Direct alias match
  if (CATEGORY_ALIASES[lower]) {
    return CATEGORY_ALIASES[lower];
  }

  // 3. Normalized stripped match (ignoring hyphens, spaces, ampersands, punctuation)
  const clean = lower.replace(/[^a-z0-9]/g, '');
  for (const cat of MALL_CATEGORIES) {
    if (cat.slug.replace(/[^a-z0-9]/g, '') === clean) {
      return cat.name;
    }
    if (cat.name.toLowerCase().replace(/[^a-z0-9]/g, '') === clean) {
      return cat.name;
    }
  }

  for (const [alias, canonical] of Object.entries(CATEGORY_ALIASES)) {
    if (alias.replace(/[^a-z0-9]/g, '') === clean) {
      return canonical;
    }
  }

  return trimmed;
}

/**
 * Checks whether an item's category matches the target filter category,
 * supporting case-insensitivity, aliases, and slug variations.
 */
export function matchCategory(itemCategory?: string | null, filterCategory?: string | null): boolean {
  if (!filterCategory || filterCategory === 'ALL' || filterCategory === 'All Categories') {
    return true;
  }
  if (!itemCategory) {
    return false;
  }

  const normFilter = normalizeCategoryName(filterCategory).toLowerCase();
  const normItem = normalizeCategoryName(itemCategory).toLowerCase();

  if (normFilter === '' || normFilter === 'all' || normFilter === 'all categories') {
    return true;
  }

  if (normItem === normFilter) {
    return true;
  }

  // Handle cross-category multi-tags (e.g. 'Footwear & Sportswear' matching both 'Footwear' and 'Sportswear')
  const rawFilter = filterCategory.toLowerCase();
  if (rawFilter.includes('footwear & sportswear') && (normItem === 'footwear' || normItem === 'sportswear')) {
    return true;
  }
  if (rawFilter.includes('fashion & apparel') && (normItem === 'apparel' || normItem === 'ethnic wear')) {
    return true;
  }

  return false;
}
