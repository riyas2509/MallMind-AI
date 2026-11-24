"""
Generates a SIMULATED daily category-level interaction time series for the
demand prediction model (Part 4, Data Science Model 2).

IMPORTANT (Part 17 rule #7): this is synthetic data, deterministically
generated from a fixed seed. The real search_events/product_interactions
tables exist in the schema and are what a production deployment would
train on, but this prototype has only a handful of real rows (from manual
API testing), nowhere near enough for time-series modelling. This series
is clearly labeled simulated and must never be presented as real consumer
demand.

Each category gets: a base daily interaction level, a slow linear trend
(some categories growing, some shrinking, most flat), weekly seasonality
(a weekend bump), and Gaussian noise. 240 days (~8 months).

Run: .venv/Scripts/python.exe data/generate_demand_series.py
"""
import os

import numpy as np
import pandas as pd

SEED = 42
N_DAYS = 240

CATEGORIES = {
    # category: (base_level, daily_trend, weekend_multiplier, noise_std)
    "Apparel": (40, 0.05, 1.4, 6),
    "Footwear": (25, 0.03, 1.3, 5),
    "Electronics": (18, 0.08, 1.1, 4),
    "Bags & Accessories": (15, 0.00, 1.3, 3),
    "Books & Stationery": (10, -0.02, 1.0, 2),
    "Confectionery": (12, 0.01, 1.6, 3),
    "Beauty & Cosmetics": (20, 0.04, 1.2, 4),
    "Watches & Accessories": (9, 0.00, 1.1, 2),
    "Toys & Games": (14, 0.02, 1.5, 3),
    "Jewelry": (8, -0.01, 1.2, 2),
    "Opticals": (6, 0.00, 1.0, 1.5),
    "Home Decor": (11, 0.01, 1.1, 2.5),
    "Sportswear": (16, 0.03, 1.3, 3),
    "Gifts & Novelty": (9, 0.00, 1.7, 2),
    "Pharmacy & Health": (13, 0.01, 0.9, 2.5),
    "Mobile & Gadgets": (22, 0.06, 1.1, 4),
}


def main():
    rng = np.random.default_rng(SEED)
    start_date = pd.Timestamp("2026-01-01")
    rows = []

    for category, (base, trend, weekend_mult, noise_std) in CATEGORIES.items():
        for day_idx in range(N_DAYS):
            date = start_date + pd.Timedelta(days=day_idx)
            is_weekend = date.dayofweek >= 5
            level = base + trend * day_idx
            level *= weekend_mult if is_weekend else 1.0
            noise = rng.normal(0, noise_std)
            value = max(0, round(level + noise))
            rows.append({"date": date, "category": category, "search_count": value})

    df = pd.DataFrame(rows).sort_values(["category", "date"]).reset_index(drop=True)

    out_path = os.path.join(os.path.dirname(__file__), "demand_series.csv")
    df.to_csv(out_path, index=False)
    print(f"Generated {len(df)} rows ({N_DAYS} days x {len(CATEGORIES)} categories) -> {out_path}")


if __name__ == "__main__":
    main()
