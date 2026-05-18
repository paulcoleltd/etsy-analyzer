import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from src.clustering.bert_clusterer import cluster_keywords


def test_returns_clusters():
    kws = ["silver ring", "gold ring", "diamond ring", "wedding invitation", "birthday card"]
    result = cluster_keywords(kws)
    assert isinstance(result, list)
    assert len(result) >= 1

def test_all_keywords_accounted_for():
    kws = ["blue mug", "red mug", "green mug", "notebook", "journal"]
    clusters = cluster_keywords(kws)
    all_kws = [k for c in clusters for k in c["keywords"]]
    assert set(all_kws) == set(kws)

def test_single_keyword():
    result = cluster_keywords(["silver ring"])
    assert len(result) == 1
    assert result[0]["keywords"] == ["silver ring"]

def test_cluster_size_field():
    kws = ["a", "b", "c"]
    clusters = cluster_keywords(kws)
    for c in clusters:
        assert c["size"] == len(c["keywords"])

def test_empty_input():
    result = cluster_keywords([])
    assert isinstance(result, list)

def test_two_keywords():
    result = cluster_keywords(["ring", "necklace"])
    assert isinstance(result, list)
    total = sum(len(c["keywords"]) for c in result)
    assert total == 2


def test_title_optimise_fallback():
    """Fallback works without ANTHROPIC_API_KEY."""
    from src.optimiser.title_ai import _fallback
    result = _fallback("Handmade Silver Ring", ["custom jewellery", "gift for her"])
    assert "title" in result
    assert len(result["title"]) <= 140
    assert "explanation" in result
    assert "keywords_used" in result


def test_title_optimise_fallback_no_market_kws():
    from src.optimiser.title_ai import _fallback
    result = _fallback("Blue Ceramic Mug", [])
    assert result["title"] == "Blue Ceramic Mug"[:140]
