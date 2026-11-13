/**
 * Small fetch wrapper for the client: parses JSON, and turns non-2xx
 * responses (or non-JSON 500 pages) into a thrown Error with a readable
 * message. Without this, one failed request left pages stuck on "Loading…"
 * or crashed them with "Cannot read properties of undefined".
 */
export async function api<T = any>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON body */
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
