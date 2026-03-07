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

  // Only set Content-Type: application/json if there's a body and it's not already set
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');

  let data: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  if (isJson) {
    try {
      data = await response.json();
    } catch (err) {
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

  if (!isJson) {
    throw new Error(
      'Expected JSON response but received ' + (contentType || 'none'),
    );
  }

  return data as T;
}
