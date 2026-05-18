"""
Data Integrity Tests — Etsy Analyzer (data-pipeline service)
DataValidator Agent Output

Tests for ML models, niche scoring, currency conversion, and normaliser.
Grade Engine tests live in: services/grader-service/tests/test_engine.py

Run: PYTHONPATH=. pytest tests/test_data_integrity.py -v
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from src.ml.revenue_model import RevenueEstimator
from src.ml.niche_scorer import calculate_niche_score, calculate_opportunity_score
from src.normaliser.currency import to_usd, _RATES_TO_USD
from src.normaliser.listing_normaliser import normalise_listing


# ══════════════════════════════════════════════════════════════════
# 1. Revenue Estimator
# ══════════════════════════════════════════════════════════════════

@pytest.fixture(scope="module")
def estimator():
    return RevenueEstimator(model_path="nonexistent.joblib")  # heuristic fallback


class TestRevenueEstimatorIntegrity:
    def test_output_is_non_negative(self, estimator):
        result = estimator.predict({"num_reviews": 0, "price_usd": 10, "listing_age_days": 30})
        assert result["est_monthly_revenue_usd"] >= 0

    def test_units_is_non_negative(self, estimator):
        result = estimator.predict({"num_reviews": 5, "price_usd": 15, "listing_age_days": 60})
        assert result["est_monthly_units"] >= 0

    def test_confidence_low_for_zero_reviews(self, estimator):
        result = estimator.predict({"num_reviews": 0, "price_usd": 20, "listing_age_days": 30})
        assert result["confidence"] == "low"

    def test_confidence_low_for_nine_reviews(self, estimator):
        result = estimator.predict({"num_reviews": 9, "price_usd": 20, "listing_age_days": 60})
        assert result["confidence"] == "low"

    def test_confidence_medium_at_eleven_reviews(self, estimator):
        # threshold is reviews > 10, so 11 is the first medium value
        result = estimator.predict({"num_reviews": 11, "price_usd": 20, "listing_age_days": 60})
        assert result["confidence"] == "medium"

    def test_confidence_medium_for_49_reviews(self, estimator):
        result = estimator.predict({"num_reviews": 49, "price_usd": 20, "listing_age_days": 60})
        assert result["confidence"] == "medium"

    def test_confidence_high_at_fifty_one_reviews(self, estimator):
        # threshold is reviews > 50, so 51 is the first high value
        result = estimator.predict({"num_reviews": 51, "price_usd": 20, "listing_age_days": 365})
        assert result["confidence"] == "high"

    def test_units_times_price_approx_revenue(self, estimator):
        price = 30.0
        result = estimator.predict({"num_reviews": 80, "price_usd": price, "listing_age_days": 200})
        revenue = result["est_monthly_revenue_usd"]
        units = result["est_monthly_units"]
        # units * price should be within one price unit of revenue
        assert abs(units * price - revenue) <= price

    def test_revenue_increases_with_reviews(self, estimator):
        low = estimator.predict({"num_reviews": 5, "price_usd": 25, "listing_age_days": 90})
        high = estimator.predict({"num_reviews": 200, "price_usd": 25, "listing_age_days": 90})
        assert high["est_monthly_revenue_usd"] >= low["est_monthly_revenue_usd"]

    def test_bestseller_boost_is_positive(self, estimator):
        base = estimator.predict({"num_reviews": 30, "price_usd": 25, "listing_age_days": 120})
        boosted = estimator.predict({"num_reviews": 30, "price_usd": 25, "listing_age_days": 120, "is_bestseller": True})
        assert boosted["est_monthly_revenue_usd"] > base["est_monthly_revenue_usd"]

    def test_free_shipping_boost_is_positive(self, estimator):
        base = estimator.predict({"num_reviews": 30, "price_usd": 25, "listing_age_days": 120})
        free = estimator.predict({"num_reviews": 30, "price_usd": 25, "listing_age_days": 120, "shipping_free": True})
        assert free["est_monthly_revenue_usd"] > base["est_monthly_revenue_usd"]

    def test_result_has_all_required_keys(self, estimator):
        result = estimator.predict({"num_reviews": 10, "price_usd": 15})
        assert "est_monthly_revenue_usd" in result
        assert "est_monthly_units" in result
        assert "confidence" in result

    def test_confidence_values_are_enumerated(self, estimator):
        valid = {"low", "medium", "high"}
        for reviews in [0, 10, 50, 200]:
            result = estimator.predict({"num_reviews": reviews, "price_usd": 20, "listing_age_days": 90})
            assert result["confidence"] in valid


# ══════════════════════════════════════════════════════════════════
# 2. Niche Scorer
# ══════════════════════════════════════════════════════════════════

class TestNicheScorerIntegrity:
    def test_score_always_0_to_100(self):
        for vol, comp, reviews in [(0, 1, 1), (1000, 1, 1), (1, 1000000, 1000)]:
            r = calculate_niche_score({"volume_est": vol, "competing_count": comp, "avg_reviews": reviews})
            assert 0.0 <= r["score"] <= 100.0

    def test_zero_volume_gives_zero_score(self):
        r = calculate_niche_score({"volume_est": 0, "competing_count": 100, "avg_reviews": 10})
        assert r["score"] == 0.0

    def test_rising_gt_stable_when_uncapped(self):
        base_data = {"volume_est": 40, "competing_count": 2000, "avg_reviews": 80}
        stable  = calculate_niche_score({**base_data, "trend_direction": "stable"})
        rising  = calculate_niche_score({**base_data, "trend_direction": "rising"})
        assert rising["score"] > stable["score"]

    def test_stable_gt_declining_when_uncapped(self):
        base_data = {"volume_est": 40, "competing_count": 2000, "avg_reviews": 80}
        stable   = calculate_niche_score({**base_data, "trend_direction": "stable"})
        declining = calculate_niche_score({**base_data, "trend_direction": "declining"})
        assert stable["score"] > declining["score"]

    def test_excellent_rating_threshold_is_70(self):
        # Construct inputs that score ≥70 → excellent
        r = calculate_niche_score({"volume_est": 100000, "competing_count": 10, "avg_reviews": 2, "trend_direction": "rising"})
        assert r["rating"] == "excellent"

    def test_saturated_rating_for_low_score(self):
        r = calculate_niche_score({"volume_est": 5, "competing_count": 100000, "avg_reviews": 1000, "trend_direction": "declining"})
        assert r["rating"] == "saturated"

    def test_components_dict_has_required_keys(self):
        r = calculate_niche_score({"volume_est": 100, "competing_count": 50, "avg_reviews": 10})
        assert set(r["components"].keys()) == {"volume", "competition", "avg_reviews", "trend"}

    def test_opportunity_score_0_to_100(self):
        s = calculate_opportunity_score({"num_reviews": 20, "listing_age_days": 90, "est_monthly_revenue": 500, "price_usd": 30})
        assert 0.0 <= s <= 100.0

    def test_higher_revenue_raises_opportunity_score(self):
        low  = calculate_opportunity_score({"num_reviews": 5, "est_monthly_revenue": 50,  "price_usd": 20})
        high = calculate_opportunity_score({"num_reviews": 5, "est_monthly_revenue": 500, "price_usd": 20})
        assert high > low


# ══════════════════════════════════════════════════════════════════
# 3. Currency Conversion
# ══════════════════════════════════════════════════════════════════

class TestCurrencyConversion:
    def test_usd_to_usd_is_identity(self):
        assert to_usd(100.0, "USD") == 100.0

    def test_all_20_currencies_produce_nonzero(self):
        for currency in _RATES_TO_USD.keys():
            result = to_usd(100.0, currency)
            assert result > 0, f"{currency} → {result}"

    def test_case_insensitive(self):
        assert to_usd(50.0, "gbp") == to_usd(50.0, "GBP")

    def test_unknown_currency_fallback_is_1_to_1(self):
        assert to_usd(75.0, "XYZ") == 75.0

    def test_gbp_greater_than_usd_per_unit(self):
        # £1 should be worth more than $1
        assert to_usd(1.0, "GBP") > 1.0

    def test_jpy_less_than_usd_per_unit(self):
        # ¥1 should be worth less than $1
        assert to_usd(1.0, "JPY") < 1.0

    def test_result_is_rounded_to_2_decimal_places(self):
        result = to_usd(100.0, "EUR")
        assert result == round(result, 2)


@pytest.mark.parametrize("currency", list(_RATES_TO_USD.keys()))
def test_currency_converts_100_to_positive(currency: str):
    assert to_usd(100.0, currency) > 0


# ══════════════════════════════════════════════════════════════════
# 4. Listing Normaliser
# ══════════════════════════════════════════════════════════════════

def _raw(**kwargs):
    base = {
        "etsy_listing_id": "111",
        "title": "Beautiful Silver Ring",
        "price_raw": "25.00",
        "currency": "USD",
        "tags": ["silver", "ring", "handmade"],
        "num_reviews": 10,
        "avg_rating": 4.5,
        "photo_count": 3,
        "has_video": False,
        "shipping_free": False,
        "is_bestseller": False,
        "category_path": ["Jewelry", "Rings"],
        "description": "A lovely ring.",
        "photo_urls": [],
    }
    base.update(kwargs)
    return base


class TestListingNormaliser:
    def test_title_truncated_at_200_chars(self):
        r = normalise_listing(_raw(title="x" * 300), shop_id="shop1")
        assert r.title is not None
        assert len(r.title) <= 200

    def test_tags_deduplicated(self):
        r = normalise_listing(_raw(tags=["ring", "Ring", "RING", "necklace"]), shop_id="shop1")
        assert r.tags.count("ring") == 1

    def test_max_13_tags(self):
        r = normalise_listing(_raw(tags=[f"tag{i}" for i in range(20)]), shop_id="shop1")
        assert len(r.tags) <= 13

    def test_unknown_category_maps_gracefully(self):
        r = normalise_listing(_raw(category_path=["Completely Unknown Category", "Sub"]), shop_id="s")
        assert r.category_l1 is not None  # falls back to raw value
        assert isinstance(r.category_l1, str)

    def test_gbp_price_converted_to_usd(self):
        r = normalise_listing(_raw(price_raw="20.00", currency="GBP"), shop_id="shop1")
        assert r.price_usd is not None
        assert r.price_usd > 20.0  # GBP > USD

    def test_empty_title_becomes_none(self):
        r = normalise_listing(_raw(title=""), shop_id="shop1")
        assert r.title is None

    def test_none_title_stays_none(self):
        r = normalise_listing(_raw(title=None), shop_id="shop1")
        assert r.title is None

    def test_normalised_currency_is_uppercase(self):
        r = normalise_listing(_raw(currency="usd"), shop_id="shop1")
        assert r.currency == "USD"


# ══════════════════════════════════════════════════════════════════
# 5. ListingRecord data contracts
# (Grade Engine integrity tests → services/grader-service/tests/test_engine.py)
# ══════════════════════════════════════════════════════════════════

class TestListingRecordContracts:
    _REQUIRED_DB_KEYS = {
        "etsy_listing_id", "shop_id", "tags", "price", "currency",
        "price_usd", "photo_count", "has_video", "shipping_free",
        "is_bestseller", "num_reviews", "is_active",
    }
    _REQUIRED_ES_KEYS = {
        "etsy_listing_id", "shop_id", "tags", "price_usd",
        "photo_count", "is_active",
    }

    def _make_record(self):
        return normalise_listing(_raw(), shop_id="testshop")

    def test_to_db_dict_has_required_keys(self):
        d = self._make_record().to_db_dict()
        missing = self._REQUIRED_DB_KEYS - set(d.keys())
        assert not missing, f"Missing DB keys: {missing}"

    def test_to_es_doc_has_required_keys(self):
        d = self._make_record().to_es_doc()
        missing = self._REQUIRED_ES_KEYS - set(d.keys())
        assert not missing, f"Missing ES keys: {missing}"

    def test_es_doc_excludes_description(self):
        d = self._make_record().to_es_doc()
        assert "description" not in d

    def test_db_dict_is_json_serialisable(self):
        import json
        d = self._make_record().to_db_dict()
        json.dumps(d, default=str)

    def test_es_doc_is_json_serialisable(self):
        import json
        d = self._make_record().to_es_doc()
        json.dumps(d, default=str)

    def test_is_active_defaults_to_true(self):
        d = self._make_record().to_db_dict()
        assert d["is_active"] is True

    def test_tags_is_list(self):
        d = self._make_record().to_db_dict()
        assert isinstance(d["tags"], list)

    def test_last_scraped_is_iso_string(self):
        d = self._make_record().to_db_dict()
        # Should be an ISO datetime string
        assert isinstance(d["last_scraped"], str)
        assert "T" in d["last_scraped"]


# ══════════════════════════════════════════════════════════════════
# 6. Real listing analysis — Listing 4493579933
# ══════════════════════════════════════════════════════════════════

REAL_LISTING_RAW = {
    "etsy_listing_id": "4493579933",
    "title": "Vintage Cocktail Print Vinyl Record Bar Art | Retro Bar Decor | Home Bar Sign | Cocktail Art",
    "price_raw": "12.99",
    "currency": "GBP",
    "tags": [
        "vinyl record art", "bar decor", "cocktail print", "home bar",
        "retro bar sign", "vintage bar art", "wall art", "bar gift",
        "cocktail bar", "man cave decor", "bar wall art", "pub decor",
        "drinks sign",
    ],
    "num_reviews": 47,
    "avg_rating": 4.9,
    "photo_count": 6,
    "has_video": False,
    "shipping_free": False,
    "is_bestseller": True,
    "category_path": ["Home & Living", "Home Décor", "Wall Décor"],
    "description": "Unique vintage-style cocktail artwork printed onto a genuine vinyl record. Perfect for home bars, man caves, and cocktail enthusiasts. Makes a brilliant gift.",
    "photo_urls": [],
}

class TestRealListingAnalysis:
    """Validates our platform handles listing 4493579933 correctly."""

    @pytest.fixture(scope="class")
    def record(self):
        return normalise_listing(REAL_LISTING_RAW, shop_id="VinylRecordArtUK")

    @pytest.fixture(scope="class")
    def revenue(self):
        est = RevenueEstimator(model_path="nonexistent.joblib")
        raw = dict(REAL_LISTING_RAW)
        raw["price_usd"] = to_usd(float(REAL_LISTING_RAW["price_raw"]), "GBP")
        return est.predict(raw)

    def test_listing_id_preserved(self, record):
        assert record.etsy_listing_id == "4493579933"

    def test_gbp_price_converted_above_12_99(self, record):
        # £12.99 → > $12.99
        assert record.price_usd is not None
        assert record.price_usd > 12.99

    def test_all_13_tags_preserved(self, record):
        assert len(record.tags) == 13

    def test_category_l1_is_home(self, record):
        assert record.category_l1 == "Home & Living"

    def test_bestseller_flag(self, record):
        assert record.is_bestseller is True

    def test_revenue_confidence_is_medium(self, revenue):
        # 47 reviews → medium confidence (10–49 = medium)
        assert revenue["confidence"] == "medium"

    def test_revenue_is_positive(self, revenue):
        assert revenue["est_monthly_revenue_usd"] > 0

    def test_units_consistent_with_price(self, revenue, record):
        price = record.price_usd or 1.0
        rev = revenue["est_monthly_revenue_usd"]
        units = revenue["est_monthly_units"]
        assert abs(units * price - rev) <= price

    def test_niche_score_for_vinyl_bar_art(self):
        # Simulate niche data for "vinyl record bar art"
        score = calculate_niche_score({
            "volume_est": 8000,
            "competing_count": 3500,
            "avg_reviews": 25,
            "trend_direction": "stable",
        })
        assert 0.0 <= score["score"] <= 100.0
        assert score["rating"] in {"excellent", "good", "moderate", "saturated"}

    def test_opportunity_score_for_this_listing(self, record, revenue):
        d = record.to_db_dict()
        d["est_monthly_revenue"] = revenue["est_monthly_revenue_usd"]
        d["price_usd"] = record.price_usd
        d["num_reviews"] = record.num_reviews
        score = calculate_opportunity_score(d)
        assert 0.0 <= score <= 100.0
