import pytest
from src.ml.revenue_model import RevenueEstimator


@pytest.fixture
def estimator():
    return RevenueEstimator(model_path="nonexistent_path.joblib")  # falls back to heuristic


class TestRevenueEstimatorHeuristic:
    def test_zero_reviews_returns_low_confidence(self, estimator):
        result = estimator.predict({"num_reviews": 0, "price_usd": 25, "listing_age_days": 60})
        assert result["confidence"] == "low"
        assert result["est_monthly_revenue_usd"] >= 0

    def test_high_reviews_returns_high_confidence(self, estimator):
        result = estimator.predict({
            "num_reviews": 200, "price_usd": 30,
            "listing_age_days": 365, "is_bestseller": True,
        })
        assert result["confidence"] == "high"
        assert result["est_monthly_revenue_usd"] > 0
        assert result["est_monthly_units"] >= 1

    def test_bestseller_boost_is_applied(self, estimator):
        base = estimator.predict({"num_reviews": 50, "price_usd": 20, "listing_age_days": 180})
        boosted = estimator.predict({
            "num_reviews": 50, "price_usd": 20,
            "listing_age_days": 180, "is_bestseller": True,
        })
        assert boosted["est_monthly_revenue_usd"] > base["est_monthly_revenue_usd"]

    def test_free_shipping_boost(self, estimator):
        base = estimator.predict({"num_reviews": 30, "price_usd": 40, "listing_age_days": 90})
        boosted = estimator.predict({
            "num_reviews": 30, "price_usd": 40,
            "listing_age_days": 90, "shipping_free": True,
        })
        assert boosted["est_monthly_revenue_usd"] > base["est_monthly_revenue_usd"]

    def test_medium_reviews_confidence(self, estimator):
        result = estimator.predict({"num_reviews": 25, "price_usd": 15, "listing_age_days": 120})
        assert result["confidence"] == "medium"

    def test_output_keys_present(self, estimator):
        result = estimator.predict({"num_reviews": 10, "price_usd": 10, "listing_age_days": 30})
        assert "est_monthly_revenue_usd" in result
        assert "est_monthly_units" in result
        assert "confidence" in result

    def test_monthly_units_consistent_with_revenue(self, estimator):
        price = 50.0
        result = estimator.predict({"num_reviews": 80, "price_usd": price, "listing_age_days": 200})
        # units * price should be close to revenue (allow rounding)
        expected_revenue = result["est_monthly_units"] * price
        assert abs(expected_revenue - result["est_monthly_revenue_usd"]) <= price
