/* eslint-disable @next/next/no-img-element -- miniatures admin (images importées servies telles quelles) */
import Link from "next/link";
import { asc } from "drizzle-orm";
import { Plus } from "lucide-react";
import { StockInput } from "@/components/admin/product-form";
import { PageHeader } from "@/components/admin/shell";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { money, percent } from "@/lib/format";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "Produits" };

export default async function ProductsPage() {
  const [rows, config] = await Promise.all([db.select().from(products).orderBy(asc(products.sortOrder), asc(products.createdAt)), getSettings()]);
  return <>
    <PageHeader title="Produits & stock" subtitle="Prix, coûts et stock: les changements sont visibles tout de suite sur le site." actions={<Link href="/admin/products/new" className="adm-btn adm-btn-primary"><Plus size={16} />Ajouter un produit</Link>} />
    <div className="adm-table-wrap">
      <table className="adm-table">
        <thead><tr><th>Produit</th><th className="num">Prix</th><th className="num">Coût unitaire</th><th className="num">Marge brute / livraison</th><th>Stock</th><th>Statut</th></tr></thead>
        <tbody>{rows.map((product) => {
          const unitCost = product.costPrice + product.packagingCost;
          const deliveredMargin = product.price + (config.delivery.included ? 0 : config.delivery.fee) - unitCost - config.delivery.carrierCost - config.costs.confirmationCost;
          return <tr key={product.id}>
            <td><div className="adm-row" style={{ flexWrap: "nowrap" }}>
              {product.image && <img src={product.image} alt="" className="adm-thumb" />}
              <span><Link href={`/admin/products/${product.id}`} className="adm-row-link">{product.name}</Link><small className="adm-muted" style={{ display: "block" }}>{product.sku} · /products/{product.slug}</small></span>
            </div></td>
            <td className="num"><strong>{money(product.price)}</strong>{product.compareAtPrice && <small className="adm-muted" style={{ display: "block", textDecoration: "line-through" }}>{money(product.compareAtPrice)}</small>}</td>
            <td className="num">{money(unitCost)}<small className="adm-muted" style={{ display: "block" }}>prod. {money(product.costPrice)} + emb. {money(product.packagingCost)}</small></td>
            <td className="num"><strong style={{ color: deliveredMargin > 0 ? "var(--adm-green)" : "var(--adm-red)" }}>{money(deliveredMargin)}</strong><small className="adm-muted" style={{ display: "block" }}>{percent(deliveredMargin / product.price)} · avant pub et retours</small></td>
            <td><StockInput id={product.id} stock={product.stock} low={product.stock <= product.lowStockThreshold} /></td>
            <td>{product.active ? <span className="adm-badge adm-badge-paid">En ligne</span> : <span className="adm-badge adm-badge-muted">Masqué</span>}</td>
          </tr>;
        })}</tbody>
      </table>
    </div>
    {rows.length === 0 && <p className="adm-empty">Aucun produit. Lancez « npm run db:seed » ou ajoutez un produit.</p>}
  </>;
}
