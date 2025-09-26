import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createTestApp } from '../test-utils';

describe('OpenAPI Contract (basic status checks)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await createTestApp();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health -> 200', async () => {
    await request(app.getHttpServer()).get('/health').expect(200);
  });

  it('GET /auth/allowlist -> 200', async () => {
    await request(app.getHttpServer())
      .get('/auth/allowlist')
      .set('authorization', 'Bearer testtoken')
      .expect(200);
  });
});
