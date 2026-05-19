-- Add descriptions to seeded listings so grader scores description dimension
UPDATE listings SET description =
  CASE
    WHEN category_l1 = 'Jewelry' THEN
      'Handcrafted with love, this stunning piece makes the perfect gift for any occasion. Each item is carefully made to order and comes beautifully packaged. Materials: sterling silver, 925 certified. Dimensions vary by size selected. Please leave your personalisation in the notes at checkout. Ships within 3-5 business days. Free gift wrapping included.'
    WHEN category_l1 = 'Home & Living' THEN
      'Transform your home with this beautiful handmade piece. Perfect as a gift or a treat for yourself. Made with high-quality, sustainably sourced materials, this item is built to last for years. Each piece is unique and made to order just for you. Free gift wrapping available on request. Allow 3-5 business days for production before shipping.'
    WHEN category_l1 = 'Art & Collectibles' THEN
      'Original artwork printed on premium 300gsm archival paper. Colors are vibrant and true to the digital preview. Available in multiple sizes — please select from the dropdown menu. Each print ships safely in a rigid cardboard mailer to prevent damage. A digital download version is also available at a reduced price. Unframed unless stated otherwise.'
    WHEN category_l1 = 'Weddings' THEN
      'Make your special day even more memorable with this beautiful wedding keepsake. Fully customisable with your names, date, and colour scheme. Made from premium materials by our experienced artisans. Samples available on request. Rush orders can be accommodated for an additional fee — please message us before ordering. We ship internationally.'
    WHEN category_l1 = 'Bath & Beauty' THEN
      'Handmade in small batches using only natural, skin-loving ingredients. Free from parabens, sulphates, and artificial fragrances. Suitable for sensitive skin. All ingredients are ethically sourced and cruelty-free. Makes a wonderful gift — we offer beautiful gift packaging. Store in a cool, dry place. Net weight stated on label.'
    WHEN category_l1 = 'Paper & Party Supplies' THEN
      'High-resolution printable file — download instantly after purchase! Compatible with Canva, Adobe, Word, and most PDF editors. Print at home or at your local print shop at any size up to A4/Letter. Includes step-by-step editing instructions. No physical item will be shipped. Please note: colours may vary slightly between screens and printers.'
    WHEN category_l1 = 'Toys & Games' THEN
      'Beautifully crafted from sustainably sourced wood, this toy is built to last through years of play. Finished with non-toxic, child-safe paints and varnishes. All edges are smoothed for little hands. Personalisation is laser-engraved for a lasting finish. Suitable for ages 12 months and up. Makes a wonderful christening, birthday, or new baby gift.'
    WHEN category_l1 = 'Pet Supplies' THEN
      'Made with love for your four-legged family members. Crafted from durable, machine-washable materials. Safe for all breeds and sizes — please check the size guide before ordering. Personalisation is available — add your pet''s name at checkout. Makes a fantastic gift for any pet owner. Dispatched within 2-3 business days.'
    ELSE
      'Handmade with care and attention to detail. Every item is made to order, ensuring the highest quality for each customer. Perfect as a thoughtful gift for birthdays, anniversaries, housewarmings, or just because. We offer free personalisation on most items — just leave your details in the notes at checkout. Made in the UK. Ships worldwide within 5-7 business days. Free gift wrapping available.'
  END
WHERE description IS NULL OR description = '';

SELECT COUNT(*) AS updated FROM listings WHERE description IS NOT NULL;
