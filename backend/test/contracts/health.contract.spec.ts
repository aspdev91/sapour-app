import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createTestApp } from '../test-utils';

describe('Contract: GET /health', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await createTestApp();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 200 OK', async () => {
    await request(app.getHttpServer()).get('/health').expect(200);
  });
});


