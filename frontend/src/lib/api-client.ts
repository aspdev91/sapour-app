// Generated TypeScript client based on OpenAPI specification
import { z } from 'zod';
import { getSupabaseToken } from './supabase';

// Base URL and configuration
export const API_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:3001';

// Zod schemas for type safety
export const UUIDSchema = z.string().uuid();
export const TimestampSchema = z.string().datetime();

export const MediaTypeSchema = z.enum(['image', 'audio']);
export const ReportTypeSchema = z.enum([
  'first_impression',
  'first_impression_divergence',
  'my_type',
  'my_type_divergence',
  'romance_compatibility',
  'friendship_compatibility',
]);

export const UserSchema = z.object({
  id: UUIDSchema,
  name: z.string(),
  consent: z.boolean(),
  createdAt: TimestampSchema,
});

export const MediaSchema = z.object({
  id: UUIDSchema,
  userId: UUIDSchema,
  type: MediaTypeSchema,
  storagePath: z.string(),
  publicUrl: z.string().optional(),
  analysisJson: z.any().optional(),
  provider: z.string().optional(),
  model: z.string().optional(),
  status: z.enum(['pending', 'processing', 'succeeded', 'failed']),
  error: z.string().optional(),
  createdAt: TimestampSchema,
});

export const ReportSchema = z.object({
  id: UUIDSchema,
  reportType: ReportTypeSchema,
  primaryUserId: UUIDSchema,
  secondaryUserId: UUIDSchema.optional(),
  templateDocumentId: z.string(),
  templateRevisionId: z.string(),
  templateRevisionLabel: z.string(),
  aiProviderName: z.string(),
  aiModelName: z.string(),
  content: z.string(),
  createdAt: TimestampSchema,
});

// Type definitions
export type UUID = z.infer<typeof UUIDSchema>;
export type MediaType = z.infer<typeof MediaTypeSchema>;
export type ReportType = z.infer<typeof ReportTypeSchema>;
export type User = z.infer<typeof UserSchema>;
export type Media = z.infer<typeof MediaSchema>;
export type Report = z.infer<typeof ReportSchema>;

export interface PaginatedUsersResponse {
  users: User[];
  nextCursor?: string;
  hasMore: boolean;
}

export interface UserResponse {
  email: string;
  userId: string;
  hasAccess: boolean;
}

export interface SignedUrlResponse {
  uploadUrl: string;
  storagePath: string;
  mediaId: UUID;
}

export interface TemplateRevision {
  id: string;
  label: string;
  createdAt: string;
}

export interface TemplateRevisionsResponse {
  revisions: TemplateRevision[];
}

// API Error class
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

// Base API client
class BaseApiClient {
  private baseUrl: string;

  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async getAuthToken(): Promise<string | null> {
    return await getSupabaseToken();
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    schema?: z.ZodSchema<T>,
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = await this.getAuthToken();

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

    const data = await response.json();

    // Validate response with Zod if schema provided
    if (schema) {
      try {
        return schema.parse(data);
      } catch (error) {
        console.warn('API response validation failed:', error);
        return data; // Return unvalidated data in case of schema mismatch
      }
    }

    return data;
  }

  // Health endpoint
  async getHealth(): Promise<{ status: string; timestamp?: string }> {
    return this.request('/health');
  }

  // Auth endpoints
  async getCurrentUser(): Promise<UserResponse> {
    return this.request('/auth/me');
  }

  // Users endpoints
  async getUsers(
    params: { cursor?: string; limit?: number } = {},
  ): Promise<PaginatedUsersResponse> {
    const query = new URLSearchParams();
    if (params.cursor) query.set('cursor', params.cursor);
    if (params.limit) query.set('limit', params.limit.toString());

    return this.request(`/users?${query}`);
  }

  async createUser(data: { name: string }): Promise<User> {
    return this.request(
      '/users',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      UserSchema,
    );
  }

  async getUser(userId: UUID): Promise<User & { media: Media[]; reports: Report[] }> {
    return this.request(`/users/${userId}`);
  }

  // Media endpoints
  async createSignedUrl(data: {
    userId: UUID;
    type: MediaType;
    contentType: string;
  }): Promise<SignedUrlResponse> {
    return this.request('/media/signed-url', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async triggerAnalysis(mediaId: UUID): Promise<{ status: string; mediaId: UUID }> {
    return this.request(`/media/${mediaId}/analysis`, {
      method: 'POST',
    });
  }

  // Templates endpoints
  async getTemplateRevisions(templateType: string): Promise<TemplateRevisionsResponse> {
    return this.request(`/templates/${templateType}/revisions`);
  }

  // Reports endpoints
  async createReport(data: {
    reportType: ReportType;
    primaryUserId: UUID;
    secondaryUserId?: UUID;
    templateType: string;
    templateRevisionId: string;
    selfObservedDifferences?: string;
  }): Promise<Report> {
    return this.request(
      '/reports',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      ReportSchema,
    );
  }

  async getReport(reportId: UUID): Promise<Report> {
    return this.request(`/reports/${reportId}`, {}, ReportSchema);
  }
}

// Export singleton instance
export const apiClient = new BaseApiClient();

// Convenience exports (keeping backward compatibility)
export const authApi = {
  getCurrentUser: () => apiClient.getCurrentUser(),
};

export const usersApi = {
  list: (params?: { cursor?: string; limit?: number }) => apiClient.getUsers(params),
  create: (data: { name: string }) => apiClient.createUser(data),
  getById: (userId: UUID) => apiClient.getUser(userId),
};

export const mediaApi = {
  createSignedUrl: (data: { userId: UUID; type: MediaType; contentType: string }) =>
    apiClient.createSignedUrl(data),
  triggerAnalysis: (mediaId: UUID) => apiClient.triggerAnalysis(mediaId),
};

export const templatesApi = {
  getRevisions: (templateType: string) => apiClient.getTemplateRevisions(templateType),
};

export const reportsApi = {
  create: (data: {
    reportType: ReportType;
    primaryUserId: UUID;
    secondaryUserId?: UUID;
    templateType: string;
    templateRevisionId: string;
    selfObservedDifferences?: string;
  }) => apiClient.createReport(data),
  getById: (reportId: UUID) => apiClient.getReport(reportId),
};
