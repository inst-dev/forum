const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:4000';

interface RequestOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  cache?: RequestCache;
  next?: { revalidate?: number; tags?: string[] };
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request(path: string, options: RequestOptions = {}) {
    const url = `${this.baseUrl}/api${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      const res = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        cache: options.cache || 'no-store',
        next: options.next,
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error, status: res.status };
      }

      return data;
    } catch (error) {
      return { success: false, error: { code: 'NETWORK_ERROR', message: 'Network error' } };
    }
  }

  async get(path: string, options?: RequestOptions) {
    return this.request(path, { ...options, method: 'GET' });
  }

  async post(path: string, body?: any, options?: RequestOptions) {
    return this.request(path, { ...options, method: 'POST', body });
  }

  async put(path: string, body?: any, options?: RequestOptions) {
    return this.request(path, { ...options, method: 'PUT', body });
  }

  async delete(path: string, options?: RequestOptions) {
    return this.request(path, { ...options, method: 'DELETE' });
  }
}

export const api = new ApiClient(API_URL);

// Client-side API (uses relative URL to go through Next.js rewrites)
export const clientApi = new ApiClient('');
