import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/modules/app/app.module';

describe('OpenAPI Contract (basic status checks)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

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
