const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('resumeiq_token');
};

export const api = {
  async request<T>(
    path: string,
    options: RequestInit & { auth?: boolean } = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    }

    if (options.auth !== false) {
      const token = getToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}${path}`, { ...options, headers });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new ApiError(data.error || 'Request failed', res.status);
    }
    return data as T;
  },

  get: <T>(path: string) => api.request<T>(path),
  post: <T>(path: string, body?: unknown, auth = true) =>
    api.request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      auth,
    }),
  patch: <T>(path: string, body?: unknown) =>
    api.request<T>(path, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  delete: <T>(path: string) => api.request<T>(path, { method: 'DELETE' }),
};

export { API_URL };
