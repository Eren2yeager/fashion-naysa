/**
 * Pure helpers for product variants — also used by PBT (task 10.5).
 */

/** Returns true if ≥2 variants share the same (size, color) pair. */
export function hasVariantDuplicates(
  variants: Array<{ size: string; color: string }>,
): boolean {
  const seen = new Set<string>();
  for (const v of variants) {
    const key = `${v.size}::${v.color}`;
    if (seen.has(key)) return true;
    seen.add(key);
  }
  return false;
}

/** Converts a product name to a URL-safe slug. */
export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
