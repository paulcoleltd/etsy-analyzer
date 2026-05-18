import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from src.grader.dimensions import (
    score_title, score_tags, score_description,
    score_photos, score_price, score_shipping,
)


class TestScoreTitle:
    def test_perfect_title(self):
        tags = ["silver ring", "handmade", "gift for her", "minimalist", "sterling"]
        title = "Silver Ring Handmade Sterling Silver Minimalist Gift for Her Dainty Band"
        score = score_title(title, tags)
        assert score >= 70

    def test_empty_title_is_zero(self):
        assert score_title("", []) == 0.0

    def test_short_title_low_score(self):
        assert score_title("ring", ["silver ring"]) < 50

    def test_all_caps_penalty(self):
        base = score_title("Beautiful handmade silver ring gift for her", ["silver ring"])
        caps = score_title("BEAUTIFUL HANDMADE SILVER RING GIFT FOR HER", ["silver ring"])
        assert caps < base

    def test_score_in_range(self):
        s = score_title("Handmade Silver Ring | Minimalist Jewelry | Gift for Her", ["silver ring", "gift"])
        assert 0.0 <= s <= 100.0


class TestScoreTags:
    def test_13_tags_is_perfect(self):
        assert score_tags(["tag"] * 13) == 100.0

    def test_zero_tags_is_zero(self):
        assert score_tags([]) == 0.0

    def test_partial_tags_between(self):
        s = score_tags(["tag"] * 7)
        assert 40.0 < s < 80.0

    def test_monotone_increase(self):
        scores = [score_tags(["t"] * i) for i in range(14)]
        for i in range(1, len(scores)):
            assert scores[i] >= scores[i - 1]


class TestScoreDescription:
    def test_none_is_zero(self):
        assert score_description(None) == 0.0

    def test_empty_is_zero(self):
        assert score_description("") == 0.0

    def test_long_description_high_score(self):
        desc = "A beautiful ring. " * 100  # ~1800 chars
        assert score_description(desc) >= 40

    def test_cta_gives_bonus(self):
        base = score_description("A beautiful ring. " * 50)
        with_cta = score_description("A beautiful ring. " * 50 + " Message me to customise!")
        assert with_cta >= base

    def test_bullets_give_bonus(self):
        base = score_description("Feature one\nFeature two\nFeature three " * 20)
        bulleted = score_description("• Feature one\n• Feature two\n• Feature three " * 20)
        assert bulleted >= base


class TestScorePhotos:
    def test_no_photos_low_score(self):
        assert score_photos(0, []) < 20

    def test_ten_photos_high_score(self):
        assert score_photos(10, []) >= 60

    def test_quality_bonus_applied(self):
        base = score_photos(5, [])
        with_quality = score_photos(5, [{"overall_score": 90}] * 3)
        assert with_quality > base

    def test_score_capped_at_100(self):
        assert score_photos(10, [{"overall_score": 100}] * 5) <= 100.0


class TestScorePrice:
    def test_no_price_neutral(self):
        assert score_price(None, None) == 50.0

    def test_competitive_price_high_score(self):
        assert score_price(25.0, 24.0) >= 85.0

    def test_very_low_price_lower_score(self):
        assert score_price(5.0, 50.0) < 50.0

    def test_no_median_acceptable_price(self):
        assert score_price(15.0, None) >= 50.0


class TestScoreShipping:
    def test_free_shipping_is_perfect(self):
        assert score_shipping(True) == 100.0

    def test_paid_shipping_is_lower(self):
        assert score_shipping(False) < 100.0
        assert score_shipping(False) > 0.0
