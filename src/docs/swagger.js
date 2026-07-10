const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { buildOpenApiSpec } = require('./openapiSpec');

const swaggerSpec = swaggerJsdoc({
  definition: buildOpenApiSpec(),
  apis: ['./src/routes/*.js', './src/controllers/*.js']
});

function getRequestOrigin(req) {
  const forwardedProto = req.get('x-forwarded-proto');
  const forwardedHost = req.get('x-forwarded-host');
  const proto = forwardedProto ? forwardedProto.split(',')[0].trim() : req.protocol;
  const host = forwardedHost ? forwardedHost.split(',')[0].trim() : req.get('host');
  return `${proto}://${host}`;
}

function getSwaggerSpecForRequest(req) {
  const origin = getRequestOrigin(req);
  const localServer = { url: 'http://localhost:5000', description: 'Local development' };
  const currentServer = { url: origin, description: 'Current deployment' };

  return {
    ...swaggerSpec,
    servers: origin === localServer.url
      ? [currentServer]
      : [currentServer, localServer]
  };
}

function mountSwagger(app) {
  const swaggerUiOptions = {
    explorer: true,
    customSiteTitle: 'HM Backend API Docs',
    swaggerUrl: '/api/docs.json'
  };

  app.use('/api/docs', swaggerUi.serveFiles(null, swaggerUiOptions), (req, res, next) => {
    return swaggerUi.setup(null, {
      ...swaggerUiOptions
    })(req, res, next);
  });

  app.get('/api/docs.json', (req, res) => {
    res.json(getSwaggerSpecForRequest(req));
  });
}

module.exports = {
  mountSwagger,
  swaggerSpec,
  getSwaggerSpecForRequest
};
