import { CheckoutForm } from "@/components/cart/checkout-form";
import { hasDatabase } from "@/lib/db";

export const metadata = {
  title: "Commander"
};

export default function CheckoutPage() {
  return (
    <main className="container-shell py-14">
      <CheckoutForm checkoutAvailable={hasDatabase()} />
    </main>
  );
}
