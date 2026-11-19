import { readStoredDemoRole } from '../context/RoleContext';

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string>;

  constructor(status: number, message: string, errors?: Record<string, string>) {
    super(message);
    this.status = status;
    this.errors = errors;
    this.name = 'ApiError';
  }
}

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string>;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (!headers.has('X-Demo-Role')) {
    headers.set('X-Demo-Role', readStoredDemoRole());
  }

  const response = await fetch(path, {
    ...options,
    headers,
  });

  const payload = (await response.json().catch(() => ({
    success: false,
    message: 'Unable to parse server response.',
  }))) as ApiEnvelope<T>;

  if (!response.ok || !payload.success) {
    throw new ApiError(
      response.status,
      payload.message || `Request failed with status ${response.status}`,
      payload.errors,
    );
  }

  return payload.data as T;
}
