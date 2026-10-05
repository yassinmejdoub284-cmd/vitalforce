export const campaignKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;
export type CampaignAttribution = Partial<Record<typeof campaignKeys[number], string>>;

export function readCampaign(search: string): CampaignAttribution {
  const params = new URLSearchParams(search);
  return Object.fromEntries(campaignKeys.flatMap(key => {
    const value = params.get(key)?.split("").filter(char => char.charCodeAt(0) > 31 && char.charCodeAt(0) !== 127).join("").trim().slice(0, 120);
    return value ? [[key, value]] : [];
  }));
}

export function buildWhatsAppOrder(input: {
  angle: string; flavor: string; quantity: number; unitPrice: number;
  name?: string; phone?: string; city?: string; campaign: CampaignAttribution;
}) {
  const lines = ["السلام عليكم، نحب نطلب VITAL FORCE", `النكهة: ${input.flavor}`, `الكمية: ${input.quantity}`, `سعر العبوة: ${input.unitPrice} د.ت`, `مجموع المنتجات: ${input.unitPrice * input.quantity} د.ت (دون التوصيل)`];
  if (input.name?.trim()) lines.push(`الاسم: ${input.name.trim()}`);
  if (input.phone?.trim()) lines.push(`الهاتف: ${input.phone.trim()}`);
  if (input.city?.trim()) lines.push(`المدينة: ${input.city.trim()}`);
  lines.push("يرجى تأكيد التوفر ومصاريف التوصيل.", `صفحة الطلب: ${input.angle}`);
  for (const key of campaignKeys) if (input.campaign[key]) lines.push(`${key}: ${input.campaign[key]}`);
  return `https://wa.me/21627200603?text=${encodeURIComponent(lines.join("\n"))}`;
}
