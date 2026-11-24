"""
Evaluates the enhanced ProductRecommender (Data Science Model 1) against
the baseline category filter across Precision@K, Recall@K, MAP@K, NDCG@K,
Catalogue Coverage, Recommendation Diversity, and Inference Latency.

Relevance Definition:
  A product is defined as relevant to a preference query if:
    - it is available AND in stock (stock_quantity > 0)
    - its effective_price <= max_budget (if specified)
    - its category matches the query's category
    - its brand matches the query's brand (if specified)

Queries include:
  1. Category-only queries with budget at 70th percentile.
  2. Category + Brand queries with budget at 70th percentile.
  3. Budget-constrained multi-attribute queries.
  4. Cold-start query (empty preferences).
"""
import json
import math
import os
import time
import numpy as np
import pandas as pd

from recommendation import Preference, ProductRecommender

K = 5


def load_catalog() -> pd.DataFrame:
    path = os.path.join(os.path.dirname(__file__), "..", "data", "catalog.csv")
    df = pd.read_csv(path)
    df["available"] = df["available"].astype(bool)
    df["stock_quantity"] = df["stock_quantity"].fillna(0).astype(int)
    return df


def build_test_queries(catalog: pd.DataFrame) -> list[Preference]:
    queries = []
    # 1. Per-category budget queries
    for category, group in catalog.groupby("category"):
        avail_group = group[group["available"] & (group["stock_quantity"] > 0)]
        if avail_group.empty:
            continue
        budget = float(avail_group["effective_price"].quantile(0.70))
        queries.append(Preference(category=category, max_budget=budget))

        # Brand specific queries
        top_brand = avail_group["brand"].dropna().mode()
        if not top_brand.empty and top_brand.iloc[0] != "UNKNOWN":
            queries.append(Preference(category=category, brand=top_brand.iloc[0], max_budget=budget))

    return queries


def relevant_product_ids(catalog: pd.DataFrame, pref: Preference) -> set[int]:
    mask = catalog["available"] & (catalog["stock_quantity"] > 0)
    if pref.max_budget is not None:
        mask &= (catalog["effective_price"] <= pref.max_budget)
    if pref.category is not None:
        mask &= (catalog["category"].str.lower() == pref.category.lower())
    if pref.brand is not None:
        mask &= (catalog["brand"].str.lower() == pref.brand.lower())
    return set(catalog.loc[mask, "product_id"].tolist())


def precision_at_k(ranked_ids: list[int], relevant: set[int], k: int) -> float:
    top = ranked_ids[:k]
    if not top:
        return 0.0
    return sum(1 for pid in top if pid in relevant) / len(top)


def recall_at_k(ranked_ids: list[int], relevant: set[int], k: int) -> float:
    if not relevant:
        return 1.0 if not ranked_ids else 0.0
    top = ranked_ids[:k]
    return sum(1 for pid in top if pid in relevant) / len(relevant)


def average_precision_at_k(ranked_ids: list[int], relevant: set[int], k: int) -> float:
    if not relevant:
        return 1.0 if not ranked_ids else 0.0
    top = ranked_ids[:k]
    hits = 0
    sum_prec = 0.0
    for i, pid in enumerate(top):
        if pid in relevant:
            hits += 1
            sum_prec += hits / (i + 1)
    return sum_prec / min(len(relevant), k) if hits > 0 else 0.0


def ndcg_at_k(ranked_ids: list[int], relevant: set[int], k: int) -> float:
    if not relevant:
        return 1.0 if not ranked_ids else 0.0
    top = ranked_ids[:k]
    dcg = sum((1.0 if pid in relevant else 0.0) / math.log2(i + 2) for i, pid in enumerate(top))
    ideal_hits = min(len(relevant), k)
    idcg = sum(1.0 / math.log2(i + 2) for i in range(ideal_hits))
    return dcg / idcg if idcg > 0 else 0.0


def intra_list_diversity(ranked_ids: list[int], catalog: pd.DataFrame) -> float:
    """Measures diversity as the average category and brand dissimilarity within top-K."""
    if len(ranked_ids) <= 1:
        return 0.0
    items = catalog[catalog["product_id"].isin(ranked_ids)].drop_duplicates("product_id")
    if len(items) <= 1:
        return 0.0
    pairs = 0
    dist = 0
    item_rows = items.to_dict("records")
    for i in range(len(item_rows)):
        for j in range(i + 1, len(item_rows)):
            pairs += 1
            cat_diff = 1.0 if item_rows[i]["category"] != item_rows[j]["category"] else 0.0
            brand_diff = 1.0 if item_rows[i]["brand"] != item_rows[j]["brand"] else 0.0
            dist += (cat_diff + brand_diff) / 2.0
    return dist / pairs if pairs > 0 else 0.0


def evaluate(catalog: pd.DataFrame, recommender: ProductRecommender, queries: list[Preference], k: int):
    rows = []
    latencies = []
    model_recommended_ids = set()
    baseline_recommended_ids = set()

    for pref in queries:
        relevant = relevant_product_ids(catalog, pref)

        t0 = time.perf_counter()
        model_df = recommender.recommend(pref, max_results=k)
        latencies.append((time.perf_counter() - t0) * 1000.0)

        model_ranked = model_df["product_id"].tolist()
        baseline_ranked = recommender.baseline_category_filter(pref, max_results=k)["product_id"].tolist()

        model_recommended_ids.update(model_ranked)
        baseline_recommended_ids.update(baseline_ranked)

        rows.append({
            "category": pref.category,
            "brand": pref.brand,
            "budget": pref.max_budget,
            "n_relevant": len(relevant),
            "model_precision@k": precision_at_k(model_ranked, relevant, k),
            "model_recall@k": recall_at_k(model_ranked, relevant, k),
            "model_map@k": average_precision_at_k(model_ranked, relevant, k),
            "model_ndcg@k": ndcg_at_k(model_ranked, relevant, k),
            "model_diversity": intra_list_diversity(model_ranked, catalog),
            "baseline_precision@k": precision_at_k(baseline_ranked, relevant, k),
            "baseline_recall@k": recall_at_k(baseline_ranked, relevant, k),
            "baseline_map@k": average_precision_at_k(baseline_ranked, relevant, k),
            "baseline_ndcg@k": ndcg_at_k(baseline_ranked, relevant, k),
            "baseline_diversity": intra_list_diversity(baseline_ranked, catalog),
        })

    # Test Cold Start (no preferences)
    t0_cs = time.perf_counter()
    cold_start_df = recommender.recommend(Preference(), max_results=k)
    cs_latency = (time.perf_counter() - t0_cs) * 1000.0

    eval_df = pd.DataFrame(rows)
    total_catalog_size = len(catalog)

    summary = {
        "k": k,
        "n_queries": len(queries),
        "total_catalog_products": total_catalog_size,
        "model": {
            "precision@k": float(eval_df["model_precision@k"].mean()),
            "recall@k": float(eval_df["model_recall@k"].mean()),
            "map@k": float(eval_df["model_map@k"].mean()),
            "ndcg@k": float(eval_df["model_ndcg@k"].mean()),
            "catalog_coverage": float(len(model_recommended_ids) / total_catalog_size),
            "intra_list_diversity": float(eval_df["model_diversity"].mean()),
            "mean_latency_ms": float(np.mean(latencies)),
            "p95_latency_ms": float(np.percentile(latencies, 95))
        },
        "baseline_category_filter": {
            "precision@k": float(eval_df["baseline_precision@k"].mean()),
            "recall@k": float(eval_df["baseline_recall@k"].mean()),
            "map@k": float(eval_df["baseline_map@k"].mean()),
            "ndcg@k": float(eval_df["baseline_ndcg@k"].mean()),
            "catalog_coverage": float(len(baseline_recommended_ids) / total_catalog_size),
            "intra_list_diversity": float(eval_df["baseline_diversity"].mean()),
        },
        "cold_start": {
            "returned_count": len(cold_start_df),
            "all_available_and_in_stock": bool((cold_start_df["stock_quantity"] > 0).all()),
            "categories_represented": cold_start_df["category"].nunique(),
            "sample_explanation": cold_start_df["explanation"].iloc[0] if len(cold_start_df) > 0 else "",
            "latency_ms": cs_latency
        }
    }
    return eval_df, summary


def main():
    catalog = load_catalog()
    recommender = ProductRecommender().fit(catalog)
    queries = build_test_queries(catalog)

    results_df, summary = evaluate(catalog, recommender, queries, K)

    out_dir = os.path.join(os.path.dirname(__file__), "..", "models")
    os.makedirs(out_dir, exist_ok=True)
    results_df.to_csv(os.path.join(out_dir, "recommendation_eval_detail.csv"), index=False)
    with open(os.path.join(out_dir, "recommendation_eval_summary.json"), "w") as f:
        json.dump(summary, f, indent=2)

    print("=" * 80)
    print("PRODUCT RECOMMENDATION EVALUATION SUMMARY (DATA SCIENCE MODEL 1)")
    print("=" * 80)
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
