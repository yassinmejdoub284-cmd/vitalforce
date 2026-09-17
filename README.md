# VITAL FORCE Store

Production-quality local website for the VITAL FORCE dietary-supplement brand.

## Stack

- Next.js App Router, TypeScript, React
- Tailwind CSS
- Three.js via React Three Fiber and Drei
- Framer Motion
- Prisma with SQLite for local development
- Zod validation
- Zustand cart storage

## Local Setup

```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Then open `http://localhost:3000`.

## Environment

Copy `.env.example` to `.env` and edit values:

- `DATABASE_URL`: SQLite locally. PostgreSQL can replace it later by switching Prisma provider and connection string.
- `NEXT_PUBLIC_SITE_URL`: public URL for metadata. If empty on Vercel, the deployment URL is used.
- `NEXT_PUBLIC_META_PIXEL_ID`: enables Meta Pixel in the browser.
- `META_CONVERSIONS_API_TOKEN`, `META_DATASET_ID`, `META_TEST_EVENT_CODE`: enable the server-side Meta Conversions API endpoint.
- `DEFAULT_DELIVERY_COMPANY`: default shipping adapter key.

## Main Routes

- `/`: premium VITAL FORCE homepage with 3D product hero
- `/products`: catalogue with search
- `/products/vital-force-400g-orange`: product detail page
- `/products/vital-force-400g-citron` and `/products/vital-force-400g-menthe`: other flavors
- `/viewer`: interactive 3D product viewer
- `/checkout`: checkout with Cash on Delivery, mock card, and delivery-company choice
- `/confirmation`: order confirmation
- `/admin`: admin KPIs
- `/admin/products`: products CRUD
- `/admin/inventory`: stock overview
- `/admin/orders`: order workflow
- `/admin/coupons`: promo management
- `/admin/settings`: editable business settings structure

The admin area and its write APIs are not authenticated yet. Keep this project private and local until authentication and real payment/shipping credentials are configured.
SQLite is local-only; a Vercel deployment also needs a persistent database before orders and admin data can work reliably.
On Vercel, the storefront remains browsable from the bundled catalogue, but checkout and admin APIs deliberately return unavailable instead of accepting an order that cannot be saved. The admin UI is hidden. Configure a persistent database and authentication before enabling those features in production.
The Citron label is an illustrative adaptation of the supplied Orange label, not an approved production label. Verify all legal copy, composition, approvals and claims against the official packaging before release. Ingredient advantages appear in French and Arabic; ingredient photos are generated illustrations.

## Commerce Notes

Checkout currently supports:

- Cash on Delivery
- Mock card payment through an adapter interface
- Delivery company selection: local courier, Aramex, Intigo, or pickup
- Order status workflow: new, confirmed, processing, shipped, delivered, cancelled
- Payment statuses: pending, paid, failed, refunded

Payment and delivery integrations are intentionally adapter-based so Stripe, Paymee, Konnect, Aramex, Intigo, or another provider can be added without rewriting the checkout.

## Health And Compliance Notes

The customer-facing copy distinguishes preliminary research on individual ingredients from demonstrated effects of the finished formula. Ingredient advantages are presented in French and Arabic with reference links. VITAL FORCE is described as a food supplement and includes label-based dosage, precautions, and conservation notes:

- Do not exceed the recommended daily dose.
- Food supplements do not replace a varied, balanced diet.
- Not recommended for pregnant or breastfeeding women, children under 13, or in case of hyperthyroidism.

## Verification

Completed successfully:

```bash
npm run typecheck
npm run build
```

`npm run lint` is configured for ESLint 9 flat config.
