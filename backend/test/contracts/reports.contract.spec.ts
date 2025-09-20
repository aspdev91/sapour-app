import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/modules/app/app.module';

describe('Contract: /reports', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /reports -> 201', async () => {
    await request(app.getHttpServer())
      .post('/reports')
      .send({
        reportType: 'first_impression',
        primaryUserId: '00000000-0000-0000-0000-000000000000',
        templateType: 'first_impression',
        templateRevisionId: '1',
      })
      .expect(201);
  });

  it('GET /reports/{reportId} -> 200', async () => {
    const reportId = '00000000-0000-0000-0000-000000000000';
    await request(app.getHttpServer()).get(`/reports/${reportId}`).expect(200);
  });
});


