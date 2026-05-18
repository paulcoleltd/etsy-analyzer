import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from src.grader.engine import grade_listing, _letter_grade


class TestLetterGrade:
    def test_a_threshold(self):
        assert _letter_grade(85.0) == "A"
        assert _letter_grade(100.0) == "A"

    def test_b_threshold(self):
        assert _letter_grade(70.0) == "B"
        assert _letter_grade(84.9) == "B"

    def test_c_threshold(self):
        assert _letter_grade(55.0) == "C"

    def test_d_threshold(self):
        assert _letter_grade(40.0) == "D"

    def test_f_threshold(self):
        assert _letter_grade(0.0) == "F"
        assert _letter_grade(39.9) == "F"


def _listing(**kwargs):
    defaults = {
        "title": "Handmade Silver Ring",
        "tags": ["silver ring", "handmade", "gift"],
        "description": None,
        "photo_count": 3,
        "price_usd": 25.0,
        "shipping_free": False,
    }
    return {**defaults, **kwargs}


class TestGradeListing:
    def test_returns_grade_result(self):
        result = grade_listing(_listing())
        assert result.overall_grade in {"A", "B", "C", "D", "F"}
        assert 0.0 <= result.overall_score <= 100.0

    def test_all_dimension_keys_present(self):
        result = grade_listing(_listing())
        dims = result.dimension_scores.to_dict()
        assert set(dims.keys()) == {"title", "tags", "description", "photos", "price", "shipping"}

    def test_excellent_listing_scores_high(self):
        tags = [f"tag{i}" for i in range(13)]
        listing = _listing(
            title="Handmade Sterling Silver Ring Minimalist Jewelry Gift for Her Dainty Band Custom",
            tags=tags,
            description="Beautiful handmade ring. " * 100 + "Message me to customise!",
            photo_count=10,
            price_usd=30.0,
            shipping_free=True,
        )
        result = grade_listing(listing)
        assert result.overall_score >= 60  # realistic with neutral image scores
        assert result.overall_grade in {"A", "B", "C"}

    def test_empty_listing_scores_low(self):
        result = grade_listing({
            "title": None, "tags": [], "description": None,
            "photo_count": 0, "price_usd": None, "shipping_free": False,
        })
        assert result.overall_grade in {"D", "F"}

    def test_free_shipping_improves_score(self):
        paid = grade_listing(_listing(shipping_free=False))
        free = grade_listing(_listing(shipping_free=True))
        assert free.overall_score > paid.overall_score

    def test_more_photos_improves_score(self):
        few = grade_listing(_listing(photo_count=1))
        many = grade_listing(_listing(photo_count=10))
        assert many.overall_score > few.overall_score

    def test_to_dict_serialisable(self):
        import json
        result = grade_listing(_listing())
        json.dumps(result.to_dict())  # should not raise

    def test_image_scores_improve_photo_dimension(self):
        no_imgs = grade_listing(_listing(photo_count=5), image_scores=[])
        with_imgs = grade_listing(
            _listing(photo_count=5),
            image_scores=[{"overall_score": 95}] * 5,
        )
        assert with_imgs.dimension_scores.photos >= no_imgs.dimension_scores.photos


class TestAiSuggestions:
    """Tests for the heuristic fallback (no API key needed)."""

    def test_heuristic_short_title(self):
        from src.ai.suggestions import _heuristic_suggestions
        result = _heuristic_suggestions(
            {"title": "ring", "tags": ["silver ring"], "photo_count": 3},
            {"title": 20.0, "tags": 80.0, "description": 80.0,
             "photos": 80.0, "price": 80.0, "shipping": 80.0},
        )
        assert any("title" in a.lower() or "keyword" in a.lower()
                   for a in result["priority_actions"])

    def test_heuristic_missing_tags(self):
        from src.ai.suggestions import _heuristic_suggestions
        result = _heuristic_suggestions(
            {"title": "Silver Ring", "tags": ["ring"], "photo_count": 5},
            {"title": 70.0, "tags": 10.0, "description": 70.0,
             "photos": 70.0, "price": 70.0, "shipping": 70.0},
        )
        assert result["tag_additions"]

    def test_heuristic_few_photos(self):
        from src.ai.suggestions import _heuristic_suggestions
        result = _heuristic_suggestions(
            {"title": "Silver Ring", "tags": ["ring"] * 13, "photo_count": 2},
            {"title": 70.0, "tags": 100.0, "description": 70.0,
             "photos": 15.0, "price": 70.0, "shipping": 70.0},
        )
        assert result["photo_tips"]
