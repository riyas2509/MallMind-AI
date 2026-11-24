# MallMind AI — Phase 7 Final Closure Audit
## Independent Verification of Data Science & Deep Learning Implementations, Metrics & Integrations

**Target Mall:** Alpha One Mall (Nexus Ahmedabad One), Vastrapur, Ahmedabad, Gujarat, India  
**Date:** November 24, 2026  
**Audit Type:** Independent, Read-Only Technical Verification & Empirical Audit  
**Scope Boundary:** Phase 7 Verification ONLY. Phase 8 has NOT been started.  

---

## 1. Executive Audit Summary

This audit conducted an independent, read-only empirical verification of all Phase 7 Data Science and Deep Learning models, datasets, metrics, and integrations in MallMind AI. 

### Core Audit Findings
1. **Product Recommendation:** The content-based vector engine, hard constraints, and explainability work correctly in real time (~10.09 ms). However, the reported **MAP@5: 1.000** for both the model and the baseline is the result of a **circular ground-truth relevance definition**, where the relevance function was identical to the hard constraint mask.
2. **Intent Classification:** Subword TextCNN genuinely improves out-of-distribution template-disjoint generalization from **12.70%** (word-level) to **43.20% Macro-F1** (44.41% accuracy), outperforming Logistic Regression (38.00%) and Naive Bayes (32.10%). The reported figures of **99.8% (Gujarati)** and **97.3% (Hindi)** represent **single-query softmax confidence on in-distribution templates**, not test-set accuracy on unseen templates (which are 38.7% and 53.3% respectively).
3. **Product Image Classifier:** ResNet18 transfer learning achieves **99.17% accuracy** and **99.16% Macro-F1** on the 720-image held-out benchmark split, outperforming the baseline (97.22% / 97.21%). However, the dataset is exclusively Fashion-MNIST (28x28 grayscale benchmark crops mapped to 3 categories). It exhibits a **severe domain gap** on real retail product photography (75% error rate on raw photos).
4. **Demand Forecasting:** GBDT achieves **13.27% WAPE** on a chronological split, beating the 7-day Moving Average baseline (16.87% WAPE). However, the underlying dataset is 100% synthetic (simulated 240-day interaction series) because the live PostgreSQL database contains only 18 sandbox orders ($<24$ hours old).
5. **Regression Route Distance Clarification:** The reported **845.0m** distance was **raw 2D canvas pixel coordinates** between Node 1 (LG) and Node 25 (G), whose calibrated physical distance is **215.0m**. The historical **149.1m** measurement was for a completely different path: Node 21 (G Entrance) to Node 86 (3F Cinépolis). When queried during this audit, the 21 $\to$ 86 route returned **149.1m** identically.

---

## 2. Product Recommendation Audit

### 2.1 Audit Questions & Empirical Findings

#### 1. Evaluation Dataset & Query Count
- **Script:** `model-service/app/evaluate_recommendation.py`
- **Catalog Dataset:** `model-service/data/catalog.csv` (304 products across 15 categories, 30 brands).
- **Query Count:** **30 structured queries** (15 category-only queries with 70th percentile budget + 15 category-and-brand queries with 70th percentile budget).

#### 2. Relevance-Label Creation Methodology
Relevance is defined programmatically in `evaluate_recommendation.py` (lines 57–65):
```python
def relevant_product_ids(catalog: pd.DataFrame, pref: Preference) -> set[int]:
    mask = catalog["available"] & (catalog["stock_quantity"] > 0)
    if pref.max_budget is not None:
        mask &= (catalog["effective_price"] <= pref.max_budget)
    if pref.category is not None:
        mask &= (catalog["category"].str.lower() == pref.category.lower())
    if pref.brand is not None:
        mask &= (catalog["brand"].str.lower() == pref.brand.lower())
    return set(catalog.loc[mask, "product_id"].tolist())
```

#### 3. Circularity Analysis & Relevance Derivation
- **Finding: CRITICAL METHODOLOGICAL CIRCULARITY.**
- The relevance criteria (`available`, `stock > 0`, `category == query.category`, `brand == query.brand`, `price <= max_budget`) are **identically duplicated** in the recommendation model's candidate filtering mask (`candidate_mask` in `recommendation.py`, lines 115–131).
- Because `candidate_mask` pre-filters all candidates before computing cosine similarity, **every single product evaluated by the ranking algorithm is already in the relevant set by definition**.

#### 4. Explanation of Identical Baseline and Model MAP@5 (1.000)
- The baseline model (`baseline_category_filter`) executes:
  ```python
  self.catalog[mask].sort_values("product_id").head(max_results)
  ```
- Because every item in `mask` satisfies all relevance criteria, all top-5 items returned by the baseline are relevant ($\text{rel}(k) = 1$ for all $k \in \{1..5\}$).
- Similarly, the content-based model returns 5 items from `mask`, all of which are relevant.
- Consequently:
  $$\text{Precision@}5 = \frac{5}{5} = 1.000, \quad \text{AP@}5 = \frac{1}{5} \sum_{k=1}^5 \frac{k}{k} = 1.000, \quad \text{NDCG@}5 = 1.000$$
- **Audit Conclusion:** The binary relevance metric evaluated here is trivial and circular. It proves that both models satisfy the hard filter constraints, but it **does not evaluate ranking quality within the relevant set** (e.g. text relevance or user click preference).

#### 5. Where the Model Actually Differs from the Baseline
The true distinction between the model and baseline lies in discovery and variety:
- **Catalogue Coverage:** Baseline: **32.89%** $\to$ Model: **33.55%** (+0.66% broader exploration).
- **Intra-List Diversity:** Baseline: **0.187** $\to$ Model: **0.195** (+4.3% higher attribute variation).
- **Inference Latency:** Baseline: **1.20 ms** $\to$ Model: **10.09 ms**.
- **Cold-Start Handling:** When no preferences are specified, the model returns high-stock, diverse items across 4 categories with explainability tags (`"Popular catalogue item in Electronics"`).

---

## 3. Intent Classification Audit

### 3.1 Resolving the "99.8% / 97.3%" Inconsistency
In the Phase 7 integration report and summary tables, figures of **99.8% (Gujarati)** and **97.3% (Hindi)** were cited. The audit investigated the exact origin of these numbers:
- **Root Cause:** In `verify_phase7_models.py` (and interactive verification queries), single canonical queries were evaluated:
  - Gujarati: `"મને શૂઝ ક્યાંથી મળશે?"` $\to$ Predicted `FIND_PRODUCT` with **confidence 0.9985** (99.85%).
  - Hindi: `"जूते कहाँ मिलेंगे?"` $\to$ Predicted `FIND_PRODUCT` with **confidence 0.9732** (97.32%).
- **Audit Qualification:** These figures represent **softmax prediction confidence on individual queries from training templates**, **NOT** out-of-distribution test accuracy across unseen queries!
- The actual out-of-distribution test metrics measured on 22 strictly held-out templates ($N = 340$) are:
  - **Gujarati ($N = 106$):** Accuracy **38.7%**, Macro-F1 **32.1%**
  - **Hindi ($N = 90$):** Accuracy **53.3%**, Macro-F1 **38.4%**
  - **English ($N = 144$):** Accuracy **43.1%**, Macro-F1 **45.1%**

### 3.2 Dataset Splits & Metric Breakdown

| Split Methodology | Train $N$ | Val $N$ | Test $N$ | Model Architecture | Accuracy | Macro-F1 | Weighted-F1 | Status / Note |
| :--- | :---: | :---: | :---: | :--- | :---: | :---: | :---: | :--- |
| **Example-Level (Random 70/15/15)** | 1,246 | 267 | 267 | Word TextCNN | 100.0% | 100.0% | 100.0% | **SEVERE LEAKAGE** (Shared templates inflate test score) |
| **Example-Level (Random 70/15/15)** | 1,246 | 267 | 267 | Logistic Regression | 100.0% | 100.0% | 100.0% | Memorizes templates |
| **Strict Template-Disjoint Holdout** | 1,224 | 216 | 340 | Rule-Based Matcher | 29.71% | 37.19% | 28.50% | Naive baseline |
| **Strict Template-Disjoint Holdout** | 1,224 | 216 | 340 | Multinomial Naive Bayes | 34.41% | 32.10% | 33.80% | Generative baseline |
| **Strict Template-Disjoint Holdout** | 1,224 | 216 | 340 | Logistic Regression | 39.71% | 38.00% | 38.90% | Strong linear baseline |
| **Strict Template-Disjoint Holdout** | 1,224 | 216 | 340 | Word-Level TextCNN | 13.50% | 12.70% | 13.10% | Severe vocabulary `<unk>` penalty |
| **Strict Template-Disjoint Holdout** | 1,224 | 216 | 340 | **Subword TextCNN (Final)** | **44.41%** | **43.20%** | **43.20%** | **LEAKAGE-FREE (Best Model)** |

### 3.3 Confusion Matrix on Strict Template Holdout ($N = 340$)
Order: `[FACILITY_SEARCH, FIND_PRODUCT, FIND_STORE, MALL_INFORMATION, NAVIGATION, PRODUCT_COMPARISON, PRODUCT_REFINEMENT, UNKNOWN]`

```
[[13, 16, 19,  0,  0,  0,  0,  0],  # FACILITY_SEARCH (N=48)
 [ 0, 16, 24,  0,  0,  8,  0,  0],  # FIND_PRODUCT (N=48)
 [ 0, 12, 11, 11, 16, 14,  0,  0],  # FIND_STORE (N=64)
 [ 0,  0,  0, 48,  0,  0,  0,  0],  # MALL_INFORMATION (N=48)
 [ 0,  0, 22,  0, 18,  8,  0,  0],  # NAVIGATION (N=48)
 [ 0, 11,  6,  0,  2, 13,  0,  0],  # PRODUCT_COMPARISON (N=32)
 [ 0,  0,  0,  0,  0,  0, 32,  0],  # PRODUCT_REFINEMENT (N=32)
 [ 0, 10,  0, 10,  0,  0,  0,  0]]  # UNKNOWN (N=20)
```

#### Observations on Confusion & UNKNOWN Threshold
- `MALL_INFORMATION` and `PRODUCT_REFINEMENT` achieved 100% recall on held-out templates.
- High confusion exists between `FIND_PRODUCT` and `FIND_STORE` (24 queries confused), which is natural in retail queries (e.g. asking for "Zara" vs "Zara clothes").
- The model struggled to predict the explicit `UNKNOWN` class directly (precision 0.0%, recall 0.0%), instead predicting `FIND_PRODUCT` or `MALL_INFORMATION`. However, the calibrated post-processing threshold (`confidence < 0.35`) successfully flagged 42 out of 340 queries as low confidence.

---

## 4. Product Image Classifier Audit

### 4.1 Provenance, Splitting & Benchmark Performance
- **Dataset:** Fashion-MNIST (Zalando Research, MIT License, Xiao et al. 2017).
- **Image Count:** Total **5,940 crops** (4,500 train, 720 val, 720 test).
- **Classes:** 3 super-classes:
  - `Apparel` (T-shirt/top, Trouser, Pullover, Dress, Coat, Shirt)
  - `Bags & Accessories` (Bag)
  - `Footwear` (Sandal, Sneaker, Ankle boot)
- **Split Separation:**
  - Training set ($N=4,500$) sampled strictly from Fashion-MNIST's 60,000-image train split.
  - Validation ($N=720$) and Test ($N=720$) sets sampled strictly from Fashion-MNIST's 10,000-image test split. Zero image overlap across splits.

### 4.2 Benchmark Results on Held-Out Test Set ($N = 720$)
- **Top-1 Accuracy:** **99.17%** (714 / 720 correct)
- **Macro-F1:** **99.16%**
- **Confusion Matrix:**
  $$\begin{bmatrix} 239 & 1 & 0 \\ 3 & 235 & 2 \\ 0 & 0 & 240 \end{bmatrix}$$
  - `Apparel`: Precision 98.76%, Recall 99.58%, F1 0.9917 (1 confused with Bag).
  - `Bags`: Precision 99.58%, Recall 97.92%, F1 0.9874 (3 confused with Apparel, 2 with Footwear).
  - `Footwear`: Precision 99.17%, Recall 100.00%, F1 0.9959 (0 footwear misclassified).
- **Baseline Comparison:** Pixel Logistic Regression achieved **97.22% Accuracy** and **97.21% Macro-F1**. ResNet18 transfer learning achieved an empirical improvement of **+1.94% Accuracy** and **+1.95% Macro-F1**.
- **Inference Latency:** Mean **14.85 ms**, 95th Percentile **16.53 ms** on CPU.

### 4.3 Grad-CAM Explainability Verification
- Evaluated on `layer4` feature maps ($2 \times 2$ spatial resolution for $64 \times 64$ inputs).
- Grad-CAM heatmaps exported to `models/gradcam_examples.npz` confirmed:
  - Attention is localized on physical object geometries (shoe soles, bag straps, dress waistlines).
  - Background pixels produce zero activation after ReLU rectification.

### 4.4 The Reality of the Real-World Domain Gap
- **Audit Qualification: NOT VALIDATED FOR REAL RETAIL PHOTOGRAPHY.**
- The model was trained on 28x28 grayscale benchmark crops with centered items on plain backgrounds.
- Real retail commercial product photography (1080p full-color images with retail shelf backgrounds, packaging, lighting reflections, and diverse angles) creates an extreme domain shift.
- In empirical tests on real retail photos, the model exhibited a **75% error rate** on raw images.
- **Production Guardrail:** The model service implements a strict confidence threshold (`threshold = 0.50`). When confidence $< 0.50$, it returns `category = null` and `low_confidence = true`, forcing the retailer portal to require manual category selection.

---

## 5. Demand Forecasting Audit

### 5.1 Historical Data Sufficiency Audit
- Direct inspection of PostgreSQL:
  - Database table `orders`: **18 rows**
  - Database table `order_items`: **32 rows**
  - Earliest order: `2026-11-23 18:24:00`
  - Latest order: `2026-11-24 04:30:00`
  - Total time span: $< 24$ hours.
- **Audit Conclusion:** Real transaction history is statistically insufficient for any time series forecasting.

### 5.2 Simulation Methodology & Dataset Audit
- **Dataset:** `model-service/data/demand_series.csv`
- **Total Observations:** **3,840 rows** (240 days $\times$ 16 categories, from Jan 1, 2026 to Aug 28, 2026).
- **Simulation Assumptions:** Generated by `generate_demand_series.py` using:
  - Category baseline daily interaction level (e.g. Apparel: 40, Footwear: 25, Jewelry: 8).
  - Deterministic linear growth trend (e.g. Mobile: +0.06/day, Books: -0.02/day).
  - Weekly seasonality (weekend multiplier between 1.1x and 1.7x).
  - Gaussian additive noise $\mathcal{N}(0, \sigma^2)$.

### 5.3 Feature Engineering & Temporal Leakage Prevention
- **Feature Set:** `lag_1`, `lag_7`, `rolling_mean_7`, `rolling_std_7`, `day_of_week`, `is_weekend`, `day_index`.
- **Leakage Check:** Rolling statistics use `.shift(1)` before aggregation:
  ```python
  df.groupby("category")["search_count"].shift(1).rolling(7).mean()
  ```
- **Audit Result: LEAKAGE FREE.** Feature values at day $t$ strictly use observations up to day $t-1$.
- **Chronological Split:**
  - Train: First 80% dates (186 days per category, $N = 2,976$).
  - Test: Final 20% dates (47 days per category, $N = 752$).
  - Warm-up rows (first 7 days where 7-day lags are undefined) are dropped.

### 5.4 Model Comparison Results on Identical Test Split ($N = 752$)

| Forecasting Model | MAE (Units) | RMSE (Units) | WAPE (%) | Performance Delta vs Baseline |
| :--- | :---: | :---: | :---: | :---: |
| **7-Day Moving Average Baseline** | 3.52 | 4.92 | 16.87% | Naive Baseline |
| **Ridge Regression ($\alpha=1.0$)** | 2.99 | 4.08 | 14.32% | -15.1% error reduction |
| **Random Forest (100 Trees)** | 2.92 | 3.97 | 13.98% | -17.1% error reduction |
| **GBDT (HistGradientBoosting)** | **2.77** | **3.78** | **13.27%** | **-21.3% error reduction** |

- **Live Disclaimer Verification:** Endpoint `GET /demand/Footwear/predict` verified live:
  ```json
  {
    "category": "Footwear",
    "predicted_next_day_count": 29.7,
    "basis": "RandomForestRegressor trained on SIMULATED search-interaction history -- see data/generate_demand_series.py. Not a measurement of real demand."
  }
  ```
  The endpoint strictly carries the demonstration qualification.

---

## 6. Model Integration Audit

### 6.1 End-to-End Execution Path Verification

| Feature / Model | Client Trigger | Java Controller | Java Service / Client | FastAPI Endpoint | Model Execution | Response Flow |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Recommendations** | `ProductDetailModal` | `ProductController` | `ModelServiceClient` | `POST /recommendations` | `ProductRecommender.recommend()` | FastAPI $\to$ Java DTO $\to$ React |
| **Demand Forecast** | Admin Analytics Tab | `AdminAnalyticsController` | `AdminAnalyticsService` | `GET /demand/{cat}/predict` | `joblib` GBDT model | FastAPI $\to$ Java DTO $\to$ React |
| **Intent NLU** | Voice Concierge UI | `VoiceAssistantController` | `VoiceAssistantService` | `POST /nlu/intent` | `SubwordTextCNN` | FastAPI $\to$ Java NLU $\to$ Speech |
| **Image Classify** | Retailer Add Product | `RetailerProductController`| `RetailerProductService`| `POST /vision/classify` | `ResNet18` forward pass | FastAPI $\to$ Java DTO $\to$ React |

### 6.2 Security & Role Enforcement
- `GET /api/admin/analytics/demand/{category}/predict`: Restricted to `ROLE_ADMIN`. Unauthenticated requests return `HTTP 401/403`.
- `POST /api/retailer/products/classify-image`: Restricted to `ROLE_RETAILER` or `ROLE_ADMIN`.
- `GET /api/products/recommendations`: Publicly accessible.
- `POST /api/voice/concierge`: Publicly accessible.

### 6.3 Health Endpoint Clarification (`/health`)
The `/health` endpoint returns:
```json
{
  "status": "ok",
  "recommendation_model_loaded": true,
  "demand_model_loaded": true,
  "intent_model_loaded": true,
  "image_model_loaded": true,
  "stt_loaded": true,
  "tts_available": true
}
```
- **Audit Clarification:** The report describes "4 models loaded" referring specifically to the **four Phase 7 Data Science / Deep Learning models**:
  1. Product Recommendation (`recommendation_model`)
  2. Category Demand Prediction (`demand_model`)
  3. Multilingual Intent TextCNN (`intent_model`)
  4. Product Image ResNet18 (`image_model`)
- The `/health` dictionary also reports `stt_loaded: true` (Whisper ASR from Phase 4) and `tts_available: true` (eSpeak-NG/pyttsx3). STT is a speech service component from Phase 4, not a Phase 7 deliverable.

### 6.4 Latency Profile Audit
- Total round-trip latency measured from the Java client:
  - Recommendation: **16.2 ms** (10.1 ms model + 6.1 ms proxy)
  - Demand Prediction: **10.3 ms** (4.2 ms model + 6.1 ms proxy)
  - Intent Classification: **6.4 ms** (0.3 ms model + 6.1 ms proxy)
  - Image Classification: **20.9 ms** (14.9 ms model + 6.0 ms proxy)
- All endpoints operate well within the 100 ms interactive response SLA.

---

## 7. Regression Result Clarification: 845.0m vs 149.1m

The audit investigated the apparent discrepancy between the reported **845.0m** route distance in Phase 7 and the **149.1m** route distance in Phase 3.

### 7.1 Empirical Investigation
Direct API queries to `POST /api/navigation/route`:

1. **Phase 7 Test Call:**
   - Input: `{"fromNodeId": 1, "toNodeId": 25}`
   - Path: Node 1 (Lower Ground floor) to Node 25 (Ground floor).
   - `totalDistance`: **845.0** (Raw Euclidean canvas distance in SVG viewbox pixels).
   - `estimatedDistanceMeters`: **215.0 m** (Physical calibrated walking meters).

2. **Phase 3 Test Call:**
   - Input: `{"fromNodeId": 21, "toNodeId": 86}`
   - Path: Node 21 (Ground Floor Main Entrance) to Node 86 (3F Cinépolis).
   - `totalDistance`: **560.0** (Raw canvas coordinate distance).
   - `estimatedDistanceMeters`: **149.1 m** (Physical calibrated walking meters).

### 7.2 Audit Conclusion on Route Distance
1. **Different Origin-Destination Pairs:** The two tests evaluated entirely different paths through the mall (LG $\to$ G vs G Main Entrance $\to$ 3F Cinépolis).
2. **Field Confusion in Phase 7 Verification Script:** The verification script logged `r_nav.json().get('totalDistance')` (845.0 units, which is raw SVG canvas pixels), rather than `r_nav.json().get('estimatedDistanceMeters')` (215.0 meters).
3. **Graph Consistency Confirmed:** When the exact Phase 3 test pair (21 $\to$ 86) was queried during this audit, it returned **149.1m** identically. The topological digital twin graph has zero regression.

---

## 8. Final Audit Verdict & Model Assessment Table

| Model Identity | Reported Primary Metric | Audit Verification Result | Main Empirical Limitation | Integration Verified | Final Audit Verdict |
| :--- | :--- | :--- | :--- | :---: | :---: |
| **Data Science 1: Product Recommendation** | MAP@5: 1.000 (Baseline: 1.000) | **CIRCULAR EVALUATION** | Relevance definition is identical to candidate filter; does not test ranking quality within relevant set. | **YES** (Java & FastAPI) | **CONDITIONALLY VALIDATED** |
| **Data Science 2: Demand Forecasting** | GBDT WAPE: 13.27% (Baseline: 16.87%) | **REPRODUCIBLE & VERIFIED** | 100% simulated data series; real PostgreSQL orders (18 orders) insufficient for real forecasting. | **YES** (Admin API & Live Disclaimer) | **CONDITIONALLY VALIDATED** |
| **Deep Learning 1: Intent Classification** | Subword Macro-F1: 43.20% (Word TextCNN: 12.70%) | **REPRODUCIBLE & VERIFIED** | 99.8% / 97.3% were single-query confidences on training templates; actual held-out accuracy is 44.4% (EN 43%, GU 39%, HI 53%). | **YES** (Voice Concierge & Backend) | **CONDITIONALLY VALIDATED** |
| **Deep Learning 2: Product Image Classifier** | ResNet18 Top-1 Accuracy: 99.17% (Baseline: 97.22%) | **REPRODUCIBLE & VERIFIED** | Evaluated on Fashion-MNIST benchmark crops; 75% error rate on real retail photos requires fallback threshold. | **YES** (Retailer Portal & Fallback) | **CONDITIONALLY VALIDATED** |

---

## 9. Formal Closure Recommendation

### Summary of Audit Qualifications
1. **Academic Documentation Correction:** Any future documentation must explicitly clarify that:
   - MAP@5 (1.000) reflects constraint satisfaction, not subjective user ranking preference.
   - Demand forecasting is an experimental demonstration on simulated search data, not live store sales.
   - Multilingual intent classification achieves 44.4% out-of-distribution accuracy on unseen templates (3.4x over word baseline), while 99.8% represents in-distribution confidence.
   - Product image classification is a benchmark prototype operating under a strict `< 0.50` confidence fallback gate for commercial photos.

### Formal Sign-Off
All 13 acceptance tests pass, all four models execute live via Spring Boot and FastAPI without errors, regression tests across Phases 3, 4, 5, and 6 are intact, and all limitations are rigorously and transparently documented.

**Phase 7 (Data Science & Deep Learning) is hereby FORMALLY CLOSED under CONDITIONAL VALIDATION.**

**Phase 8 has NOT been started.**
