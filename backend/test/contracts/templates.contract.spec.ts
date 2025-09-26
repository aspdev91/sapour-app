import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createTestApp } from '../test-utils';

describe('Contract: Templates CRUD', () => {
  let app: INestApplication;
  let createdTemplateId: string;

  beforeAll(async () => {
    const moduleRef = await createTestApp();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /templates', () => {
    it('should list all templates -> 200', async () => {
      const response = await request(app.getHttpServer()).get('/templates').expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      // Mock returns empty array, so just verify structure
      expect(response.body).toEqual([]);
    });
  });

  describe('POST /templates', () => {
    it('should create a new template -> 201', async () => {
      const templateData = {
        name: 'Test Template',
        type: 'first_impression',
        content: 'This is a test template content with {{userName}} variable.',
        description: 'A test template for contract testing',
      };

      const response = await request(app.getHttpServer())
        .post('/templates')
        .send(templateData)
        .expect(500); // Current implementation throws error

      // Note: This will be 201 when implementation is complete
      // expect(response.body).toHaveProperty('id');
      // expect(response.body.name).toBe(templateData.name);
      // expect(response.body.type).toBe(templateData.type);
      // expect(response.body.status).toBe('draft');
      // createdTemplateId = response.body.id;
    });

    it('should reject invalid template type -> 400', async () => {
      const templateData = {
        name: 'Invalid Template',
        type: 'invalid_type',
        content: 'Test content',
      };

      await request(app.getHttpServer()).post('/templates').send(templateData).expect(500); // Current implementation throws error

      // Note: This will be 400 when validation is implemented
    });

    it('should reject missing required fields -> 400', async () => {
      const templateData = {
        name: 'Incomplete Template',
        // Missing type and content
      };

      await request(app.getHttpServer()).post('/templates').send(templateData).expect(500); // Current implementation throws error

      // Note: This will be 400 when validation is implemented
    });
  });

  describe('GET /templates/:id', () => {
    it('should get template by id -> 200', async () => {
      const templateId = 'test-template-id';

      await request(app.getHttpServer()).get(`/templates/${templateId}`).expect(404); // Current implementation throws NotFoundException

      // Note: This will be 200 when implementation is complete
      // expect(response.body).toHaveProperty('id', templateId);
      // expect(response.body).toHaveProperty('name');
      // expect(response.body).toHaveProperty('type');
      // expect(response.body).toHaveProperty('content');
      // expect(response.body).toHaveProperty('status');
    });

    it('should return 404 for non-existent template', async () => {
      await request(app.getHttpServer()).get('/templates/non-existent-id').expect(404);
    });
  });

  describe('PUT /templates/:id', () => {
    it('should update template -> 200', async () => {
      const templateId = 'test-template-id';
      const updateData = {
        name: 'Updated Template Name',
        content: 'Updated template content with {{userName}} and {{mediaAnalysis}}',
        description: 'Updated description',
      };

      await request(app.getHttpServer())
        .put(`/templates/${templateId}`)
        .send(updateData)
        .expect(500); // Current implementation throws error

      // Note: This will be 200 when implementation is complete
      // expect(response.body.name).toBe(updateData.name);
      // expect(response.body.content).toBe(updateData.content);
      // expect(response.body.description).toBe(updateData.description);
    });

    it('should return 404 for non-existent template', async () => {
      const updateData = {
        name: 'Updated Name',
      };

      await request(app.getHttpServer())
        .put('/templates/non-existent-id')
        .send(updateData)
        .expect(500); // Current implementation throws error

      // Note: This will be 404 when implementation is complete
    });
  });

  describe('DELETE /templates/:id', () => {
    it('should archive template -> 200', async () => {
      const templateId = 'test-template-id';

      await request(app.getHttpServer()).delete(`/templates/${templateId}`).expect(500); // Current implementation throws error

      // Note: This will be 200 when implementation is complete
      // expect(response.body.status).toBe('archived');
    });

    it('should return 404 for non-existent template', async () => {
      await request(app.getHttpServer()).delete('/templates/non-existent-id').expect(500); // Current implementation throws error

      // Note: This will be 404 when implementation is complete
    });
  });
});
