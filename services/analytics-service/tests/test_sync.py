import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from datetime import datetime, timezone, timedelta
from src.etsy.sync import _estimate_revenue_30d


def _make_tx(listing_id: str, amount_cents: int, days_ago: int = 0, qty: int = 1) -> dict:
    ts = int((datetime.now(timezone.utc) - timedelta(days=days_ago)).timestamp())
    return {
        "listing_id": listing_id,
        "paid_timestamp": ts,
        "quantity": qty,
        "price": {"amount": amount_cents, "divisor": 100},
    }


class TestEstimateRevenue30d:
    def test_single_transaction_counted(self):
        txs = [_make_tx("123", 2500, days_ago=5)]
        result = _estimate_revenue_30d(txs)
        assert "123" in result
        assert abs(result["123"]["revenue"] - 25.0) < 0.01

    def test_old_transaction_excluded(self):
        txs = [_make_tx("123", 2500, days_ago=35)]
        result = _estimate_revenue_30d(txs)
        assert "123" not in result

    def test_multiple_transactions_summed(self):
        txs = [
            _make_tx("456", 1000, days_ago=1),
            _make_tx("456", 2000, days_ago=10),
            _make_tx("456", 1500, days_ago=29),
        ]
        result = _estimate_revenue_30d(txs)
        assert abs(result["456"]["revenue"] - 45.0) < 0.01
        assert result["456"]["units"] == 3

    def test_multiple_listings(self):
        txs = [
            _make_tx("A", 1000, days_ago=2),
            _make_tx("B", 2000, days_ago=3),
        ]
        result = _estimate_revenue_30d(txs)
        assert "A" in result and "B" in result

    def test_missing_listing_id_skipped(self):
        txs = [{"paid_timestamp": int(datetime.now(timezone.utc).timestamp()),
                "price": {"amount": 500, "divisor": 100}, "quantity": 1}]
        result = _estimate_revenue_30d(txs)
        assert len(result) == 0

    def test_quantity_accumulated(self):
        txs = [_make_tx("999", 500, days_ago=1, qty=3)]
        result = _estimate_revenue_30d(txs)
        assert result["999"]["units"] == 3
        assert abs(result["999"]["revenue"] - 5.0) < 0.01

    def test_boundary_transaction_included(self):
        # Exactly 29 days ago — should be included
        txs = [_make_tx("LID", 1000, days_ago=29)]
        result = _estimate_revenue_30d(txs)
        assert "LID" in result

    def test_empty_transactions(self):
        assert _estimate_revenue_30d([]) == {}
