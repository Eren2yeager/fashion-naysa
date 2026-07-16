export async function storefrontFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw { message: body.message ?? res.statusText, code: body.code ?? res.status };
  }
  return res.json() as Promise<T>;
}
