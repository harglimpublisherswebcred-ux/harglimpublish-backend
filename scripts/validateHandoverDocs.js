const fs = require('fs');
const path = require('path');

const { endpointInventory } = require('../src/docs/apiInventory');

const root = path.join(__dirname, '..');
const handoverPath = path.join(root, 'docs', 'HM_BACKEND_COMPLETE_HANDOVER.md');
const openapiPath = path.join(root, 'docs', 'openapi.json');

const handover = fs.readFileSync(handoverPath, 'utf8');
const openapi = JSON.parse(fs.readFileSync(openapiPath, 'utf8'));

const unique = new Map();
for (const endpoint of endpointInventory) {
  unique.set(`${endpoint.method} ${endpoint.path}`, endpoint);
}

const uniqueEndpoints = Array.from(unique.values());
const writeEndpoints = uniqueEndpoints.filter((endpoint) => !['GET', 'HEAD', 'OPTIONS'].includes(endpoint.method));
const multipartEndpoints = uniqueEndpoints.filter((endpoint) => {
  return endpoint.body === 'MultipartImageRequest' || endpoint.body === 'MultipartDocumentRequest';
});

const referencedSchemas = Array.from(
  new Set(writeEndpoints.map((endpoint) => endpoint.body).filter((body) => body && /Request$/.test(body)))
).sort();

const definedSchemas = Object.keys(openapi.components?.schemas || {});
const danglingSchemas = referencedSchemas.filter((schema) => !definedSchemas.includes(schema));

const missingEndpointDocs = uniqueEndpoints.filter((endpoint) => {
  return !handover.includes(`\`${endpoint.path}\``) && !handover.includes(endpoint.path);
});

const missingWriteDocs = writeEndpoints.filter((endpoint) => {
  return !handover.includes(`| ${endpoint.method} | \`${endpoint.path}\``) && !handover.includes(`${endpoint.method} ${endpoint.path}`);
});

const badMultipart = multipartEndpoints.filter((endpoint) => {
  if (endpoint.body === 'MultipartImageRequest') return !endpoint.notes?.includes('image');
  if (endpoint.body === 'MultipartDocumentRequest') return !endpoint.notes?.includes('document');
  return true;
});

const registerSchema = openapi.components.schemas.RegisterRequest;
const registerHasRole = Boolean(registerSchema?.properties?.role);
const handoverRegisterSection = handover.split('### RegisterRequest')[1]?.split('\n### ')[0] || '';
const handoverRegisterHasRole = /\|\s*`role`\s*\|/.test(handoverRegisterSection);

const mrpDocumentedCanonical = /Book\.mrp[\s\S]{0,120}canonical/i.test(handover) || /MRP canonical:\s*YES/i.test(handover);

const results = {
  uniqueApis: uniqueEndpoints.length,
  readApis: uniqueEndpoints.length - writeEndpoints.length,
  writeApis: writeEndpoints.length,
  multipartApis: multipartEndpoints.length,
  referencedSchemas: referencedSchemas.length,
  definedSchemas: definedSchemas.length,
  danglingSchemas,
  missingEndpointDocs: missingEndpointDocs.map((endpoint) => `${endpoint.method} ${endpoint.path}`),
  missingWriteDocs: missingWriteDocs.map((endpoint) => `${endpoint.method} ${endpoint.path}`),
  badMultipart: badMultipart.map((endpoint) => `${endpoint.method} ${endpoint.path}`),
  registerHasRole,
  handoverRegisterHasRole,
  mrpDocumentedCanonical
};

console.log(JSON.stringify(results, null, 2));

const failed =
  danglingSchemas.length > 0 ||
  missingEndpointDocs.length > 0 ||
  missingWriteDocs.length > 0 ||
  badMultipart.length > 0 ||
  registerHasRole ||
  handoverRegisterHasRole ||
  !mrpDocumentedCanonical;

if (failed) {
  process.exitCode = 1;
}
