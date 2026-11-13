export async function api<T = any>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  let data: any = null;
  try {
    data = await res.json();
  } catch {
  }
  if (!res.ok) {
    throw new Error(
      (typeof data?.error === 'string' && data.error) || `Request failed (${res.status})`
    );
  }
  return data as T;
}

export function jsonInit(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : 'Something went wrong';
}
