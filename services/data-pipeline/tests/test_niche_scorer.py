import pytest
from src.ml.niche_scorer import calculate_niche_score, calculate_opportunity_score


class TestNicheScorer:
    def test_score_range(self):
        result = calculate_niche_score({
            "volume_est": 1000, "competing_count": 500,
            "avg_reviews": 20, "trend_direction": "stable",
        })
        assert 0.0 <= result["score"] <= 100.0

    def test_rising_trend_boosts_score(self):
        # Use values where raw_score < 100/1.3 so the rising multiplier isn't clamped away
        base = calculate_niche_score({
            "volume_est": 40, "competing_count": 2000,
            "avg_reviews": 80, "trend_direction": "stable",
        })
        rising = calculate_niche_score({
            "volume_est": 40, "competing_count": 2000,
            "avg_reviews": 80, "trend_direction": "rising",
        })
        assert rising["score"] > base["score"]

    def test_declining_trend_reduces_score(self):
        base = calculate_niche_score({
            "volume_est": 40, "competing_count": 2000,
            "avg_reviews": 80, "trend_direction": "stable",
        })
        declining = calculate_niche_score({
            "volume_est": 40, "competing_count": 2000,
            "avg_reviews": 80, "trend_direction": "declining",
        })
        assert declining["score"] < base["score"]

    def test_high_competition_lowers_score(self):
        low = calculate_niche_score({
            "volume_est": 200, "competing_count": 500,
            "avg_reviews": 50, "trend_direction": "stable",
        })
        high = calculate_niche_score({
            "volume_est": 200, "competing_count": 50000,
            "avg_reviews": 50, "trend_direction": "stable",
        })
        assert low["score"] > high["score"]

    def test_excellent_rating_for_high_score(self):
        result = calculate_niche_score({
            "volume_est": 50000, "competing_count": 10,
            "avg_reviews": 2, "trend_direction": "rising",
        })
        assert result["rating"] == "excellent"

    def test_saturated_rating_for_low_score(self):
        result = calculate_niche_score({
            "volume_est": 10, "competing_count": 50000,
            "avg_reviews": 500, "trend_direction": "declining",
        })
        assert result["rating"] == "saturated"

    def test_components_returned(self):
        result = calculate_niche_score({
            "volume_est": 200, "competing_count": 50,
            "avg_reviews": 5, "trend_direction": "stable",
        })
        assert "volume" in result["components"]
        assert "competition" in result["components"]
        assert "avg_reviews" in result["components"]
        assert "trend" in result["components"]

    def test_zero_volume_gives_zero_score(self):
        result = calculate_niche_score({
            "volume_est": 0, "competing_count": 100,
            "avg_reviews": 10, "trend_direction": "stable",
        })
        assert result["score"] == 0.0


class TestOpportunityScore:
    def test_score_range(self):
        score = calculate_opportunity_score({
            "num_reviews": 20, "listing_age_days": 90,
            "est_monthly_revenue": 300, "price_usd": 25,
        })
        assert 0.0 <= score <= 100.0

    def test_high_revenue_low_reviews_gives_high_score(self):
        score = calculate_opportunity_score({
            "num_reviews": 5, "listing_age_days": 30,
            "est_monthly_revenue": 2000, "price_usd": 80,
        })
        assert score > 50.0

    def test_low_revenue_high_reviews_gives_low_score(self):
        score = calculate_opportunity_score({
            "num_reviews": 500, "listing_age_days": 365,
            "est_monthly_revenue": 10, "price_usd": 5,
        })
        assert score < 50.0
