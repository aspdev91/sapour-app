import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/modules/app/app.module';

describe('Contract: /media', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /media/signed-url -> 201', async () => {
    await request(app.getHttpServer())
      .post('/media/signed-url')
      .send({
        userId: '00000000-0000-0000-0000-000000000000',
        type: 'image',
        contentType: 'image/png',
      })
      .expect(201);
  });

  it('POST /media/{mediaId}/analysis -> 202', async () => {
    const mediaId = '00000000-0000-0000-0000-000000000000';
    await request(app.getHttpServer()).post(`/media/${mediaId}/analysis`).expect(202);
  });
});
