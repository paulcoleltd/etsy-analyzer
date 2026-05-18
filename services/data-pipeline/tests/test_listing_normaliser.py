import pytest
from src.normaliser.listing_normaliser import normalise_listing, _clean_tags, _parse_price
from src.normaliser.currency import to_usd


class TestParsePrice:
    def test_simple_float(self):
        assert _parse_price("24.99") == 24.99

    def test_with_currency_symbol(self):
        assert _parse_price("$34.50") == 34.5

    def test_with_comma(self):
        assert _parse_price("1,299.00") == 1299.0

    def test_none_input(self):
        assert _parse_price(None) is None

    def test_empty_string(self):
        assert _parse_price("") is None


class TestCleanTags:
    def test_deduplication(self):
        tags = ["ring", "Ring", "ring", "necklace"]
        result = _clean_tags(tags)
        assert result.count("ring") == 1

    def test_max_13_tags(self):
        tags = [f"tag{i}" for i in range(20)]
        result = _clean_tags(tags)
        assert len(result) <= 13

    def test_strips_special_chars(self):
        tags = ["hand-made!", "silver@ring"]
        result = _clean_tags(tags)
        assert all("!" not in t and "@" not in t for t in result)

    def test_removes_tags_over_20_chars(self):
        tags = ["a" * 21, "short"]
        result = _clean_tags(tags)
        assert "a" * 21 not in result
        assert "short" in result


class TestCurrencyConversion:
    def test_usd_no_change(self):
        assert to_usd(100.0, "USD") == 100.0

    def test_gbp_conversion(self):
        result = to_usd(100.0, "GBP")
        assert result > 100.0  # GBP > USD

    def test_unknown_currency_fallback(self):
        result = to_usd(50.0, "XYZ")
        assert result == 50.0  # fallback rate 1.0

    def test_case_insensitive(self):
        assert to_usd(100.0, "eur") == to_usd(100.0, "EUR")


class TestNormaliseListing:
    def _raw(self, **kwargs):
        base = {
            "etsy_listing_id": "123456",
            "title": "Beautiful Silver Ring",
            "price_raw": "29.99",
            "currency": "USD",
            "tags": ["silver", "ring", "handmade"],
            "num_reviews": 42,
            "avg_rating": 4.8,
            "photo_count": 5,
            "has_video": False,
            "shipping_free": True,
            "is_bestseller": False,
            "category_path": ["Jewelry", "Rings"],
            "description": "A lovely ring",
            "photo_urls": [],
        }
        base.update(kwargs)
        return base

    def test_basic_normalisation(self):
        record = normalise_listing(self._raw(), shop_id="testshop")
        assert record.etsy_listing_id == "123456"
        assert record.price == 29.99
        assert record.price_usd == 29.99
        assert record.currency == "USD"
        assert record.category_l1 == "Jewelry"
        assert record.num_reviews == 42

    def test_category_normalisation(self):
        raw = self._raw(category_path=["jewellery", "bracelets"])
        record = normalise_listing(raw, shop_id="shop1")
        assert record.category_l1 == "Jewelry"

    def test_gbp_price_converted(self):
        raw = self._raw(price_raw="20.00", currency="GBP")
        record = normalise_listing(raw, shop_id="shop1")
        assert record.price_usd is not None
        assert record.price_usd > 20.0

    def test_to_db_dict_has_required_keys(self):
        record = normalise_listing(self._raw(), shop_id="shop1")
        d = record.to_db_dict()
        for key in ("etsy_listing_id", "shop_id", "tags", "price_usd", "is_active"):
            assert key in d

    def test_long_title_truncated(self):
        raw = self._raw(title="x" * 300)
        record = normalise_listing(raw, shop_id="shop1")
        assert len(record.title) <= 200

    def test_none_title_becomes_none(self):
        raw = self._raw(title=None)
        record = normalise_listing(raw, shop_id="shop1")
        assert record.title is None
