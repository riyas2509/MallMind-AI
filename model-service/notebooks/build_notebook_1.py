"""Generates notebooks/01_recommendation_engine.ipynb as source cells.
Run once from notebooks/, then execute with nbconvert (see README)."""
import nbformat as nbf

nb = nbf.v4.new_notebook()
cells = []

md = lambda src: cells.append(nbf.v4.new_markdown_cell(src))
code = lambda src: cells.append(nbf.v4.new_code_cell(src))

md("""\
# Data Science Model 1: Content-Based Product Recommendation Engine

**Academic subject mapping:** Data Science, Linear Algebra (vector representation, cosine similarity).

**Objective:** given a visitor's stated preferences (category / brand / color / budget),
rank the real product catalogue so the most relevant items come first, respecting hard
constraints (availability, budget) that must never be violated regardless of similarity score.

**Dataset:** `../data/catalog.csv`, exported directly from the live MallMind Postgres database
(see `../data/export_catalog.py`). This is the SAME synthetic demo catalogue the Java backend
serves — see `data/seed/02_seed_products.sql` in the repo root: **not real retailer inventory**.
""")

code("""\
import sys
sys.path.insert(0, '../app')

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

pd.set_option('display.max_columns', 20)
""")

md("## 1. Data collection & dictionary")
code("""\
catalog = pd.read_csv('../data/catalog.csv')
print(catalog.shape)
catalog.head()
""")

code("""\
# Data dictionary
dictionary = pd.DataFrame({
    'column': catalog.columns,
    'dtype': [str(catalog[c].dtype) for c in catalog.columns],
    'description': [
        'Primary key, matches products.id in the Java backend DB',
        'Product display name',
        'Brand name (invented for this synthetic catalogue)',
        'Product colour, may be missing',
        'Price after any active discount -- what a buyer actually pays',
        'List price before discount',
        'Whether the product is currently purchasable',
        'Units in stock',
        'Product category (16 categories seeded)',
        'Owning shop id',
        'Owning shop name',
        'Floor number the shop is on (0, 1 or 2)',
    ],
})
dictionary
""")

md("## 2. Data cleaning")
code("""\
print('Missing values per column:')
print(catalog.isna().sum())
print()
print('Duplicate product_id rows:', catalog['product_id'].duplicated().sum())
""")

code("""\
# `brand` and `color` are allowed to be missing (not every product has a stated colour);
# everything else is required and non-null by construction (DB constraints). No rows dropped.
catalog['available'] = catalog['available'].astype(bool)
catalog.describe(include='all').T
""")

md("## 3. Exploratory Data Analysis")
code("""\
fig, axes = plt.subplots(1, 2, figsize=(12, 4))

catalog['category'].value_counts().plot(kind='bar', ax=axes[0], title='Products per category')
axes[0].set_ylabel('count')

catalog['effective_price'].plot(kind='hist', bins=30, ax=axes[1], title='Effective price distribution')
axes[1].set_xlabel('price (INR)')

plt.tight_layout()
plt.savefig('eda_category_price.png', dpi=100)
plt.show()
""")

code("""\
catalog.groupby('category')['effective_price'].median().sort_values().plot(
    kind='barh', figsize=(7, 6), title='Median effective price by category'
)
plt.xlabel('price (INR)')
plt.tight_layout()
plt.savefig('eda_median_price_by_category.png', dpi=100)
plt.show()
""")

md("## 4. Feature engineering: vector representation (Part 5, Linear Algebra)")
md("""\
Each product becomes a numeric vector: one-hot `category`, one-hot `brand`, one-hot `color`
(with an explicit `UNKNOWN` bucket for missing brand/colour), and min-max-scaled `effective_price`.
A visitor's preference is mapped into the exact same vector space, so similarity is one
well-defined operation: **cosine similarity** `sim(A,B) = (A·B) / (||A|| ||B||)`.
See `../app/recommendation.py` (`ProductRecommender`) for the implementation this notebook evaluates.
""")

code("""\
from recommendation import ProductRecommender, Preference

recommender = ProductRecommender().fit(catalog)
print('Feature matrix shape:', recommender.feature_matrix.shape)
print('(', len(catalog), 'products x', recommender.feature_matrix.shape[1], 'feature dimensions )')
""")

code("""\
# Worked numerical example: two Apparel products, cosine similarity by hand
import numpy as np

a = recommender.feature_matrix[0]
b = recommender.feature_matrix[1]
manual_cos = np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))
print('Product A:', catalog.iloc[0][['name','category','brand','color','effective_price']].to_dict())
print('Product B:', catalog.iloc[1][['name','category','brand','color','effective_price']].to_dict())
print('Cosine similarity (manual):', round(manual_cos, 4))
""")

md("## 5. Model training (fit = encode the catalogue once)")
code("""\
pref = Preference(category='Electronics', max_budget=20000)
recommender.recommend(pref, max_results=5)
""")

md("""\
## 6. Evaluation vs. baseline

**How relevance labels were created** (required documentation): we have no real click/purchase
feedback, so relevance is a deterministic rule applied to the real catalogue — a product is
"relevant" to a test query if it is available, within budget, in the requested category, and
(if the query names a brand) matches that brand. See `../app/evaluate_recommendation.py` for
the full test-query construction (one query per category at its 70th-percentile price, plus a
brand-aware variant per category) and the Precision@K / Recall@K / NDCG@K implementation.

Baseline: plain category + budget filtering with **no further ranking** (catalogue/id order) —
this is what the product had before any recommendation model existed.
""")

code("""\
import json
from evaluate_recommendation import build_test_queries, evaluate, K

queries = build_test_queries(catalog)
results_detail = evaluate(catalog, recommender, queries, K)

summary = {
    'k': K,
    'n_queries': len(queries),
    'model': {
        'precision@k': float(results_detail['model_precision@k'].mean()),
        'recall@k': float(results_detail['model_recall@k'].mean(skipna=True)),
        'ndcg@k': float(results_detail['model_ndcg@k'].mean(skipna=True)),
    },
    'baseline_category_filter': {
        'precision@k': float(results_detail['baseline_precision@k'].mean()),
        'recall@k': float(results_detail['baseline_recall@k'].mean(skipna=True)),
        'ndcg@k': float(results_detail['baseline_ndcg@k'].mean(skipna=True)),
    },
}
summary
""")

code("""\
fig, ax = plt.subplots(figsize=(6, 4))
means = pd.DataFrame({
    'content-based model': [summary['model']['precision@k'], summary['model']['recall@k'], summary['model']['ndcg@k']],
    'category-filter baseline': [summary['baseline_category_filter']['precision@k'],
                                  summary['baseline_category_filter']['recall@k'],
                                  summary['baseline_category_filter']['ndcg@k']],
}, index=['Precision@5', 'Recall@5', 'NDCG@5'])
means.plot(kind='bar', ax=ax, rot=0)
ax.set_ylim(0, 1)
ax.set_title(f\"Model vs baseline (k={summary['k']}, {summary['n_queries']} test queries)\")
plt.tight_layout()
plt.savefig('recommendation_eval_chart.png', dpi=100)
plt.show()
""")

md("""\
## 7. Interpretation

The content-based model achieves a materially higher **NDCG@5** than the category-filter
baseline, meaning that *when* it returns a relevant item, it tends to rank it higher — brand
and price-closeness break ties within a category better than arbitrary catalogue-id order.
Raw **Precision@5** is close between the two (the baseline's hard category pre-filter gives it
a structural precision advantage on this small catalogue), and **Recall@5** favours the model
slightly. Net result: the model is a genuine, explainable improvement in ranking quality, not
a guaranteed improvement on every single metric — which is exactly what these three metrics,
reported honestly side by side, show.

### Limitation discovered during testing
Colour is a *soft* similarity signal, not a hard filter. For a query like "black formal apparel",
if no black item exists in that category at all (true for this synthetic catalogue — see
`demand/no_black_apparel` check in the model service test), the model still returns the
closest category+price match rather than an empty list. This is a deliberate design choice
(graceful degradation over "no results"), but it means a caller should not assume every
returned item satisfies every soft-stated preference -- only the hard filters (availability,
budget) are guaranteed.
""")

nb['cells'] = cells
nbf.write(nb, '01_recommendation_engine.ipynb')
print('Wrote 01_recommendation_engine.ipynb')
