import { CheckoutForm } from "@/components/cart/checkout-form";

export const metadata = {
  title: "Checkout"
};

export default function CheckoutPage() {
  return (
    <main className="container-shell py-14">
      <CheckoutForm />
    </main>
  );
}
