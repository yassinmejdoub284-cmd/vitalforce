import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Commande confirmée"
};

export default async function ConfirmationPage({ searchParams }: { searchParams?: Promise<{ order?: string }> }) {
  const { order } = (await searchParams) ?? {};
  return (
    <main className="container-shell grid min-h-[60vh] place-items-center py-20 text-center">
      <div className="max-w-xl rounded-[34px] bg-white p-8 shadow-green">
        <CheckCircle2 className="mx-auto text-forest-700" size={56} />
        <h1 className="mt-5 font-display text-4xl font-bold">Commande reçue</h1>
        <p className="mt-4 text-forest-900/68">
          Merci. Votre numéro de commande est <strong>{order ?? "VF-DEMO"}</strong>. Notre équipe confirmera les détails par téléphone.
        </p>
        <Link href="/products" className="mt-8 inline-flex rounded-full bg-forest-700 px-5 py-3 font-bold text-white">Retour boutique</Link>
      </div>
    </main>
  );
}
