import { z } from 'zod';

export const PublishRevisionSchema = z.object({
  revisionId: z.string().uuid(),
});

export type PublishRevisionDto = z.infer<typeof PublishRevisionSchema>;
