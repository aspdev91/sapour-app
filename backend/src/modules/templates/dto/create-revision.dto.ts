import { z } from 'zod';

export const CreateRevisionSchema = z.object({
  content: z.string().min(1),
  changelog: z.string().optional(),
});

export type CreateRevisionDto = z.infer<typeof CreateRevisionSchema>;
