import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/modules/app/app.module';

describe('Contract: /templates/{templateType}/revisions', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
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


