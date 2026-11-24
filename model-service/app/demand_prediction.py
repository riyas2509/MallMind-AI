"""
Product/category demand prediction pipeline (Data Science Model 2).

Critical Data Sufficiency Notice:
  Real-world mall transactional history in MallMind AI currently consists of 18
  sandbox test orders (< 24 hours), which is statistically and chronologically
  insufficient for time-series forecasting.
  To satisfy the academic modeling requirements without fabricating real sales,
  a 240-day simulated search-interaction time series (data/demand_series.csv) is used
  as an EXPERIMENTAL DEMONSTRATION PROTOTYPE.

Feature Engineering:
  - lag_1: Prior day's interaction count.
  - lag_7: Same weekday last week.
  - rolling_mean_7: Trailing 7-day moving average.
  - rolling_std_7: Trailing 7-day volatility.
  - day_of_week (0-6), is_weekend (binary).
  - day_index: Monotonically increasing time index capturing macro trend.
  - category: One-hot encoded retail categories.

Models Implemented:
  1. Moving Average Baseline (trailing 7-day mean).
  2. Ridge Regression (linear model with L2 regularization).
  3. Random Forest Regressor (ensemble of decision trees).
  4. Gradient Boosting Regressor (HistGradientBoostingRegressor).

Evaluation Metrics:
  - MAE: Mean Absolute Error
  - RMSE: Root Mean Squared Error
  - WAPE: Weighted Absolute Percentage Error (sum(|y - y_hat|) / sum(y))
"""
from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingRegressor, RandomForestRegressor
from sklearn.linear_model import Ridge


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.sort_values(["category", "date"]).copy()
    df["date"] = pd.to_datetime(df["date"])

    df["lag_1"] = df.groupby("category")["search_count"].shift(1)
    df["lag_7"] = df.groupby("category")["search_count"].shift(7)
    df["rolling_mean_7"] = (
        df.groupby("category")["search_count"].shift(1).rolling(7).mean().reset_index(drop=True)
    )
    df["rolling_std_7"] = (
        df.groupby("category")["search_count"].shift(1).rolling(7).std().fillna(0).reset_index(drop=True)
    )
    df["day_of_week"] = df["date"].dt.dayofweek
    df["is_weekend"] = (df["day_of_week"] >= 5).astype(int)
    df["day_index"] = df.groupby("category").cumcount()

    # Drop warm-up rows where lag features are undefined
    df = df.dropna(subset=["lag_1", "lag_7", "rolling_mean_7"]).reset_index(drop=True)
    return df


def time_based_split(df: pd.DataFrame, test_fraction: float = 0.2):
    """Per-category strictly chronological split to prevent future leakage."""
    train_parts, test_parts = [], []
    for _category, group in df.groupby("category"):
        group = group.sort_values("date")
        split_idx = int(len(group) * (1 - test_fraction))
        train_parts.append(group.iloc[:split_idx])
        test_parts.append(group.iloc[split_idx:])
    return pd.concat(train_parts).reset_index(drop=True), pd.concat(test_parts).reset_index(drop=True)


FEATURE_COLUMNS = ["lag_1", "lag_7", "rolling_mean_7", "rolling_std_7", "day_of_week", "is_weekend", "day_index"]


def build_model_matrix(df: pd.DataFrame, category_columns: list[str] | None = None):
    category_dummies = pd.get_dummies(df["category"], prefix="cat")
    if category_columns is not None:
        category_dummies = category_dummies.reindex(columns=category_columns, fill_value=0)
    X = pd.concat([df[FEATURE_COLUMNS].reset_index(drop=True), category_dummies.reset_index(drop=True)], axis=1)
    y = df["search_count"].reset_index(drop=True)
    return X, y, list(category_dummies.columns)


def train_models(X_train: pd.DataFrame, y_train: pd.Series):
    """Trains multiple forecasting candidate models."""
    rf = RandomForestRegressor(n_estimators=150, max_depth=10, min_samples_leaf=2, random_state=42, n_jobs=-1)
    rf.fit(X_train, y_train)

    ridge = Ridge(alpha=1.0, random_state=42)
    ridge.fit(X_train, y_train)

    gbdt = HistGradientBoostingRegressor(max_iter=150, max_depth=6, random_state=42)
    gbdt.fit(X_train, y_train)

    return {"random_forest": rf, "ridge": ridge, "gradient_boosting": gbdt}


def baseline_predict(df: pd.DataFrame) -> np.ndarray:
    """7-day trailing moving average baseline."""
    return df["rolling_mean_7"].to_numpy()


def mae(y_true, y_pred) -> float:
    return float(np.mean(np.abs(y_true - y_pred)))


def rmse(y_true, y_pred) -> float:
    return float(np.sqrt(np.mean((y_true - y_pred) ** 2)))


def wape(y_true, y_pred) -> float:
    """Weighted Absolute Percentage Error = sum(|y - y_hat|) / sum(y)."""
    sum_y = np.sum(y_true)
    if sum_y == 0:
        return 0.0
    return float(np.sum(np.abs(y_true - y_pred)) / sum_y)
