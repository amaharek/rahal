/**
 * API Client for Rahal Backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface FetchOptions extends RequestInit {
  token?: string;
}

class APIError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.status = status;
    this.detail = detail;
    this.name = 'APIError';
  }
}

/**
 * Base fetch wrapper with error handling
 */
async function fetchAPI<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new APIError(response.status, errorData.detail || 'Request failed');
  }

  return response.json();
}

/**
 * GET request
 */
export async function get<T>(endpoint: string, token?: string): Promise<T> {
  return fetchAPI<T>(endpoint, { method: 'GET', token });
}

/**
 * POST request
 */
export async function post<T>(
  endpoint: string,
  data: unknown,
  token?: string
): Promise<T> {
  return fetchAPI<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
    token,
  });
}

/**
 * PATCH request
 */
export async function patch<T>(
  endpoint: string,
  data: unknown,
  token?: string
): Promise<T> {
  return fetchAPI<T>(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(data),
    token,
  });
}

/**
 * DELETE request
 */
export async function del<T>(endpoint: string, token?: string): Promise<T> {
  return fetchAPI<T>(endpoint, { method: 'DELETE', token });
}

export { APIError };
