/**
 * Thin typed fetch wrapper for admin client components.
 * - Injects Content-Type: application/json
 * - 401 → redirect to /login (session expired mid-session)
 * - 500+ → generic message (no internal details leaked)
 * - non-ok → throws body.error.message
 */
export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (res.status === 401) {
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (res.status >= 500) {
    throw new Error("Something went wrong. Please try again.");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: { message?: string } })?.error?.message ??
        `Request failed (${res.status})`,
    );
  }

  return res.json() as Promise<T>;
}
