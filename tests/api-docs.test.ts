import request from 'supertest';
import { createApp } from '@/app';

describe('api docs', () => {
  it('serves the OpenAPI spec', async () => {
    const app = createApp();

    const response = await request(app).get('/api-docs.json');

    expect(response.status).toBe(200);
    expect(response.body.openapi).toBe('3.0.3');
    expect(response.body.paths).not.toHaveProperty('/health');
    expect(response.body.paths).toHaveProperty('/api/auth/register');
    expect(response.body.paths).toHaveProperty('/api/users/{id}');
    expect(response.body.paths['/api/users/{id}'].get.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ $ref: '#/components/parameters/AuthorizationHeader' }),
      ])
    );
  });
});
