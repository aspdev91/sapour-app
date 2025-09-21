import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createTestApp } from '../test-utils';

describe('Contract: /templates/{templateType}/revisions', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await createTestApp();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /templates/{templateType}/revisions -> 200', async () => {
    await request(app.getHttpServer()).get('/templates/first_impression/revisions').expect(200);
  });
});


