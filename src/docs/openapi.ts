export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Backend Challenge API',
    version: '1.0.0',
    description: 'User management API with MongoDB and JWT authentication.',
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Local server',
    },
  ],
  tags: [
    { name: 'Auth' },
    { name: 'Users' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        required: ['error'],
        properties: {
          error: {
            type: 'object',
            required: ['message'],
            properties: {
              message: { type: 'string', example: 'Validation failed' },
              details: { type: 'object', additionalProperties: true },
            },
          },
        },
      },
      AuthPayload: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'alice@example.com' },
          password: { type: 'string', example: 'password123' },
        },
      },
      RegisterPayload: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', example: 'Alice' },
          email: { type: 'string', format: 'email', example: 'alice@example.com' },
          password: { type: 'string', minLength: 8, example: 'password123' },
        },
      },
      CreateUserPayload: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', example: 'Bob' },
          email: { type: 'string', format: 'email', example: 'bob@example.com' },
          password: { type: 'string', minLength: 8, example: 'password123' },
        },
      },
      UpdateUserPayload: {
        type: 'object',
        minProperties: 1,
        properties: {
          name: { type: 'string', example: 'Bob Updated' },
          email: { type: 'string', format: 'email', example: 'bob.updated@example.com' },
        },
      },
      PublicUser: {
        type: 'object',
        required: ['id', 'name', 'email', 'createdAt'],
        properties: {
          id: { type: 'string', example: '665f2034bcf86cd799439012' },
          name: { type: 'string', example: 'Bob' },
          email: { type: 'string', format: 'email', example: 'bob@example.com' },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2026-06-13T10:05:00.000Z',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            example: '2026-06-13T10:05:00.000Z',
          },
        },
      },
      AuthResponse: {
        type: 'object',
        required: ['data'],
        properties: {
          data: {
            type: 'object',
            required: ['user', 'token'],
            properties: {
              user: { $ref: '#/components/schemas/PublicUser' },
              token: { type: 'string', example: '<jwt-token>' },
            },
          },
        },
      },
      UserResponse: {
        type: 'object',
        required: ['data'],
        properties: {
          data: { $ref: '#/components/schemas/PublicUser' },
        },
      },
      UserListResponse: {
        type: 'object',
        required: ['data', 'meta'],
        properties: {
          data: {
            type: 'array',
            items: { $ref: '#/components/schemas/PublicUser' },
          },
          meta: {
            type: 'object',
            required: ['page', 'limit', 'total'],
            properties: {
              page: { type: 'integer', example: 1 },
              limit: { type: 'integer', example: 20 },
              total: { type: 'integer', example: 1 },
            },
          },
        },
      },
    },
  },
  paths: {
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterPayload' },
            },
          },
        },
        responses: {
          '201': {
            description: 'User registered',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '409': { $ref: '#/components/responses/ConflictError' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AuthPayload' },
            },
          },
        },
        responses: {
          '200': {
            description: 'User logged in',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/UnauthorizedError' },
        },
      },
    },
    '/api/users': {
      post: {
        tags: ['Users'],
        summary: 'Create user',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/AuthorizationHeader' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateUserPayload' },
            },
          },
        },
        responses: {
          '201': {
            description: 'User created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserResponse' },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/AuthTokenError' },
          '409': { $ref: '#/components/responses/ConflictError' },
        },
      },
      get: {
        tags: ['Users'],
        summary: 'List users',
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/AuthorizationHeader' },
          {
            name: 'page',
            in: 'query',
            required: false,
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            required: false,
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          },
        ],
        responses: {
          '200': {
            description: 'Users list',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserListResponse' },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/AuthTokenError' },
        },
      },
    },
    '/api/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Get user by ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/AuthorizationHeader' },
          { $ref: '#/components/parameters/UserId' },
        ],
        responses: {
          '200': {
            description: 'User found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserResponse' },
              },
            },
          },
          '401': { $ref: '#/components/responses/AuthTokenError' },
          '404': { $ref: '#/components/responses/NotFoundError' },
        },
      },
      patch: {
        tags: ['Users'],
        summary: 'Update user',
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/AuthorizationHeader' },
          { $ref: '#/components/parameters/UserId' },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateUserPayload' },
            },
          },
        },
        responses: {
          '200': {
            description: 'User updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserResponse' },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/AuthTokenError' },
          '404': { $ref: '#/components/responses/NotFoundError' },
          '409': { $ref: '#/components/responses/ConflictError' },
        },
      },
      delete: {
        tags: ['Users'],
        summary: 'Delete user',
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/AuthorizationHeader' },
          { $ref: '#/components/parameters/UserId' },
        ],
        responses: {
          '204': { description: 'User deleted' },
          '401': { $ref: '#/components/responses/AuthTokenError' },
          '404': { $ref: '#/components/responses/NotFoundError' },
        },
      },
    },
  },
};

Object.assign(openApiSpec.components, {
  parameters: {
    AuthorizationHeader: {
      name: 'Authorization',
      in: 'header',
      required: true,
      schema: {
        type: 'string',
        example: 'Bearer <token>',
      },
      description: 'JWT bearer token.',
    },
    UserId: {
      name: 'id',
      in: 'path',
      required: true,
      schema: { type: 'string' },
      example: '665f2034bcf86cd799439012',
    },
  },
  responses: {
    ValidationError: {
      description: 'Validation failed',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/ErrorResponse' },
          example: { error: { message: 'Validation failed', details: {} } },
        },
      },
    },
    UnauthorizedError: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/ErrorResponse' },
          example: { error: { message: 'Invalid email or password' } },
        },
      },
    },
    AuthTokenError: {
      description: 'Missing or invalid authorization token',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/ErrorResponse' },
          examples: {
            missing: { value: { error: { message: 'Missing authorization token' } } },
            invalid: { value: { error: { message: 'Invalid authorization token' } } },
          },
        },
      },
    },
    NotFoundError: {
      description: 'Resource not found',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/ErrorResponse' },
          example: { error: { message: 'User not found' } },
        },
      },
    },
    ConflictError: {
      description: 'Conflict',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/ErrorResponse' },
          examples: {
            service: { value: { error: { message: 'Email already exists' } } },
            database: {
              value: {
                error: {
                  message: 'email already exists',
                  details: { email: 'alice@example.com' },
                },
              },
            },
          },
        },
      },
    },
  },
});
