import { z } from 'zod';

export const TemplateTypeSchema = z.enum([
  'first_impression',
  'first_impression_divergence',
  'my_type',
  'my_type_divergence',
  'romance_compatibility',
  'friendship_compatibility',
]);

export type TemplateType = z.infer<typeof TemplateTypeSchema>;

export const CreateTemplateSchema = z.object({
  name: z.string().min(1),
  type: TemplateTypeSchema,
  description: z.string().optional(),
});

export type CreateTemplateDto = z.infer<typeof CreateTemplateSchema>;
