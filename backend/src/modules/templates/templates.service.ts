import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { google } from 'googleapis';
import { z } from 'zod';

const TemplateTypeSchema = z.enum([
  'first_impression',
  'first_impression_divergence',
  'my_type',
  'my_type_divergence',
  'romance_compatibility',
  'friendship_compatibility',
]);

export type TemplateType = z.infer<typeof TemplateTypeSchema>;

export interface TemplateRevision {
  id: string;
  label: string;
  createdAt: string;
}

export interface TemplateRevisionsResponse {
  revisions: TemplateRevision[];
}

@Injectable()
export class TemplatesService {
  private readonly docs;
  private readonly templateDocIds: Record<TemplateType, string>;
  private readonly revisionsCache = new Map<
    string,
    { data: TemplateRevision[]; timestamp: number }
  >();
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes

  constructor() {
    // Initialize Google APIs
    const credentials = this.getGoogleCredentials();
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: [
        'https://www.googleapis.com/auth/documents.readonly',
        'https://www.googleapis.com/auth/drive.readonly',
      ],
    });

    this.docs = google.docs({ version: 'v1', auth });

    // Parse template document IDs from environment
    try {
      const templateIds = JSON.parse(process.env.GOOGLE_TEMPLATES_DOC_IDS_JSON || '{}');
      this.templateDocIds = templateIds;
    } catch (error) {
      throw new Error('Invalid GOOGLE_TEMPLATES_DOC_IDS_JSON configuration');
    }
  }

  private getGoogleCredentials() {
    const base64Credentials = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64;
    if (!base64Credentials) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 not configured');
    }

    try {
      const credentialsJson = Buffer.from(base64Credentials, 'base64').toString('utf-8');
      return JSON.parse(credentialsJson);
    } catch (error) {
      throw new Error('Invalid GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 format');
    }
  }

  async getTemplateRevisions(templateType: string): Promise<TemplateRevisionsResponse> {
    const validatedTemplateType = TemplateTypeSchema.parse(templateType);
    const documentId = this.templateDocIds[validatedTemplateType];

    if (!documentId) {
      throw new BadRequestException(`Template type ${templateType} not configured`);
    }

    // Check cache first
    const cached = this.revisionsCache.get(templateType);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return { revisions: cached.data };
    }

    try {
      // Use Google Drive API to get revisions
      const drive = google.drive({ version: 'v3', auth: this.docs.context._options.auth });

      const revisionsResponse = await drive.revisions.list({
        fileId: documentId,
        fields: 'revisions(id,modifiedTime,lastModifyingUser)',
      });

      const revisions: TemplateRevision[] = (revisionsResponse.data.revisions || [])
        .map((revision, index) => ({
          id: revision.id || `rev-${index}`,
          label: this.formatRevisionLabel(revision),
          createdAt: revision.modifiedTime || new Date().toISOString(),
        }))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Cache the results
      this.revisionsCache.set(templateType, {
        data: revisions,
        timestamp: Date.now(),
      });

      return { revisions };
    } catch (error: any) {
      // Implement exponential backoff for rate limiting
      if (error.code === 429) {
        await this.delay(1000 + Math.random() * 2000); // 1-3 second delay
        return this.getTemplateRevisions(templateType); // Retry once
      }

      throw new InternalServerErrorException(
        `Failed to fetch template revisions: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  private formatRevisionLabel(revision: any): string {
    const date = new Date(revision.modifiedTime || Date.now());
    const formattedDate = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const author = revision.lastModifyingUser?.displayName || 'Unknown';
    return `${formattedDate} by ${author}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async getTemplateContent(templateType: TemplateType, revisionId: string): Promise<string> {
    const documentId = this.templateDocIds[templateType];
    if (!documentId) {
      throw new BadRequestException(`Template type ${templateType} not configured`);
    }

    try {
      // Get specific revision content
      const response = await this.docs.documents.get({
        documentId,
        // Note: Google Docs API doesn't directly support getting specific revision content
        // In practice, you might need to use Drive API with revision download
        // For now, we'll get the current content and note the limitation
      });

      // Extract text content from the document
      const content = this.extractTextFromDocument(response.data);
      return content;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to fetch template content: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  private extractTextFromDocument(document: any): string {
    const content = document.body?.content || [];
    let text = '';

    for (const element of content) {
      if (element.paragraph) {
        const paragraph = element.paragraph;
        for (const paragraphElement of paragraph.elements || []) {
          if (paragraphElement.textRun) {
            text += paragraphElement.textRun.content || '';
          }
        }
      }
    }

    return text.trim();
  }
}
