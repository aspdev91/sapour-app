import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ZodError, ZodSchema } from 'zod';

@Injectable()
export class ValidationPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata) {
    const schema = (metadata.metatype as unknown as ZodSchema) || null;
    if (!schema || typeof (schema as unknown as { safeParse?: unknown }).safeParse !== 'function') {
      return value;
    }
    const result = (schema as ZodSchema).safeParse(value);
    if (!result.success) {
      const issues = (result as { error: ZodError }).error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      }));
      throw new BadRequestException({ message: 'Validation failed', issues });
    }
    return result.data;
  }
}
