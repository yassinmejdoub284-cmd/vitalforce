# Sports campaign revision — 11 October 2026

Existing route: `/lp/sport`. No new routes or campaign angles were added.

The sports card and page now use `public/images/landing/sport-recovery-v3.webp` (1024 × 1536). The image shows the same generated athlete tired after a workout and ready for a subsequent session within a training, food and rest routine. It is explicitly marked as an illustrative sports routine, not a measured product outcome or a customer testimonial. Original product label artwork remains unchanged.

Arabic copy focuses on strength, endurance, recovery and ingredient research. It reports observations from studies of specific preparations without claiming the finished VitalForce blend has the same measured effects. The page retains authentic labels in its product disclosure. Marketing dose, timing and preparation sections were removed only from the sports route. The offer remains 163 TND plus 7 TND delivery.

## Research references

- Ashwagandha strength/recovery trial: https://pubmed.ncbi.nlm.nih.gov/26609282/
- Ashwagandha endurance/recovery trial: https://pubmed.ncbi.nlm.nih.gov/33600918/
- Curcumin recovery review: https://pubmed.ncbi.nlm.nih.gov/35574627/
- Ginseng research overview: https://www.nccih.nih.gov/health/asian-ginseng
- Current strength evidence synthesis, consulted during review: https://pubmed.ncbi.nlm.nih.gov/42738987/

## Generation

Mode: built-in image generation. References: the supplied mobile screenshot for brand/gym atmosphere and the existing official front label for product packaging.

Final prompt:

> Use case: ads-marketing. Asset type: portrait Arabic hero artwork for the existing VITAL FORCE sports landing page, approximately 1024x1536. Input image 1 is a screenshot used only as brand, gym atmosphere and bottle reference; do not reproduce the phone/browser UI. Input image 2 is the exact product label; use it faithfully on a realistic white 400 g jar, preserve its logo and package design. Create a beautiful premium photorealistic two-scene gym campaign with the SAME generated adult Tunisian male athlete, about 30, curly dark hair, light stubble, forest-green training T-shirt, identical face, clothing and natural muscular physique in both scenes. Upper/right scene: visibly exhausted after a demanding workout, seated on a bench, sweaty, elbows on knees, catching his breath. Lower/left scene: the identical athlete fresh and motivated for a subsequent training session, standing confidently doing a controlled dumbbell exercise. These are different moments in a balanced training, nutrition and recovery routine, NOT an instant supplement transformation or a documented testimonial. Include a quiet visual transition showing a rest towel, balanced meal and water, and the VITAL FORCE jar as part of this routine. No exaggerated muscular growth, magical energy, medical diagrams or promised results. Strong cinematic photography, warm daylight gym, sophisticated dark forest green, ivory and gold brand colors. Product jar in the lower foreground with accurate referenced label and an orange botanical drink. Space scenes cleanly so mobile visitors can instantly read the comparison; don't crowd. Arabic copy must be rendered exactly, elegant very legible typography. Main heading: «التمرين قوّة. والاستشفاء روتين.» Above exhausted athlete: «بعد حصة قوية» Above energetic athlete: «جاهز للحصة الجاية» Near brand/product: «VITAL FORCE» and «٧ مكوّنات نباتية في روتينك الرياضي» Bottom line: «تغذية • راحة • استمرارية» Small clear footer: «مشهد توضيحي لروتين رياضي». No other captions, no usage dose or timing, no BEFORE/AFTER PRODUCT wording, no efficacy claims or percentage claims. Keep people and jar uncropped within generous edge margins; don't include website controls, CTA, price or phone chrome.

## Validation before publication

ESLint, TypeScript and the production build passed. The build required a scratch-only Node shim for a restricted-runtime `uv_resident_set_memory` error; the shim is not part of the repository or deployment. Generated HTML was checked for all nine routes, the artwork in the homepage and directory, one main heading on the sports page, three ingredient research cards, unchanged product label access and absence of sports preparation/dose marketing sections. The WebP file was decoded and verified.
