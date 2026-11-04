import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { getPublicSettings } from "@/lib/settings";

export const metadata = {
  title: "Commande reçue",
  robots: { index: false }
};

export default async function ConfirmationPage({ searchParams }: { searchParams?: Promise<{ order?: string; total?: string }> }) {
  const { order, total } = (await searchParams) ?? {};
  const settings = await getPublicSettings();
  const number = order && /^VF-\d{1,10}$/.test(order) ? order : null;
  const amount = Number(total);
  return (
    <main className="container-shell grid min-h-[60vh] place-items-center py-20 text-center">
      <div className="max-w-xl rounded-[34px] bg-white p-8 shadow-green">
        <CheckCircle2 className="mx-auto text-forest-700" size={56} />
        <h1 className="mt-5 font-display text-4xl font-bold">Merci, commande reçue !</h1>
        {number && <p className="mt-4 text-lg">Numéro de commande: <strong>{number}</strong></p>}
        {Number.isFinite(amount) && amount > 0 && <p className="mt-2 text-forest-900/68">À payer à la livraison: <strong>{amount.toFixed(3)} DT</strong></p>}
        <p className="mt-4 text-forest-900/68">Notre équipe vous appelle très vite pour confirmer l&apos;adresse. Gardez votre téléphone à proximité. Livraison {settings.delivery.eta}.</p>
        <Link href="/products" className="mt-8 inline-flex rounded-full bg-forest-700 px-5 py-3 font-bold text-white">Retour boutique</Link>
      </div>
    </main>
  );
}
