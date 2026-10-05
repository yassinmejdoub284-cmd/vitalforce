# Arabic image-led campaign pages

Nine routes under `/lp`: `sport`, `daily-energy`, `calm`, `focus`, `digestion`, `intimacy`, `sleep`, `movement`, `botanical`.

Each route uses its own Arabic problem hook and relevant artwork. The focus, digestion, intimacy and sleep routes display full portrait artwork without cropping. Desktop uses artwork beside the offer; mobile stacks the artwork above the offer and keeps a bottom CTA. Ingredient research and product suitability details are expandable. No preparation, dose or timing section is shown on the campaign pages.

## Latest visual revisions

Current pages use the `*-poster-positive.webp` siblings. They present positive ingredient and daily routine copy. Usage instructions have been removed from the marketing artwork and landing page sections; authentic package labels remain intact. Health suitability and evidence details remain available in expandable product questions. The focus image uses the factual sentence «الجنسنغ الأحمر في قلب روتينك اليومي» rather than an unsupported unconditional efficacy claim.

Earlier revisions:

- `public/images/landing/intimacy-poster-v2.webp`: adult couple scene, original VitalForce jar and branding. Ingredient strip: ashwagandha and fenugreek. Caption: «مكوّنات دُرست لدورها المحتمل في دعم مستويات التستوستيرون». Clarification: ingredient studies used specific preparations, not the finished product.
- `public/images/landing/sleep-poster-v2.webp`: awake-at-night scene, original VitalForce jar. Bottom panel presents the existing label instruction: «حسب تعليمات الملصق: صباحاً، ويفضّل بعد الأكل». It retains the information that ginseng can cause insomnia and the finished blend has not been shown to improve sleep. No evidence was supplied establishing a fixed ten-hour cutoff.

Assets were generated and edited using the built-in image generation tool. The latest edit prompts preserve the existing jar, label, people, overall layout and Arabic headline while replacing only the bottom ingredient/caption panels with the wording above. Earlier local drafts are not included in the published assets; the site uses the latest positive posters.

## Campaign attribution and orders

UTM tags (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`) pass into the prepared WhatsApp message along with the landing angle. The visitor sends the message; opening WhatsApp does not confirm an order. Stock and delivery charges require team confirmation.

Example campaign path: `/lp/intimacy?utm_source=facebook&utm_medium=paid_social&utm_campaign=intimacy&utm_content=visual_v2`.

Meta Pixel tracks PageView, ViewContent and order intent when configured. It never records a confirmed Purchase just for opening WhatsApp. Customer contact fields are not included in analytics events. The sleep route is informational and has no purchase form.

## Evidence and limitations

- Ashwagandha: https://www.nccih.nih.gov/health/ashwagandha
- Fenugreek randomized trial with mixed outcomes: https://pubmed.ncbi.nlm.nih.gov/39288153/
- Asian ginseng and insomnia: https://www.nccih.nih.gov/health/asian-ginseng

Studies of an isolated preparation do not demonstrate efficacy of the finished VitalForce blend. No specific constituent quantities or standardized extract details have been verified for comparison with clinical trial preparations.

Lint, TypeScript and production build passed during implementation. Browser captures remain blocked by private preview sign-in; generated posters are design artwork and are not browser screenshots. The preview site currently contains an earlier static seven-page version, while the latest source is in this checkout.

## Site integration

The homepage now contains an Arabic introduction and a nine-angle image gallery linking to each campaign. The `/lp` directory uses the same final artwork; portrait posters keep their original ratio so Arabic captions remain visible. The shared Arabic paragraph is stored in `lib/product-benefits.ts` and appears on the homepage, directory and all nine landing pages. It describes ingredients, research areas and the practical benefit of adding a varied botanical blend to a daily routine, without claiming the final blend cures a condition. Marketing usage steps were removed from the homepage; authentic product labels remain accessible.
