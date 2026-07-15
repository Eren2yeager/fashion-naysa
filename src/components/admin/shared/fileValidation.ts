export function validateMediaFile(
  file: { type: string; size: number },
): { ok: true } | { ok: false; error: string } {
  if (!file.type.startsWith("image/"))
    return { ok: false, error: "Only image files are allowed" };
  if (file.size > 10 * 1024 * 1024)
    return { ok: false, error: "File must be under 10 MB" };
  return { ok: true };
}
