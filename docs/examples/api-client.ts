import type { ApiError, ApiSuccess } from './frontend-types';

export class ApiClientError extends Error {
  status: number;
  payload?: ApiError;

  constructor(status: number, payload?: ApiError) {
    super(payload?.message || `API request failed with status ${status}`);
    this.status = status;
    this.payload = payload;
  }
}

export interface ApiClientOptions {
  baseUrl: string;
  getToken?: () => string | undefined;
  onUnauthorized?: () => void;
}

export class ApiClient {
  private baseUrl: string;
  private getToken?: () => string | undefined;
  private onUnauthorized?: () => void;

  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.getToken = options.getToken;
    this.onUnauthorized = options.onUnauthorized;
  }

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    const token = this.getToken?.();

    if (token) headers.set('Authorization', `Bearer ${token}`);
    if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(`${this.baseUrl}${path}`, { ...init, headers });
    const contentType = response.headers.get('content-type') || '';
    const payload = contentType.includes('application/json') ? await response.json() : await response.blob();

    if (!response.ok) {
      if (response.status === 401) this.onUnauthorized?.();
      throw new ApiClientError(response.status, payload as ApiError);
    }

    return payload as T;
  }

  get<T>(path: string): Promise<ApiSuccess<T>> {
    return this.request<ApiSuccess<T>>(path);
  }

  post<T>(path: string, body?: unknown): Promise<ApiSuccess<T>> {
    return this.request<ApiSuccess<T>>(path, {
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  }

  put<T>(path: string, body?: unknown): Promise<ApiSuccess<T>> {
    return this.request<ApiSuccess<T>>(path, {
      method: 'PUT',
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  }

  patch<T>(path: string, body?: unknown): Promise<ApiSuccess<T>> {
    return this.request<ApiSuccess<T>>(path, {
      method: 'PATCH',
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  }

  delete<T>(path: string): Promise<ApiSuccess<T>> {
    return this.request<ApiSuccess<T>>(path, { method: 'DELETE' });
  }

  upload<T>(path: string, fieldName: string, file: File): Promise<ApiSuccess<T>> {
    const formData = new FormData();
    formData.append(fieldName, file);
    return this.request<ApiSuccess<T>>(path, {
      method: 'POST',
      body: formData
    });
  }
}

export const createOrder = (api: ApiClient, payload: unknown) => api.post('/api/orders', payload);
export const submitOrderUtr = (api: ApiClient, orderId: string, utr: string) =>
  api.put(`/api/orders/${orderId}/verify-payment`, { utr });
export const uploadCover = (api: ApiClient, file: File) =>
  api.upload('/api/authors/me/uploads/image', 'image', file);
export const uploadManuscript = (api: ApiClient, file: File) =>
  api.upload('/api/authors/me/uploads/document', 'document', file);
