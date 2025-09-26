import { z } from 'zod';

export const RevertTemplateSchema = z.object({
  revisionId: z.string().uuid(),
});

export type RevertTemplateDto = z.infer<typeof RevertTemplateSchema>;
