# Intimacy artwork replacement

Replaces the existing intimacy campaign artwork with a younger adult couple embracing, based on the supplied pose reference. Both subjects are approximately 28–32. The supplied Arabic slogan is used in the poster and landing-page heading. Homepage, directory and social metadata use the campaign data's versioned poster path. The supporting photograph uses a dedicated versioned override; other angles retain their existing photograph paths.

Mode: built-in imagegen. Opaque backgrounds. PNG outputs converted to WebP at quality 92 without editing image contents.

The follow-up usage request is implemented in the existing product usage guide, homepage/product FAQ and product usage data: 1 scoop holds 5 g; sport uses 2 scoops (10 g/day), non-sport uses 1 scoop (5 g/day). French and Arabic copy share the same dosage constants. Existing gram quantities are preserved. Campaign preparation sections remain absent.

Assets:
- `public/images/landing/intimacy-campaign-v4.webp`: 1024 × 1536.
- `public/images/landing/intimacy-embrace-v3.webp`: 1536 × 1024.

Validation: lint, TypeScript and production Webpack build passed. The local build used an executor-only memory-query adapter outside the repository after the runtime returned `uv_resident_set_memory ENOENT`. This adapter is not part of the deployed application.

## Exact portrait prompt

```text
Use case: ads-marketing. Asset: 1024x1536 portrait campaign artwork replacing the existing Vital Force intimacy landing-page image.
Input 1 is the user's reference photograph: use ONLY the central embracing couple photo as a pose, warmth, expression and home-interior reference; discard ALL black bars, screenshot chrome, phone icons and borders. Input 2 is the user's exact copy reference. Input 3 is the existing campaign artwork for the brand's forest-green, ivory and gold palette and photorealistic polish only; do not repeat its split scenes, devices or previous headings. Input 4 is the exact official product jar front label; preserve the label logo and branding faithfully.
Primary request: portray a clearly adult younger married couple, BOTH age about 28-32, natural North African/Mediterranean appearance, brown hair, no grey hair, genuine delighted smiles. Woman in soft light-grey knit sweater in front, man in navy long-sleeve knit behind, hugging her gently around the shoulders and waist with her hands resting naturally on his forearms, matching the affectionate fully-clothed pose in input 1. Keep natural anatomy and credible hands. Bright cozy modern living room with sunlit curtains and softly blurred bookshelf, warm daylight and relaxed expressions.
Composition: One continuous positive scene, not a before/after. The embracing couple dominate the artwork and are shown from waist up, faces and hands intact. Spacious elegant ivory header with extremely readable Arabic type in forest green and restrained gold emphasis. A modest accurate white Vital Force Orange jar on a side table in the lower foreground, without blocking the embrace; use the official label. No extra people. Refined gold botanical edge accents, not a cluttered collage.
Text verbatim: Brand on its own line: "Vital Force". Arabic headline, carefully typeset right-to-left over 3 balanced lines: "قوة الطبيعة، لحيوية متجدّدة وحياة زوجية أجمل". No added benefit claims, testosterone wording, problem questions, ingredient strips, usage instructions, price, percentage, CTA, or other headings. Tiny footer: "صورة توضيحية".
This is aspirational brand lifestyle imagery, not a medical result or customer testimonial. No nudity, sensual bed scene, bodily transformation, medical imagery, watermark, phone screenshot UI or unreadable small slogans. Opaque full background.
```

## Exact landscape prompt

```text
Use case: photorealistic-natural. Asset: 1536x1024 landscape supporting photograph for the same existing Vital Force intimacy landing page.
Input 1 is the approved portrait campaign artwork: use it as the exact adult couple identity, age, clothing, embrace and room reference. Input 2 is the user's original screenshot as a pose reference only; ignore ALL screenshot UI, black bars, borders and older ages. Input 3 is the official Vital Force front label.
Create a landscape photorealistic lifestyle photograph of the EXACT same young adult North African/Mediterranean couple from input 1, both about 28-32, brown hair and natural faces. Woman in light-grey knit sweater, man in navy knit behind her, smiling affectionately and hugging her with her hands gently on his forearms. Waist-up framing, complete faces, natural arms and hands, same bright modern living room with sunlit curtains and bookshelf. Make them feel candid, comfortable, loving and fully clothed. A small accurate white Vital Force Orange jar on the side table at lower right with modest orange slices, readable real label from input 3. Product does not obscure their embrace. Spacious premium photography, warm natural light and softly blurred background, same realistic skin texture.
Change format and remove ALL campaign typography, header, decorative gold ribbons and overlaid text from input 1. No text outside the actual product label, no prices, badges, claim text or watermark. No other people, no medical result, no before/after, no phone UI. Opaque background.
```
