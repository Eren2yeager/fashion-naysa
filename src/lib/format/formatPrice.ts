const formatter = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Format paise as "₹X,XX,XXX.XX" with Indian number grouping. */
export function formatPrice(paise: number): string {
  // rupees() gives us "₹X.XX"; we re-format the numeric part with en-IN grouping.
  const value = paise / 100;
  return "₹" + formatter.format(value);
}
