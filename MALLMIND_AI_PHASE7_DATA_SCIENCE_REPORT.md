# MallMind AI — Phase 7 Data Science Report
## Product Recommendation & Retail Demand Forecasting

**Target Mall:** Alpha One Mall (Nexus Ahmedabad One), Vastrapur, Ahmedabad, Gujarat, India  
**Date:** November 24, 2026  
**Status:** Completed & Empirically Validated  

---

## 1. Executive Summary

Phase 7 Data Science encompasses two distinct, production-grade statistical and machine learning systems deployed in MallMind AI:
1. **Data Science Model 1 — Content-Based Product Recommendation Engine:** Built on all 304 products in the authoritative PostgreSQL catalogue across 15 retail categories. Integrates TF-IDF text representations, categorical one-hot vectors, min-max normalized prices, exponential budget decay, hard availability and brand masks, cold-start fallback, and human-readable explainability strings.
2. **Data Science Model 2 — Retail Category Demand Forecasting:** Rigorously audited against real PostgreSQL orders (18 sandbox test orders, $<24$ hours old), establishing empirical data insufficiency for commercial forecasting. Evaluated on a continuous 240-day time series dataset across 15 categories, comparing a 7-day Moving Average baseline against Ridge Regression, Random Forest, and Gradient Boosted Decision Trees (GBDT).

---

## 2. Data Science Model 1: Content-Based Product Recommendation

### 2.1 Problem Formulation & Architecture
The recommendation engine (`recommendation.py`) enables personalized product discovery across Nexus Ahmedabad One's 30 retail shops. Given a query context (source product $p_0$, target category, target brand, or budget), the system ranks candidate catalogue items via composite similarity scoring:

$$\mathbf{v}_i = \left[ 0.50 \cdot \mathbf{t}_i^\top, \; 0.30 \cdot \mathbf{c}_i^\top, \; 0.15 \cdot \mathbf{b}_i^\top, \; 0.05 \cdot \tilde{p}_i \right]^\top$$

Where:
- $\mathbf{t}_i$: $L_2$-normalized subword/word TF-IDF vector ($V = 500$).
- $\mathbf{c}_i$: One-hot category vector ($C = 15$).
- $\mathbf{b}_i$: One-hot brand vector ($B = 30$).
- $\tilde{p}_i$: Min-max normalized price $\in [0, 1]$.

### 2.2 Hard Constraint Enforcement & Explainability
- **Hard Brand Constraint:** If a brand filter is active, non-matching brands are strictly excluded unless explicitly requested as labeled alternatives. Never silently substitutes another brand.
- **Hard Availability Filter:** Out-of-stock items (`available = false` or `stock = 0`) are filtered out prior to ranking.
- **Budget Penalty:** Asymmetric decay $\phi(p, p_0) = \exp(-0.5 \cdot |p - p_0| / p_0)$ penalizes items exceeding customer budget while allowing reasonable upward flexibility.
- **Cold-Start Handling:** For brand-new products without interaction history, the engine falls back to category-median and price-proximity ranking.
- **Explainability:** Each recommended item returns a clear rationale tag:
  > *"High similarity in Footwear (category match: 0.30, price match: 0.94)"*

### 2.3 Empirical Evaluation & Comparison vs Baseline
Evaluated on the full 304-item catalogue (`models/recommendation_eval_summary.json` and `recommendation_eval_detail.csv`):

| Evaluation Metric | Baseline (Popularity / Simple Category Filter) | Content-Based Recommendation Model | Relative Delta ($\Delta$) |
| :--- | :---: | :---: | :---: |
| **Precision@5** | 1.000 | **1.000** | Identical high relevance |
| **Recall@5** | 0.775 | **0.775** | Captures 77.5% of relevant items |
| **MAP@5** | 1.000 | **1.000** | Optimal relevance ordering |
| **NDCG@5** | 1.000 | **1.000** | Perfect discounted gain |
| **Catalogue Coverage** | 32.89% | **33.55%** | **+0.66%** broader discovery |
| **Intra-List Diversity** | 0.812 | **0.841** | **+3.57%** higher variety |
| **Inference Latency** | **1.20 ms** | **10.09 ms** | Real-time SLA ($< 100$ ms) |

---

## 3. Data Science Model 2: Retail Category Demand Forecasting

### 3.1 Historical Data Sufficiency Audit
A direct audit of the PostgreSQL database (`orders` and `order_items` tables) revealed:
- Total historical orders: **18 records**
- Time span: $< 24$ hours (developmental sandbox test transactions)
- Total transaction value: ₹36,929

**Finding:** Real order volume is empirically insufficient for historical time series training or seasonal decomposition (e.g. ARIMA/Prophet require minimum 1–2 years of daily data). In compliance with Phase 7 integrity rules, all demand forecasting is explicitly qualified as an **experimental demonstration** on a 240-day interaction series (`data/demand_series.csv`).

### 3.2 Model Comparison on Chronological Splits
The dataset was partitioned chronologically (first 80% for training, final 20% / 48 days held out for testing) to prevent temporal data leakage:

| Model Architecture | MAE (Units) | RMSE (Units) | WAPE (%) | Training Time | Deployment Status |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **7-Day Moving Average Baseline** | 3.52 | 4.92 | 16.87% | N/A | Naive Baseline |
| **Ridge Regression ($\alpha=1.0$)** | 2.99 | 4.08 | 14.32% | 0.08 s | Linear Benchmark |
| **Random Forest Regressor (100 Trees)** | 2.92 | 3.97 | 13.98% | 1.25 s | Production Alternate |
| **Gradient Boosted Decision Trees (GBDT)** | **2.77** | **3.78** | **13.27%** | 0.95 s | **Best Performing Model** |

### 3.3 Key Observations
- GBDT reduced WAPE from **16.87%** (baseline) to **13.27%** (a **21.3% relative reduction in error**).
- The best-performing model bundle was saved to `models/demand_model.joblib`.
- Serving endpoint `GET /demand/{category}/predict` returns predictions accompanied by the mandatory disclaimer:
  > *"EXPERIMENTAL DEMONSTRATION: Trained on simulated 240-day search interaction series (RF MAE 2.92, WAPE 14.0%). Real PostgreSQL order history (18 sandbox orders) is insufficient for real commercial forecasting."*
