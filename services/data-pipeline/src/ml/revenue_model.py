"""
XGBoost revenue estimator.

Features used (must match FEATURES list exactly):
  num_reviews, review_velocity_30d, listing_age_days, price_usd,
  photo_count, has_video, shipping_free, is_bestseller,
  category_encoded, review_to_age_ratio

Training data comes from listings where we have enough review history
to infer rough sales velocity (review rate ≈ 3-5% of orders).
"""
from __future__ import annotations

import os
from pathlib import Path
from typing import Any

import joblib
import numpy as np
from sklearn.preprocessing import LabelEncoder

try:
    import xgboost as xgb
    XGB_AVAILABLE = True
except ImportError:
    XGB_AVAILABLE = False

from src.logger import logger

FEATURES = [
    "num_reviews",
    "review_velocity_30d",
    "listing_age_days",
    "price_usd",
    "photo_count",
    "has_video",
    "shipping_free",
    "is_bestseller",
    "category_encoded",
    "review_to_age_ratio",
]

# Top-15 Etsy categories (encoded 0-14)
CATEGORIES = [
    "Jewelry", "Clothing", "Home & Living", "Art & Collectibles",
    "Craft Supplies & Tools", "Weddings", "Toys & Games",
    "Bath & Beauty", "Bags & Purses", "Accessories",
    "Paper & Party Supplies", "Shoes", "Pet Supplies",
    "Books, Movies & Music", "Electronics & Accessories",
]


class RevenueEstimator:
    def __init__(self, model_path: str | None = None):
        self._category_encoder = LabelEncoder()
        self._category_encoder.fit(CATEGORIES + ["Other"])
        self._model: Any = None
        self._model_path = model_path or "models/revenue_model.joblib"

        if Path(self._model_path).exists():
            self._load()
        else:
            logger.warning("revenue_model_not_found", path=self._model_path,
                           msg="Using heuristic fallback until model is trained")

    # ── Public API ────────────────────────────────────────────────

    def predict(self, listing: dict[str, Any]) -> dict[str, Any]:
        if self._model is not None:
            return self._predict_xgb(listing)
        return self._heuristic(listing)

    def train(self, records: list[dict[str, Any]]) -> None:
        if not XGB_AVAILABLE:
            logger.warning("xgboost_not_installed")
            return

        X, y = [], []
        for r in records:
            revenue = r.get("known_monthly_revenue")
            if revenue is None:
                continue
            X.append(self._features(r))
            y.append(float(revenue))

        if len(X) < 100:
            logger.warning("insufficient_training_data", n=len(X))
            return

        X_arr = np.array(X, dtype=np.float32)
        y_arr = np.array(y, dtype=np.float32)

        model = xgb.XGBRegressor(
            n_estimators=300,
            max_depth=6,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            objective="reg:squarederror",
            random_state=42,
            n_jobs=-1,
        )
        model.fit(X_arr, y_arr)
        self._model = model

        Path(self._model_path).parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(model, self._model_path)
        logger.info("revenue_model_trained_and_saved", path=self._model_path, n=len(X))

    # ── Private ───────────────────────────────────────────────────

    def _load(self) -> None:
        try:
            self._model = joblib.load(self._model_path)
            logger.info("revenue_model_loaded", path=self._model_path)
        except Exception as exc:
            logger.error("revenue_model_load_failed", error=str(exc))

    def _encode_category(self, category: str | None) -> int:
        cat = category or "Other"
        if cat not in self._category_encoder.classes_:
            cat = "Other"
        return int(self._category_encoder.transform([cat])[0])

    def _features(self, listing: dict[str, Any]) -> list[float]:
        age = max(1, int(listing.get("listing_age_days") or self._DEFAULT_AGE_DAYS))
        reviews = int(listing.get("num_reviews") or 0)
        velocity = reviews / (age / 30)  # reviews per 30 days
        return [
            reviews,
            velocity,
            age,
            float(listing.get("price_usd") or 20.0),
            int(listing.get("photo_count") or 1),
            float(bool(listing.get("has_video"))),
            float(bool(listing.get("shipping_free"))),
            float(bool(listing.get("is_bestseller"))),
            float(self._encode_category(listing.get("category_l1"))),
            reviews / age,
        ]

    def _predict_xgb(self, listing: dict[str, Any]) -> dict[str, Any]:
        X = np.array([self._features(listing)], dtype=np.float32)
        monthly_revenue = max(0.0, float(self._model.predict(X)[0]))
        return self._format_result(listing, monthly_revenue)

    # Default age when listing_age_days is unknown.
    # 30 days was unrealistically low (treats all reviews as brand new → inflated velocity).
    # 180 days (6 months) is a conservative estimate for an established listing with reviews.
    _DEFAULT_AGE_DAYS = 180

    def _heuristic(self, listing: dict[str, Any]) -> dict[str, Any]:
        """Simple heuristic when no trained model is available."""
        reviews = int(listing.get("num_reviews") or 0)
        age = max(1, int(listing.get("listing_age_days") or self._DEFAULT_AGE_DAYS))
        price = float(listing.get("price_usd") or 20.0)

        # ~4 reviews per 100 orders (industry average)
        monthly_orders = (reviews / age * 30) / 0.04
        monthly_revenue = monthly_orders * price

        # Bestseller boost
        if listing.get("is_bestseller"):
            monthly_revenue *= 1.4
        if listing.get("shipping_free"):
            monthly_revenue *= 1.1

        return self._format_result(listing, monthly_revenue)

    @staticmethod
    def _format_result(listing: dict[str, Any], monthly_revenue: float) -> dict[str, Any]:
        price = float(listing.get("price_usd") or 20.0)
        monthly_units = max(1, int(monthly_revenue / max(1.0, price)))
        reviews = int(listing.get("num_reviews") or 0)

        if reviews > 50:
            confidence = "high"
        elif reviews > 10:
            confidence = "medium"
        else:
            confidence = "low"

        return {
            "est_monthly_revenue_usd": round(monthly_revenue, 2),
            "est_monthly_units": monthly_units,
            "confidence": confidence,
        }


# Singleton
_estimator: RevenueEstimator | None = None


def get_estimator() -> RevenueEstimator:
    global _estimator
    if _estimator is None:
        _estimator = RevenueEstimator()
    return _estimator
