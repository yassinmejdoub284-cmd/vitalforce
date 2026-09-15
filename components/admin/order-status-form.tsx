"use client";

import { useState } from "react";
import { orderStatuses, paymentStatuses } from "@/lib/product-data";

export function OrderStatusForm({ orderId, status, paymentStatus }: { orderId: string; status: string; paymentStatus: string }) {
  const [saved, setSaved] = useState(false);

  async function update(formData: FormData) {
    setSaved(false);
    await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: String(formData.get("status")),
        paymentStatus: String(formData.get("paymentStatus"))
      })
    });
    setSaved(true);
  }

  return (
    <form action={update} className="flex flex-wrap items-center gap-2">
      <select name="status" defaultValue={status} className="rounded-full border border-forest-900/15 bg-white px-3 py-2 text-sm font-semibold">
        {orderStatuses.map((item) => <option key={item} value={item}>{item}</option>)}
      </select>
      <select name="paymentStatus" defaultValue={paymentStatus} className="rounded-full border border-forest-900/15 bg-white px-3 py-2 text-sm font-semibold">
        {paymentStatuses.map((item) => <option key={item} value={item}>{item}</option>)}
      </select>
      <button className="rounded-full bg-forest-700 px-4 py-2 text-sm font-bold text-white">Sauver</button>
      {saved && <span className="text-xs font-bold text-forest-700">OK</span>}
    </form>
  );
}
