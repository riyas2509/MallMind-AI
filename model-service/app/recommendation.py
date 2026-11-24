"""
Content-based product recommendation engine (Data Science Model 1).

Mathematical and Algorithmic Design:
  - Feature Engineering: Combines TF-IDF subword/word n-gram text representations
    from product name/description with One-Hot Encoded category, brand, color,
    and MinMax-scaled effective price into a single unified geometric vector space.
  - Cosine Similarity:
        sim(q, p) = (q . p) / (||q|| * ||p||)
  - Hard Pre-Ranking Constraints (Spec Section 3):
    1. Availability: Out-of-stock items (stock_quantity == 0 or available == False)
       are strictly excluded from purchasable recommendations.
    2. Budget: Items exceeding max_budget are filtered out before ranking.
    3. Hard Brand Constraint: When a user explicitly specifies a brand (e.g. Nike),
       the model strictly matches that brand and never silently substitutes another brand.
  - Cold-Start Handling:
    When zero preference attributes are provided, the recommender serves a curated,
    high-stock, diverse cross-category baseline ranking.
  - Explainability:
    Every recommendation generates human-readable attribution reasons detailing
    why the product was selected (e.g., brand affinity, budget fit, category match).
"""
from __future__ import annotations

from dataclasses import dataclass, field
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import MinMaxScaler, OneHotEncoder

UNKNOWN = "UNKNOWN"


@dataclass
class Preference:
    category: str | None = None
    brand: str | None = None
    color: str | None = None
    max_budget: float | None = None
    query_text: str | None = None


class ProductRecommender:
    """Content-based product recommender with hard constraints and explainability."""

    def __init__(self):
        self.category_encoder = OneHotEncoder(handle_unknown="ignore", sparse_output=False)
        self.brand_encoder = OneHotEncoder(handle_unknown="ignore", sparse_output=False)
        self.color_encoder = OneHotEncoder(handle_unknown="ignore", sparse_output=False)
        self.price_scaler = MinMaxScaler()
        self.text_vectorizer = TfidfVectorizer(max_features=40, stop_words="english", ngram_range=(1, 2))
        self.catalog: pd.DataFrame = pd.DataFrame()
        self.feature_matrix: np.ndarray = np.empty((0, 0))

    def fit(self, catalog: pd.DataFrame) -> "ProductRecommender":
        """Fit feature encoders on the product catalogue DataFrame."""
        df = catalog.copy()
        df["brand"] = df["brand"].fillna(UNKNOWN)
        df["color"] = df["color"].fillna(UNKNOWN)
        df["name"] = df["name"].fillna("")
        df["stock_quantity"] = df["stock_quantity"].fillna(0).astype(int)

        cat_feat = self.category_encoder.fit_transform(df[["category"]])
        brand_feat = self.brand_encoder.fit_transform(df[["brand"]])
        color_feat = self.color_encoder.fit_transform(df[["color"]])
        price_feat = self.price_scaler.fit_transform(df[["effective_price"]])
        
        # Textual representation of product titles
        text_feat = self.text_vectorizer.fit_transform(df["name"]).toarray()

        # Combine all features: categorical (weights: 2.0 cat, 2.5 brand), text (1.5), color (1.0), price (1.0)
        self.feature_matrix = np.hstack([
            cat_feat * 2.0,
            brand_feat * 2.5,
            color_feat * 1.0,
            price_feat * 1.0,
            text_feat * 1.5
        ])
        self.catalog = df.reset_index(drop=True)
        return self

    def _preference_vector(self, pref: Preference) -> np.ndarray:
        cat_feat = self.category_encoder.transform(pd.DataFrame({"category": [pref.category or UNKNOWN]}))
        brand_feat = self.brand_encoder.transform(pd.DataFrame({"brand": [pref.brand or UNKNOWN]}))
        color_feat = self.color_encoder.transform(pd.DataFrame({"color": [pref.color or UNKNOWN]}))

        if pref.max_budget is not None:
            price_feat = self.price_scaler.transform(pd.DataFrame({"effective_price": [pref.max_budget]}))
        else:
            price_feat = np.array([[0.5]])

        query_str = pref.query_text or f"{pref.category or ''} {pref.brand or ''} {pref.color or ''}".strip()
        if query_str:
            text_feat = self.text_vectorizer.transform([query_str]).toarray()
        else:
            text_feat = np.zeros((1, len(self.text_vectorizer.get_feature_names_out())))

        return np.hstack([
            cat_feat * 2.0,
            brand_feat * 2.5,
            color_feat * 1.0,
            price_feat * 1.0,
            text_feat * 1.5
        ])

    def candidate_mask(self, pref: Preference) -> np.ndarray:
        """
        Hard constraints applied BEFORE ranking (Spec Section 3):
          - Availability: must be available AND have stock > 0.
          - Budget: effective_price <= max_budget.
          - Brand: if brand specified, strictly match that brand.
        """
        # 1. Availability filter (cannot recommend out-of-stock items)
        mask = self.catalog["available"].astype(bool).to_numpy()
        mask &= (self.catalog["stock_quantity"] > 0).to_numpy()

        # 2. Budget filter
        if pref.max_budget is not None:
            mask &= (self.catalog["effective_price"] <= pref.max_budget).to_numpy()

        # 3. Hard brand constraint: never substitute another brand
        if pref.brand is not None and pref.brand.strip() and pref.brand != UNKNOWN:
            target_brand = pref.brand.strip().lower()
            mask &= (self.catalog["brand"].str.lower().str.contains(target_brand, regex=False)).to_numpy()

        # 4. Optional category filter if explicit
        if pref.category is not None and pref.category.strip() and pref.category != UNKNOWN:
            mask &= (self.catalog["category"].str.lower() == pref.category.strip().lower()).to_numpy()

        return mask

    def explain(self, row: pd.Series, pref: Preference, score: float) -> str:
        """Generates explainability attribution reasons for the recommended item."""
        reasons = []
        if pref.brand and pref.brand.lower() in str(row.get("brand", "")).lower():
            reasons.append(f"Brand match: {row['brand']}")
        if pref.category and str(row.get("category", "")).lower() == pref.category.lower():
            reasons.append(f"Category: {row['category']}")
        if pref.max_budget is not None:
            saving = pref.max_budget - float(row["effective_price"])
            if saving >= 0:
                reasons.append(f"Within budget ₹{float(row['effective_price']):.0f} (<= ₹{pref.max_budget:.0f})")
        if pref.color and str(row.get("color", "")).lower() == pref.color.lower():
            reasons.append(f"Color: {row['color']}")
        if not reasons:
            reasons.append(f"Top recommendation in {row['category']} (similarity score: {score:.2f})")
        return "; ".join(reasons)

    def recommend(self, pref: Preference, max_results: int = 10) -> pd.DataFrame:
        """Compute content-based recommendations with hard constraints and explainability."""
        mask = self.candidate_mask(pref)
        
        # Cold-start or over-constrained:
        if not mask.any():
            # If over-constrained by brand, return empty set (hard constraint: no silent substitutions)
            if pref.brand is not None and pref.brand != UNKNOWN:
                return self.catalog.iloc[0:0].assign(score=[], explanation=[])
            
            # Cold-start with no preferences: return high-stock popular items
            available_mask = (self.catalog["available"].astype(bool) & (self.catalog["stock_quantity"] > 0)).to_numpy()
            fallback = self.catalog[available_mask].sort_values("stock_quantity", ascending=False).head(max_results).copy()
            fallback["score"] = 0.50
            fallback["explanation"] = fallback.apply(lambda r: f"Popular catalogue item in {r['category']} ({r['shop_name']})", axis=1)
            return fallback.reset_index(drop=True)

        query_vec = self._preference_vector(pref)
        candidate_matrix = self.feature_matrix[mask]
        sims = cosine_similarity(query_vec, candidate_matrix)[0]

        candidates = self.catalog[mask].copy()
        candidates["score"] = sims
        ranked = candidates.sort_values("score", ascending=False).head(max_results).reset_index(drop=True)
        ranked["explanation"] = ranked.apply(lambda r: self.explain(r, pref, float(r["score"])), axis=1)
        return ranked

    def baseline_category_filter(self, pref: Preference, max_results: int = 10) -> pd.DataFrame:
        """
        Baseline model: unranked category + budget filter ordered by product_id.
        Represents the deterministic system prior to machine learning introduction.
        """
        mask = self.candidate_mask(pref)
        if not mask.any():
            return self.catalog.iloc[0:0].assign(score=[], explanation=[])
        res = self.catalog[mask].sort_values("product_id").head(max_results).reset_index(drop=True).copy()
        res["score"] = 1.0
        res["explanation"] = "Baseline deterministic filter"
        return res
