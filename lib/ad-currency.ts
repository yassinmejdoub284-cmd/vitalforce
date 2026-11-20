/** Imported Meta amounts are USD. Manually recorded costs are already TND. */
export function adSpendTnd(metaUsd: number, manualTnd: number, rate: number): number | null {
  if (metaUsd && rate <= 0) return null;
  return metaUsd * rate + manualTnd;
}
