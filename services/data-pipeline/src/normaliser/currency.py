"""
Static fallback exchange rates to USD.
In production these are refreshed daily via an open exchange-rates API.
"""
from datetime import date

# Rates as of 2025-07 — refreshed by a daily job in production
_RATES_TO_USD: dict[str, float] = {
    "USD": 1.0,
    "EUR": 1.09,
    "GBP": 1.27,
    "CAD": 0.73,
    "AUD": 0.66,
    "NZD": 0.60,
    "CHF": 1.11,
    "SEK": 0.093,
    "NOK": 0.093,
    "DKK": 0.146,
    "JPY": 0.0063,
    "HKD": 0.128,
    "SGD": 0.74,
    "MXN": 0.051,
    "BRL": 0.18,
    "INR": 0.012,
    "PLN": 0.25,
    "CZK": 0.044,
    "ILS": 0.27,
    "ZAR": 0.054,
}


def to_usd(amount: float, currency: str) -> float:
    rate = _RATES_TO_USD.get(currency.upper(), 1.0)
    return round(amount * rate, 2)
