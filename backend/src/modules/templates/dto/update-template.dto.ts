import { z } from 'zod';

export const UpdateTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});

export type UpdateTemplateDto = z.infer<typeof UpdateTemplateSchema>;
