import { CheckoutForm } from "@/components/cart/checkout-form";
import { getCatalog } from "@/lib/catalog";

export const metadata = {
  title: "Commander"
};

export default async function CheckoutPage() {
  const { products, live } = await getCatalog();
  return (
    <main className="container-shell py-14">
      <CheckoutForm checkoutAvailable={live} catalog={products.map(({ id, price, template }) => ({ id, price, template }))} />
    </main>
  );
}
