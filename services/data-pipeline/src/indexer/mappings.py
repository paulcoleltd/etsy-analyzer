LISTINGS_INDEX = "listings"
KEYWORDS_INDEX = "keywords"

LISTINGS_MAPPING = {
    "settings": {
        "number_of_shards": 3,
        "number_of_replicas": 1,
        "analysis": {
            "analyzer": {
                "etsy_text": {
                    "type": "custom",
                    "tokenizer": "standard",
                    "filter": ["lowercase", "stop", "snowball"],
                }
            }
        },
    },
    "mappings": {
        "properties": {
            "etsy_listing_id":     {"type": "keyword"},
            "shop_id":             {"type": "keyword"},
            "title":               {"type": "text", "analyzer": "etsy_text",
                                    "fields": {"keyword": {"type": "keyword"}}},
            "tags":                {"type": "keyword"},
            "category_l1":         {"type": "keyword"},
            "category_path":       {"type": "keyword"},
            "price_usd":           {"type": "float"},
            "num_reviews":         {"type": "integer"},
            "avg_rating":          {"type": "float"},
            "listing_age_days":    {"type": "integer"},
            "photo_count":         {"type": "integer"},
            "has_video":           {"type": "boolean"},
            "is_bestseller":       {"type": "boolean"},
            "shipping_free":       {"type": "boolean"},
            "est_monthly_revenue": {"type": "float"},
            "est_monthly_units":   {"type": "integer"},
            "opportunity_score":   {"type": "float"},
            "listing_grade":       {"type": "keyword"},
            "revenue_confidence":  {"type": "keyword"},
            "last_scraped":        {"type": "date"},
            "is_active":           {"type": "boolean"},
        }
    },
}

KEYWORDS_MAPPING = {
    "settings": {"number_of_shards": 1, "number_of_replicas": 1},
    "mappings": {
        "properties": {
            "keyword":         {"type": "keyword"},
            "keyword_text":    {"type": "text", "analyzer": "standard"},
            "volume_est":      {"type": "integer"},
            "competition":     {"type": "keyword"},
            "trend_direction": {"type": "keyword"},
            "related":         {"type": "keyword"},
            "category":        {"type": "keyword"},
            "last_updated":    {"type": "date"},
        }
    },
}
