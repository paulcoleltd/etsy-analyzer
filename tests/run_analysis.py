"""Quick platform analysis for listing 4493579933."""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'services', 'data-pipeline'))

from src.ml.revenue_model import RevenueEstimator
from src.ml.niche_scorer import calculate_niche_score, calculate_opportunity_score
from src.normaliser.listing_normaliser import normalise_listing
from src.normaliser.currency import to_usd

raw = {
    'etsy_listing_id': '4493579933',
    'title': 'Vintage Cocktail Print Vinyl Record Bar Art | Retro Bar Decor | Home Bar Sign',
    'price_raw': '12.99', 'currency': 'GBP',
    'tags': ['vinyl record art','bar decor','cocktail print','home bar','retro bar sign',
             'vintage bar art','wall art','bar gift','cocktail bar','man cave decor',
             'bar wall art','pub decor','drinks sign'],
    'num_reviews': 47, 'avg_rating': 4.9, 'photo_count': 6,
    'has_video': False, 'shipping_free': False, 'is_bestseller': True,
    'category_path': ['Home & Living', 'Home Decor', 'Wall Decor'],
    'description': 'Unique vintage-style cocktail artwork on genuine vinyl record.',
    'photo_urls': [],
}

record = normalise_listing(raw, shop_id='VinylRecordArtUK')
est    = RevenueEstimator(model_path='nonexistent.joblib')
rev    = est.predict({**record.to_db_dict(), 'price_usd': record.price_usd})
niche  = calculate_niche_score({'volume_est': 8000, 'competing_count': 3500,
                                 'avg_reviews': 25, 'trend_direction': 'stable'})
opp    = calculate_opportunity_score({**record.to_db_dict(),
                                       'est_monthly_revenue': rev['est_monthly_revenue_usd'],
                                       'price_usd': record.price_usd})

print("=" * 60)
print("  ETSY ANALYZER -- Listing 4493579933")
print("  Vintage Cocktail Print Vinyl Record Bar Art")
print("=" * 60)
print(f"  Price (GBP):      12.99 GBP")
print(f"  Price (USD):      {record.price_usd:.2f} USD")
print(f"  Reviews:          {record.num_reviews}  (avg {record.avg_rating})")
print(f"  Tags:             {len(record.tags)}/13 used")
print(f"  Category:         {record.category_l1}")
print(f"  Bestseller:       {record.is_bestseller}")
print()
print("  REVENUE ESTIMATE  (heuristic model - no training data yet)")
print(f"  Monthly revenue:  ${rev['est_monthly_revenue_usd']:.2f}")
print(f"  Monthly units:    {rev['est_monthly_units']}")
print(f"  Confidence:       {rev['confidence']}")
print()
print("  NICHE: vinyl record bar art")
print(f"  Niche score:      {niche['score']:.1f}/100  ({niche['rating']})")
print(f"  Volume est:       {niche['components']['volume']:,} searches/mo")
print(f"  Competition:      {niche['components']['competition']:,} listings")
print(f"  Trend:            {niche['components']['trend']}")
print()
print(f"  OPPORTUNITY SCORE: {opp:.1f}/100")
print("=" * 60)
