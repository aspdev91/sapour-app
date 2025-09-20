import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/modules/app/app.module';

describe('Contract: /users', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /users -> 200', async () => {
    await request(app.getHttpServer()).get('/users').expect(200);
  });

  it('POST /users -> 201 (name required)', async () => {
    await request(app.getHttpServer())
      .post('/users')
      .send({ name: 'Test User' })
      .expect(201);
  });

  it('GET /users/{userId} -> 200', async () => {
    const userId = '00000000-0000-0000-0000-000000000000';
    await request(app.getHttpServer()).get(`/users/${userId}`).expect(200);
  });
});


