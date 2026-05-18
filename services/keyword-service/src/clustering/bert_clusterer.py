"""
Keyword clustering using sentence embeddings + DBSCAN.
Falls back to simple prefix grouping if sentence-transformers is unavailable.
"""
from __future__ import annotations

from typing import Any

try:
    from sentence_transformers import SentenceTransformer
    from sklearn.cluster import DBSCAN
    import numpy as np

    _MODEL: SentenceTransformer | None = None

    def _get_model() -> SentenceTransformer:
        global _MODEL
        if _MODEL is None:
            _MODEL = SentenceTransformer("all-MiniLM-L6-v2")
        return _MODEL

    def cluster_keywords(keywords: list[str]) -> list[dict[str, Any]]:
        if len(keywords) < 2:
            return [{"keywords": keywords, "size": len(keywords), "label": keywords[0] if keywords else ""}]

        model = _get_model()
        embeddings = model.encode(keywords)
        labels = DBSCAN(eps=0.35, min_samples=2, metric="cosine").fit(embeddings).labels_

        clusters: dict[int, list[str]] = {}
        noise: list[str] = []
        for idx, label in enumerate(labels):
            if label == -1:
                noise.append(keywords[idx])
            else:
                clusters.setdefault(int(label), []).append(keywords[idx])

        result = [
            {"keywords": kws, "size": len(kws), "label": kws[0]}
            for kws in clusters.values()
        ]
        if noise:
            result.append({"keywords": noise, "size": len(noise), "label": "other"})
        return result

    BERT_AVAILABLE = True

except ImportError:
    BERT_AVAILABLE = False

    def cluster_keywords(keywords: list[str]) -> list[dict[str, Any]]:  # type: ignore[misc]
        """Fallback: group by first word."""
        groups: dict[str, list[str]] = {}
        for kw in keywords:
            prefix = kw.split()[0] if kw.split() else kw
            groups.setdefault(prefix, []).append(kw)
        return [
            {"keywords": v, "size": len(v), "label": k}
            for k, v in groups.items()
        ]
