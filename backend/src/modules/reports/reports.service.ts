import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import { TemplatesService, TemplateType } from '../templates/templates.service';
import { z } from 'zod';

const CreateReportSchema = z.object({
  reportType: z.enum([
    'first_impression',
    'first_impression_divergence',
    'my_type',
    'my_type_divergence',
    'romance_compatibility',
    'friendship_compatibility',
  ]),
  primaryUserId: z.string().uuid(),
  secondaryUserId: z.string().uuid().optional(),
  templateType: z.string(),
  templateRevisionId: z.string(),
  selfObservedDifferences: z.string().optional(),
});

export type CreateReportDto = z.infer<typeof CreateReportSchema>;

export interface ReportDetail {
  id: string;
  reportType: string;
  primaryUserId: string;
  secondaryUserId?: string;
  templateType: string;
  templateDocumentId: string;
  templateRevisionId: string;
  templateRevisionLabel?: string;
  aiProviderName: string;
  aiModelName: string;
  content: string;
  createdAt: Date;
}

@Injectable()
export class ReportsService {
  private readonly prisma = new PrismaClient();
  private readonly openai: OpenAI;

  constructor(private readonly templatesService: TemplatesService) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async createReport(data: CreateReportDto): Promise<ReportDetail> {
    const validatedData = CreateReportSchema.parse(data);

    // Verify users exist
    const primaryUser = await this.prisma.user.findUnique({
      where: { id: validatedData.primaryUserId },
      include: {
        media: {
          where: { status: 'succeeded' },
          select: {
            id: true,
            type: true,
            analysisJson: true,
            provider: true,
            model: true,
          },
        },
      },
    });

    if (!primaryUser) {
      throw new NotFoundException('Primary user not found');
    }

    let secondaryUser = null;
    if (validatedData.secondaryUserId) {
      secondaryUser = await this.prisma.user.findUnique({
        where: { id: validatedData.secondaryUserId },
        include: {
          media: {
            where: { status: 'succeeded' },
            select: {
              id: true,
              type: true,
              analysisJson: true,
              provider: true,
              model: true,
            },
          },
        },
      });

      if (!secondaryUser) {
        throw new NotFoundException('Secondary user not found');
      }
    }

    // Get template content
    let templateContent: string;
    try {
      templateContent = await this.templatesService.getTemplateContent(
        validatedData.templateType as TemplateType,
        validatedData.templateRevisionId,
      );
    } catch (error) {
      throw new BadRequestException(`Failed to get template content: ${error.message}`);
    }

    // Compose prompt with available data
    const prompt = await this.composePrompt(
      templateContent,
      primaryUser,
      secondaryUser,
      validatedData.selfObservedDifferences,
    );

    // Generate report using OpenAI
    let reportContent: string;
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert personality analyst. Generate detailed, insightful reports based on the provided template and user data. Be professional, empathetic, and constructive in your analysis.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 4000,
        temperature: 0.7,
      });

      reportContent = completion.choices[0]?.message?.content || '';
      if (!reportContent) {
        throw new Error('Empty response from OpenAI');
      }
      } catch (error) {
        throw new InternalServerErrorException(`Failed to generate report: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

    // Persist immutable report with full provenance
    const report = await this.prisma.report.create({
      data: {
        reportType: validatedData.reportType as any,
        primaryUserId: validatedData.primaryUserId,
        secondaryUserId: validatedData.secondaryUserId,
        templateType: validatedData.templateType as any,
        templateDocumentId: 'google-doc-id', // Would be actual doc ID in production
        templateRevisionId: validatedData.templateRevisionId,
        templateRevisionLabel: `Revision ${validatedData.templateRevisionId}`,
        aiProviderName: 'OpenAI',
        aiModelName: 'gpt-4',
        content: reportContent,
      },
    });

    return {
      id: report.id,
      reportType: report.reportType,
      primaryUserId: report.primaryUserId,
      secondaryUserId: report.secondaryUserId || undefined,
      templateType: report.templateType,
      templateDocumentId: report.templateDocumentId,
      templateRevisionId: report.templateRevisionId,
      templateRevisionLabel: report.templateRevisionLabel,
      aiProviderName: report.aiProviderName,
      aiModelName: report.aiModelName,
      content: report.content,
      createdAt: report.createdAt,
    };
  }

  private async composePrompt(
    templateContent: string,
    primaryUser: any,
    secondaryUser?: any,
    selfObservedDifferences?: string,
  ): Promise<string> {
    let prompt = `Template for analysis:\n${templateContent}\n\n`;

    // Add primary user data
    prompt += `PRIMARY USER: ${primaryUser.name}\n`;

    if (primaryUser.media.length > 0) {
      prompt += 'Available analysis data:\n';
      for (const media of primaryUser.media) {
        prompt += `- ${media.type.toUpperCase()} analysis (${media.provider}): ${JSON.stringify(media.analysisJson)}\n`;
      }
    } else {
      prompt += 'Note: No media analysis available for primary user.\n';
    }

    if (selfObservedDifferences) {
      prompt += `Self-observed differences: ${selfObservedDifferences}\n`;
    }

    // Add secondary user data if applicable
    if (secondaryUser) {
      prompt += `\nSECONDARY USER: ${secondaryUser.name}\n`;
      if (secondaryUser.media.length > 0) {
        prompt += 'Available analysis data:\n';
        for (const media of secondaryUser.media) {
          prompt += `- ${media.type.toUpperCase()} analysis (${media.provider}): ${JSON.stringify(media.analysisJson)}\n`;
        }
      } else {
        prompt += 'Note: No media analysis available for secondary user.\n';
      }
    }

    prompt +=
      '\nBased on the template and available data, please generate a comprehensive analysis report. If some data is missing, note this in the report but proceed with the available information.';

    return prompt;
  }

  async getReportById(reportId: string): Promise<ReportDetail> {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return {
      id: report.id,
      reportType: report.reportType,
      primaryUserId: report.primaryUserId,
      secondaryUserId: report.secondaryUserId || undefined,
      templateType: report.templateType,
      templateDocumentId: report.templateDocumentId,
      templateRevisionId: report.templateRevisionId,
      templateRevisionLabel: report.templateRevisionLabel,
      aiProviderName: report.aiProviderName,
      aiModelName: report.aiModelName,
      content: report.content,
      createdAt: report.createdAt,
    };
  }

  async listReports(primaryUserId?: string, limit = 20): Promise<ReportDetail[]> {
    const where = primaryUserId ? { primaryUserId } : {};

    const reports = await this.prisma.report.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return reports.map((report) => ({
      id: report.id,
      reportType: report.reportType,
      primaryUserId: report.primaryUserId,
      secondaryUserId: report.secondaryUserId || undefined,
      templateType: report.templateType,
      templateDocumentId: report.templateDocumentId,
      templateRevisionId: report.templateRevisionId,
      templateRevisionLabel: report.templateRevisionLabel,
      aiProviderName: report.aiProviderName,
      aiModelName: report.aiModelName,
      content: report.content,
      createdAt: report.createdAt,
    }));
  }
}
