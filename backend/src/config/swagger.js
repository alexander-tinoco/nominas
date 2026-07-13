import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Sistema de Auditoría y Consulta de Nóminas API',
      version: '1.0.0',
      description: 'API REST para consultar personal, recibos de nómina y reportes contables gubernamentales.',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor Local de Desarrollo',
      },
    ],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);

export const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};
