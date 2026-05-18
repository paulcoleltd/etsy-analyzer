import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from src.ml.niche_scorer import calculate_niche_score, opportunity_score


def test_score_range():
    r = calculate_niche_score({"volume_est": 500, "competing_count": 200, "avg_reviews": 20, "trend_direction": "stable"})
    assert 0.0 <= r["score"] <= 100.0

def test_rising_boosts_uncapped():
    base  = calculate_niche_score({"volume_est": 40, "competing_count": 2000, "avg_reviews": 80, "trend_direction": "stable"})
    risen = calculate_niche_score({"volume_est": 40, "competing_count": 2000, "avg_reviews": 80, "trend_direction": "rising"})
    assert risen["score"] > base["score"]

def test_excellent_rating():
    r = calculate_niche_score({"volume_est": 100000, "competing_count": 10, "avg_reviews": 2, "trend_direction": "rising"})
    assert r["rating"] == "excellent"

def test_saturated_rating():
    r = calculate_niche_score({"volume_est": 5, "competing_count": 100000, "avg_reviews": 1000, "trend_direction": "declining"})
    assert r["rating"] == "saturated"

def test_components_present():
    r = calculate_niche_score({"volume_est": 100, "competing_count": 50, "avg_reviews": 10})
    assert {"volume", "competition", "avg_reviews", "trend"} <= r["components"].keys()

def test_opportunity_score_range():
    s = opportunity_score({"num_reviews": 20, "listing_age_days": 90, "est_monthly_revenue": 500, "price_usd": 30})
    assert 0.0 <= s <= 100.0

def test_high_revenue_low_reviews():
    s = opportunity_score({"num_reviews": 3, "listing_age_days": 30, "est_monthly_revenue": 3000, "price_usd": 100})
    assert s > 50.0

def test_zero_volume():
    r = calculate_niche_score({"volume_est": 0, "competing_count": 100, "avg_reviews": 10})
    assert r["score"] == 0.0
