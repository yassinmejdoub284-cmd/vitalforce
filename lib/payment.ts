import type { checkoutSchema } from "@/lib/validations";
import type { z } from "zod";

type CheckoutInput = z.infer<typeof checkoutSchema>;

export type PaymentResult = {
  ok: boolean;
  providerRef: string;
  status: "pending" | "paid" | "failed";
};

export interface PaymentAdapter {
  charge(input: CheckoutInput, total: number): Promise<PaymentResult>;
}

export const cashOnDeliveryAdapter: PaymentAdapter = {
  async charge() {
    return {
      ok: true,
      providerRef: `cod_${Date.now()}`,
      status: "pending"
    };
  }
};

export const mockCardAdapter: PaymentAdapter = {
  async charge(input, total) {
    await new Promise((resolve) => setTimeout(resolve, 350));
    return {
      ok: true,
      providerRef: `mock_card_${input.phone}_${Math.round(total * 1000)}`,
      status: "paid"
    };
  }
};

export function getPaymentAdapter(method: CheckoutInput["paymentMethod"]) {
  return method === "mock_card" ? mockCardAdapter : cashOnDeliveryAdapter;
}
