-- Etsy Analyzer — Demo listing data
-- Seeds 50 representative listings across top categories
-- Run: psql -U postgres -h 127.0.0.1 -d etsy_analyzer -f scripts/seed-demo-data.sql

INSERT INTO listings (
  etsy_listing_id, shop_id, title, tags, price_usd, category_l1,
  photo_count, has_video, shipping_free, is_bestseller,
  num_reviews, avg_rating, listing_age_days,
  est_monthly_revenue, est_monthly_units, revenue_confidence,
  opportunity_score, listing_grade, is_active
) VALUES
-- Jewelry
('1001000001','ShinyGems','Personalized Name Necklace Sterling Silver - Custom Gift',
 ARRAY['necklace','personalised','silver','gift','custom','jewellery','name','birthday'],
 29.99,'Jewelry',8,false,true,true, 847,4.9,620, 2890,97,'high',78,'B',true),

('1001000002','CrystalCraft','Moonstone Ring Boho Silver - Handmade Gemstone Ring',
 ARRAY['moonstone','ring','boho','silver','handmade','gemstone','celestial','womens'],
 45.00,'Jewelry',6,false,false,false, 312,4.8,380, 1120,25,'medium',65,'C',true),

('1001000003','GoldThreads','18K Gold Filled Huggie Earrings - Minimalist Hoops',
 ARRAY['earrings','gold','huggie','hoops','minimalist','dainty','jewellery'],
 24.99,'Jewelry',5,false,true,true, 1205,5.0,890, 4200,168,'high',85,'A',true),

-- Home & Living
('1002000001','CozyHome','Personalised Wooden Cutting Board - Wedding Gift Custom',
 ARRAY['cutting board','personalised','wooden','wedding gift','kitchen','custom','engraved'],
 49.99,'Home & Living',7,false,true,true, 2340,4.9,1100, 8900,178,'high',88,'A',true),

('1002000002','CandleCo','Soy Wax Scented Candle - Lavender and Vanilla - Hand Poured',
 ARRAY['candle','soy wax','lavender','vanilla','scented','handmade','home decor'],
 18.00,'Home & Living',4,false,false,false, 156,4.7,240, 560,31,'medium',55,'C',true),

('1002000003','PrintHouse','Watercolour City Map Print - Personalised Home Decor',
 ARRAY['map print','watercolour','city','personalised','home decor','wall art','framed'],
 35.00,'Home & Living',6,true,true,false, 678,4.8,560, 2100,60,'high',72,'B',true),

('1002000004','WoodWorks','Floating Wooden Shelf - Rustic Oak Wall Display Shelf',
 ARRAY['shelf','wooden','floating','rustic','oak','wall','storage','home decor'],
 42.00,'Home & Living',5,false,false,false, 234,4.6,445, 780,19,'medium',61,'C',true),

-- Art & Collectibles
('1003000001','DigitalArt','Printable Wall Art - Botanical Prints Set of 3 - Instant Download',
 ARRAY['printable','wall art','botanical','digital download','instant','set of 3','home decor'],
 8.99,'Art & Collectibles',6,false,true,true, 4521,4.9,1500, 3200,356,'high',91,'A',true),

('1003000002','PaperDreams','Custom Portrait Illustration - Pet Portrait Digital',
 ARRAY['portrait','custom','pet portrait','digital','illustration','dog','cat','gift'],
 25.00,'Art & Collectibles',5,false,true,false, 892,4.8,720, 1890,76,'high',79,'B',true),

('1003000003','VintagePress','Vintage Travel Poster Print - Paris - Retro Style Art',
 ARRAY['vintage','travel poster','paris','retro','art print','wall decor','gift'],
 15.00,'Art & Collectibles',4,false,true,false, 445,4.7,680, 560,37,'medium',58,'C',true),

-- Craft Supplies
('1004000001','YarnWorld','Merino Wool Yarn - Chunky Weight - Hand Dyed Gradient',
 ARRAY['yarn','merino wool','chunky','hand dyed','knitting','crochet','gradient','craft'],
 28.00,'Craft Supplies & Tools',5,false,false,false, 678,4.8,420, 1200,43,'medium',68,'B',true),

('1004000002','SewPerfect','Fabric Bundle - Floral Cotton Prints - Quilting Fabric',
 ARRAY['fabric','cotton','floral','quilting','bundle','sewing','craft','patchwork'],
 22.00,'Craft Supplies & Tools',4,false,false,false, 234,4.7,360, 780,35,'medium',62,'C',true),

-- Weddings
('1005000001','WeddingBells','Rustic Wedding Invitation Suite - Boho Floral Design',
 ARRAY['wedding invitation','rustic','boho','floral','suite','custom','printable','stationery'],
 45.00,'Weddings',8,true,false,true, 1234,5.0,890, 5600,124,'high',84,'A',true),

('1005000002','BridalGlow','Personalised Bride Tribe Satin Robe - Bridesmaid Gift',
 ARRAY['robe','bride','bridesmaid','satin','personalised','gift','wedding','getting ready'],
 38.00,'Weddings',6,false,false,false, 567,4.8,580, 1800,47,'high',71,'B',true),

('1005000003','PaperLove','Wedding Table Numbers - Laser Cut Wood - Minimalist',
 ARRAY['table numbers','wedding','laser cut','wood','minimalist','rustic','decor'],
 55.00,'Weddings',5,false,true,false, 345,4.9,620, 1560,28,'medium',69,'B',true),

-- Bath & Beauty
('1006000001','NaturalGlow','Handmade Soap Bar - Lavender Oatmeal - Natural Organic',
 ARRAY['soap','handmade','lavender','oatmeal','natural','organic','bath','gift'],
 9.99,'Bath & Beauty',5,false,true,true, 2100,4.9,780, 3400,340,'high',82,'A',true),

('1006000002','LipLovely','Beeswax Lip Balm Set - Natural Flavoured - Gift Set',
 ARRAY['lip balm','beeswax','natural','flavoured','gift set','organic','beauty'],
 14.99,'Bath & Beauty',4,false,true,false, 890,4.8,560, 1200,80,'high',75,'B',true),

-- Clothing
('1007000001','KnitWear','Hand Knitted Merino Wool Jumper - Custom Size - Cosy',
 ARRAY['jumper','knitted','merino wool','handmade','cosy','winter','custom size','knitwear'],
 120.00,'Clothing',6,false,false,false, 234,4.9,680, 2800,23,'medium',70,'B',true),

('1007000002','TiedUp','Tie Dye T-Shirt - Spiral Pattern - Handmade Unisex',
 ARRAY['tie dye','t-shirt','spiral','handmade','unisex','colourful','festival','summer'],
 35.00,'Clothing',5,false,false,false, 456,4.7,450, 1100,31,'medium',63,'C',true),

-- Paper & Party
('1008000001','PartyPrint','Birthday Party Invitation - Printable - Editable Template',
 ARRAY['birthday invitation','printable','editable','template','party','digital','instant download'],
 5.99,'Paper & Party Supplies',4,false,true,true, 5670,4.9,1200, 2800,467,'high',89,'A',true),

('1008000002','GiftWrap','Personalised Gift Tags - Christmas - Set of 10 - Custom',
 ARRAY['gift tags','personalised','christmas','custom','set','holiday','wrapping'],
 8.99,'Paper & Party Supplies',4,false,false,false, 1234,4.8,720, 980,109,'high',77,'B',true),

-- Bags
('1009000001','LeatherCraft','Personalised Leather Tote Bag - Monogram - Work Bag',
 ARRAY['tote bag','leather','personalised','monogram','work bag','custom','handmade'],
 89.00,'Bags & Purses',7,true,false,true, 890,4.9,780, 4200,47,'high',81,'A',true),

('1009000002','CrochetBags','Crochet Market Bag - Cotton - Sustainable Tote',
 ARRAY['crochet','market bag','cotton','sustainable','tote','handmade','eco'],
 32.00,'Bags & Purses',5,false,true,false, 345,4.8,450, 890,28,'medium',66,'B',true),

-- Accessories
('1010000001','ScarfShop','Hand Painted Silk Scarf - Abstract Art - Wearable Art',
 ARRAY['scarf','silk','hand painted','abstract','art','wearable','fashion','accessories'],
 75.00,'Accessories',6,false,false,false, 178,4.9,560, 1100,15,'medium',67,'B',true),

('1010000002','HatHaven','Personalised Baseball Cap - Embroidered Custom Text',
 ARRAY['baseball cap','personalised','embroidered','custom','hat','gift','accessories'],
 28.00,'Accessories',5,false,true,false, 567,4.8,680, 1400,50,'high',73,'B',true),

-- Toys & Games
('1011000001','ToyBox','Personalised Wooden Name Puzzle - Educational Toy Baby',
 ARRAY['puzzle','wooden','personalised','name','baby','educational','toy','gift'],
 22.99,'Toys & Games',6,false,true,true, 1890,4.9,890, 3600,157,'high',85,'A',true),

('1011000002','GameOn','Custom Board Game Pieces - 3D Printed - Tabletop',
 ARRAY['board game','custom','3d printed','tabletop','gaming','pieces','meeples'],
 19.99,'Toys & Games',4,false,false,false, 234,4.7,340, 560,28,'medium',61,'C',true),

-- Pet Supplies
('1012000001','PawPerfect','Personalised Dog Bandana - Custom Name - Pet Gift',
 ARRAY['dog bandana','personalised','custom','pet','gift','dog','name','accessories'],
 12.99,'Pet Supplies',5,false,true,true, 2340,4.9,780, 2100,162,'high',83,'A',true),

('1012000002','CatCraft','Cat Bed Donut Shape - Soft Fleece - Washable Pet Bed',
 ARRAY['cat bed','donut','fleece','soft','washable','pet','cats','cosy'],
 29.99,'Pet Supplies',6,false,false,false, 567,4.8,560, 1400,47,'high',72,'B',true),

-- Electronics
('1013000001','TechWrap','Custom Phone Case - Personalised Name - iPhone Samsung',
 ARRAY['phone case','custom','personalised','name','iphone','samsung','gift','tech'],
 19.99,'Electronics & Accessories',5,false,true,true, 1234,4.8,680, 2200,110,'high',80,'A',true),

-- Books
('1014000001','PrintedWords','Personalised Story Book - Baby Gift - Custom Name',
 ARRAY['story book','personalised','baby gift','custom name','children','book','reading'],
 28.99,'Books, Movies & Music',6,false,true,true, 890,4.9,680, 2100,72,'high',79,'B',true),

-- Shoes
('1015000001','SoleArt','Custom Hand Painted Canvas Shoes - Unique Art',
 ARRAY['shoes','canvas','hand painted','custom','art','unique','wearable','fashion'],
 65.00,'Shoes',7,true,false,false, 234,4.8,560, 1200,18,'medium',66,'B',true),

-- More popular items for richer search results
('1001000010','JewelQueen','Crystal Choker Necklace - Boho Beach Jewellery',
 ARRAY['choker','necklace','crystal','boho','beach','jewellery','summer','festival'],
 18.99,'Jewelry',5,false,true,false, 678,4.7,450, 1100,58,'medium',64,'C',true),

('1001000011','SilverSmith','Hammered Silver Bangles Set of 3 - Stacking Bracelets',
 ARRAY['bangle','silver','hammered','stacking','bracelet','set','handmade','jewellery'],
 38.00,'Jewelry',6,false,false,false, 445,4.8,520, 1400,37,'medium',67,'B',true),

('1002000010','HomeStyled','Macrame Wall Hanging - Boho Decor - Hand Knotted',
 ARRAY['macrame','wall hanging','boho','decor','hand knotted','handmade','home','cotton'],
 55.00,'Home & Living',6,false,false,false, 567,4.8,620, 2100,38,'medium',70,'B',true),

('1002000011','PotteryStudio','Handmade Ceramic Mug - Stoneware - Custom Glaze',
 ARRAY['mug','ceramic','handmade','stoneware','pottery','custom','coffee','gift'],
 34.00,'Home & Living',5,false,false,false, 234,4.9,480, 780,23,'medium',63,'B',true),

('1003000010','ArtPrint','Abstract Geometric Print - Modern Minimalist Wall Art',
 ARRAY['abstract','geometric','print','modern','minimalist','wall art','home decor'],
 20.00,'Art & Collectibles',4,false,true,false, 1230,4.8,780, 1900,95,'high',76,'B',true),

('1003000011','SketchArt','Custom Family Portrait - Cartoon Style - Digital Art',
 ARRAY['family portrait','custom','cartoon','digital','illustration','gift','personalised'],
 40.00,'Art & Collectibles',6,false,true,false, 567,4.9,560, 1800,45,'high',74,'B',true),

('1005000010','WeddingPaper','Wedding Menu Cards - Calligraphy Style - Template',
 ARRAY['menu cards','wedding','calligraphy','template','printable','elegant','stationery'],
 12.00,'Weddings',4,false,true,false, 890,4.8,680, 890,74,'medium',73,'B',true),

('1006000010','BathBombs','Luxury Bath Bomb Set - Essential Oils - Gift Box',
 ARRAY['bath bomb','luxury','essential oils','gift box','spa','relaxing','handmade'],
 24.99,'Bath & Beauty',7,false,true,true, 1560,4.9,680, 2800,112,'high',82,'A',true),

('1007000010','VintageSew','Vintage Style Apron - Cotton - Kitchen Cooking',
 ARRAY['apron','vintage','cotton','kitchen','cooking','retro','gift','women'],
 28.00,'Clothing',5,false,false,false, 345,4.7,450, 780,28,'medium',60,'C',true),

('1008000010','InviteMe','Tropical Baby Shower Invitation - Printable Digital',
 ARRAY['baby shower','tropical','invitation','printable','digital','template','party'],
 6.99,'Paper & Party Supplies',4,false,true,true, 3450,4.9,890, 2100,300,'high',87,'A',true),

('1009000010','VelvetBag','Personalised Velvet Jewellery Pouch - Gift Bag Wedding',
 ARRAY['jewellery pouch','velvet','personalised','gift bag','wedding','favour','bridesmaid'],
 15.00,'Bags & Purses',4,false,false,false, 678,4.8,560, 890,59,'medium',68,'B',true),

('1010000010','EcoStyle','Reusable Cotton Beeswax Wrap - Food Storage - Eco Gift',
 ARRAY['beeswax wrap','reusable','cotton','eco','sustainable','food storage','gift','zero waste'],
 16.99,'Accessories',5,false,true,false, 890,4.8,680, 1200,71,'medium',74,'B',true),

('1011000010','LearningToys','Montessori Wooden Activity Board - Toddler Busy Board',
 ARRAY['montessori','wooden','activity board','toddler','busy board','educational','learning'],
 45.00,'Toys & Games',7,false,false,true, 456,4.9,560, 1800,40,'medium',76,'B',true),

('1012000010','DogDays','Personalised Dog Lead - Custom Name - Pet Accessories',
 ARRAY['dog lead','personalised','custom name','pet','accessories','dog walking','gift'],
 22.99,'Pet Supplies',5,false,false,false, 345,4.8,450, 680,30,'medium',65,'B',true),

('1013000010','CableArt','Personalised AirPods Case - Custom Initial - Gifts',
 ARRAY['airpods case','personalised','custom','initial','gift','tech','accessories'],
 18.99,'Electronics & Accessories',4,false,true,false, 678,4.8,580, 1100,58,'medium',71,'B',true),

('1014000010','BookBound','Custom Recipe Book - Personalised Family Cookbook',
 ARRAY['recipe book','custom','personalised','family','cookbook','gift','keepsake'],
 35.00,'Books, Movies & Music',5,false,true,false, 234,4.8,520, 720,21,'medium',66,'B',true)

ON CONFLICT (etsy_listing_id) DO NOTHING;

\echo 'Seeded demo listings.'
SELECT COUNT(*) AS total_listings FROM listings;
SELECT category_l1, COUNT(*) AS count FROM listings GROUP BY category_l1 ORDER BY count DESC LIMIT 10;
