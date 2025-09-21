// API client for backend communication
export const API_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:3001';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: Response,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  // Get token from Supabase auth (will be set up later)
  const token = localStorage.getItem('supabase.auth.token'); // Placeholder

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new ApiError(
      `HTTP ${response.status}: ${response.statusText}`,
      response.status,
      response,
    );
  }

  return response.json();
}

// Auth API
export const authApi = {
  checkAllowlist: () => apiRequest<{ email: string; allowlisted: boolean }>('/auth/allowlist'),
};

// Users API
export const usersApi = {
  list: (params: { cursor?: string; limit?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.cursor) query.set('cursor', params.cursor);
    if (params.limit) query.set('limit', params.limit.toString());
    return apiRequest<any>(`/users?${query}`);
  },
  create: (data: { name: string }) =>
    apiRequest<any>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getById: (userId: string) => apiRequest<any>(`/users/${userId}`),
};

// Media API
export const mediaApi = {
  createSignedUrl: (data: { userId: string; type: 'image' | 'audio'; contentType: string }) =>
    apiRequest<{ uploadUrl: string; storagePath: string }>('/media/signed-url', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  triggerAnalysis: (mediaId: string) =>
    apiRequest<void>(`/media/${mediaId}/analysis`, {
      method: 'POST',
    }),
};

// Templates API
export const templatesApi = {
  getRevisions: (templateType: string) =>
    apiRequest<{ revisions: Array<{ id: string; label: string; createdAt: string }> }>(
      `/templates/${templateType}/revisions`,
    ),
};

// Reports API
export const reportsApi = {
  create: (data: {
    reportType: string;
    primaryUserId: string;
    secondaryUserId?: string;
    templateType: string;
    templateRevisionId: string;
    selfObservedDifferences?: string;
  }) =>
    apiRequest<any>('/reports', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getById: (reportId: string) => apiRequest<any>(`/reports/${reportId}`),
};
