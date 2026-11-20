import { CustomerReviews } from "@/components/commerce/customer-reviews";
import { CartPageContent } from "@/components/cart/cart-page-content";

export const metadata = {
  title: "Panier"
};

export default function CartPage() {
  return <><CustomerReviews /><CartPageContent /></>;
}
