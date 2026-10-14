# Olive drink and rest artwork

Mode: built-in imagegen, with one edit/generation call per asset. Final PNG images were converted to WebP (quality 92, method 6), without other pixel edits.

The new rest poster shows the same adult woman awake in bed and peacefully asleep as illustrative moments of a sleep routine. It includes a separate daylight self-care still life with the product and an olive-green drink. It does not claim fast sleep or a product-caused outcome. The rest route remains informational.

Seven existing campaign posters receive a localized change of their product liquids to olive green. Existing active lifestyle and usage images already show olive-green drinks; imagery without a glass is preserved. Fruit, flavor labels, people, Arabic copy and Western digits are retained. Versioned paths update homepage, directory, landing pages and social metadata together.

## Final assets

- `public/images/landing/sport-recovery-olive-v5.webp` — 1024 × 1536
- `public/images/landing/daily-energy-campaign-olive-v4.webp` — 1024 × 1536
- `public/images/landing/calm-campaign-olive-v4.webp` — 1024 × 1536
- `public/images/landing/focus-campaign-olive-v4.webp` — 1024 × 1536
- `public/images/landing/digestion-campaign-olive-v4.webp` — 1024 × 1536
- `public/images/landing/movement-campaign-olive-v4.webp` — 1024 × 1536
- `public/images/landing/botanical-campaign-olive-v4.webp` — 1024 × 1536
- `public/images/landing/sleep-campaign-olive-v4.webp` — 1024 × 1536

## Exact color-edit prompt (7 assets)

```text
Use case: precise-object-edit. Edit input 1, the existing 1024x1536 Vital Force campaign poster. Input 2 is a COLOR AND LIQUID TEXTURE REFERENCE ONLY: the olive-green drink in the usage-ready photograph. Change ONLY the herbal product liquid inside every filled drinking glass/cup in input 1 to the same muted opaque olive-green (approximately #77813d) botanical drink, with a little natural pale foam and herbal speckling. Replace orange/yellow juice-colored product liquid and match any brighter-green product liquid to this consistent olive-green. Preserve the glass rims, transparency, refraction, light, volume and position. Leave clearly plain water clear. DO NOT change orange fruit or orange-colored jar-label flavor graphics.
Preserve the entire original composition, people, faces, identities, gestures, anatomy, clothing, background, lighting, jar and complete official label, all logos, all exact Arabic typography including small footer and ingredient names, gold dividers and botanical decoration. All existing digits must remain Western 0-9. Preserve 1024x1536 portrait size and full opaque background. Do not add or remove text, claims, people, objects or any before/after captions. This is a highly localized liquid-color edit; no redesign.
```

## Exact sleep-artwork prompt

```text
Use case: ads-marketing. Replace input 1, the existing Vital Force rest campaign poster, with a polished 1024x1536 portrait artwork in the same forest green, ivory and restrained gold photographic style. Input 2 is solely the desired olive-green herbal drink color and texture. Input 3 is the exact official jar label.
Show the same clearly adult woman about 30 with dark wavy hair in TWO nighttime bedroom scenes in a calm, modest, fully clothed, nonsexual context: upper/right she lies awake in bed in long-sleeve cream pajamas under ivory covers, eyes open and mildly restless, trying to settle for sleep; lower/left the identical adult woman in the same pajamas and bedroom lies naturally asleep on her side, eyes gently closed and relaxed under the covers. These are illustrative independent moments of a regular sleep routine, NOT a documented customer result and NOT a drug/product-caused instant sleep before/after. Do not show drinking, a jar, a glass, a clock, duration, before/after labels, transformation arrows or medicines in either nighttime scene.
A visibly SEPARATE narrow bottom DAYLIGHT still-life panel with a sunlit breakfast/home table displays the branded white Vital Force Orange jar and one clear glass of opaque muted olive-green herbal drink matching input 2. Keep the actual label faithful to input 3. Distinguish this daytime self-care panel clearly from the night scenes, with its own short label 'عناية خلال النهار'. No product on a bedside table.
Exact Arabic header: 'تحبّ ترتاح أكثر؟'. Exact positive subheading: 'ليلة هادئة تبدأ بروتين.'. Upper scene label: 'وقت الاستعداد للنوم'. Lower sleeping scene label: 'وقت النوم والراحة'. Brand: 'VITAL FORCE'. Clear small footer: 'مشاهد توضيحية لروتين الراحة'. No other added text or benefit claims, no suggestion of rapid sleep or treating insomnia, no dosage, price, percentage, CTA or medical imagery. All visible numerals only Western 0-9. Accurate readable Arabic, natural anatomy and photorealistic faces, full opaque background.
```

## Checks

Lint, TypeScript and the production Webpack build passed. Static route checks confirm all eight new poster paths, the directory/homepage links, the updated sleep heading and the sleep page's informational behavior. The local build used the existing executor-only memory adapter outside the repository.
