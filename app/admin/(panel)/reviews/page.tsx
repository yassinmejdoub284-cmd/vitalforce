import { desc } from "drizzle-orm";
import { PageHeader } from "@/components/admin/shell";
import { ReviewForm } from "@/components/admin/review-form";
import { db } from "@/lib/db";
import { customerReviews } from "@/lib/db/schema";

export default async function ReviewsPage() {
  const reviews = await db.select().from(customerReviews).orderBy(desc(customerReviews.id));
  return <><PageHeader title="Avis clients" subtitle="Les 12 avis les plus récents apparaissent sur l’accueil et toutes les pages publiques." />
    <div className="adm-grid"><ReviewForm />{reviews.map(review => <ReviewForm key={review.id} review={review} />)}</div></>;
}
