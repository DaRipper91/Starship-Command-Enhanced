/**
 * Helper for making fetch requests that expect JSON responses
 * Handles setting Content-Type and common error handling
 */
export async function fetchJson<T>(
  url: string,
  options: RequestInit = {},
  defaultErrorMessage = 'Request failed',
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  let data: any;
  const contentType = response.headers.get('content-type');

  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch (err) {
      // If JSON parsing fails even though header says it's JSON
      if (!response.ok) {
        throw new Error(defaultErrorMessage);
      }
      throw err;
    }
  }

  if (!response.ok) {
    const errorMsg = data?.error || data?.message || defaultErrorMessage;
    throw new Error(errorMsg);
  }

  return data as T;
}
