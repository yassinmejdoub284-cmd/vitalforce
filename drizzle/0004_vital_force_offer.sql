UPDATE products
SET price = 133, compare_at_price = 164
WHERE sku IN ('VF-ORANGE-400', 'VF-CITRON-400', 'VF-MENTHE-400')
  AND price IN (133, 163, 164);
