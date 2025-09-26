import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createTestApp } from '../test-utils';

describe('Contract: GET /auth/allowlist', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await createTestApp();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 200 and JSON with email, allowlisted', async () => {
    const res = await request(app.getHttpServer())
      .get('/auth/allowlist')
      .set('authorization', 'Bearer testtoken')
      .expect(200);
    expect(res.body).toHaveProperty('email');
    expect(res.body).toHaveProperty('allowlisted');
  });
});
