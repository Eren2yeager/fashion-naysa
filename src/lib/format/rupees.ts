/** Format paise integer as "₹X.XX" string. */
export function rupees(paise: number): string {
  return "₹" + (paise / 100).toFixed(2);
}

/** Display helper: paise → rupee float for input fields. */
export function toRupees(paise: number): number {
  return paise / 100;
}

/** Input helper: rupee float → paise integer. Never truncates. */
export function toPaise(rupees: number): number {
  return Math.round(rupees * 100);
}
