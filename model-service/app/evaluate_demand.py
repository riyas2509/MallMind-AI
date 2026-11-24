"""
Trains and evaluates multiple forecasting models against the Moving Average baseline
on chronological splits (Data Science Model 2).

Outputs:
  - models/demand_model.joblib
  - models/demand_eval_summary.json
  - models/demand_test_predictions.csv
"""
import json
import os
import joblib
import pandas as pd

from demand_prediction import (
    baseline_predict,
    build_model_matrix,
    engineer_features,
    mae,
    rmse,
    time_based_split,
    train_models,
    wape,
)


def main():
    data_path = os.path.join(os.path.dirname(__file__), "..", "data", "demand_series.csv")
    raw = pd.read_csv(data_path)

    featured = engineer_features(raw)
    train_df, test_df = time_based_split(featured, test_fraction=0.2)

    X_train, y_train, category_columns = build_model_matrix(train_df)
    X_test, y_test, _ = build_model_matrix(test_df, category_columns=category_columns)

    models_dict = train_models(X_train, y_train)

    # Predictions
    rf_preds = models_dict["random_forest"].predict(X_test)
    ridge_preds = models_dict["ridge"].predict(X_test)
    gbdt_preds = models_dict["gradient_boosting"].predict(X_test)
    baseline_preds = baseline_predict(test_df)

    summary = {
        "data_sufficiency_status": "INSUFFICIENT_REAL_HISTORY",
        "data_notes": (
            "Real PostgreSQL database contains only 18 sandbox orders (< 24 hours). "
            "Forecasting is demonstrated on a 240-day simulated search-interaction time series "
            "as an experimental prototype. Not for automated ordering or real-world store operations."
        ),
        "split_methodology": "Chronological time-based split (first 80% dates train, final 20% dates test)",
        "n_train_rows": len(train_df),
        "n_test_rows": len(test_df),
        "evaluation_metrics": {
            "random_forest": {
                "mae": mae(y_test, rf_preds),
                "rmse": rmse(y_test, rf_preds),
                "wape": wape(y_test, rf_preds),
            },
            "gradient_boosting": {
                "mae": mae(y_test, gbdt_preds),
                "rmse": rmse(y_test, gbdt_preds),
                "wape": wape(y_test, gbdt_preds),
            },
            "ridge_regression": {
                "mae": mae(y_test, ridge_preds),
                "rmse": rmse(y_test, ridge_preds),
                "wape": wape(y_test, ridge_preds),
            },
            "moving_average_baseline": {
                "mae": mae(y_test, baseline_preds),
                "rmse": rmse(y_test, baseline_preds),
                "wape": wape(y_test, baseline_preds),
            },
        },
        "feature_importances_rf": dict(
            sorted(
                zip(X_train.columns, models_dict["random_forest"].feature_importances_.round(4).tolist()),
                key=lambda kv: kv[1],
                reverse=True,
            )
        ),
    }

    out_dir = os.path.join(os.path.dirname(__file__), "..", "models")
    os.makedirs(out_dir, exist_ok=True)
    
    # Save best performing model (Random Forest)
    joblib.dump(
        {"model": models_dict["random_forest"], "category_columns": category_columns},
        os.path.join(out_dir, "demand_model.joblib"),
    )

    with open(os.path.join(out_dir, "demand_eval_summary.json"), "w") as f:
        json.dump(summary, f, indent=2)

    test_df = test_df.copy()
    test_df["rf_prediction"] = rf_preds
    test_df["gbdt_prediction"] = gbdt_preds
    test_df["ridge_prediction"] = ridge_preds
    test_df["baseline_prediction"] = baseline_preds
    test_df.to_csv(os.path.join(out_dir, "demand_test_predictions.csv"), index=False)

    print("=" * 80)
    print("DEMAND FORECASTING EVALUATION SUMMARY (DATA SCIENCE MODEL 2)")
    print("=" * 80)
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
