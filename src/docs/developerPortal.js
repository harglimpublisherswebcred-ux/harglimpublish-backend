const fs = require('fs');
const path = require('path');
const { endpointInventory } = require('./apiInventory');
const { buildOpenApiSpec } = require('./openapiSpec');
const { EVENT_CATALOG } = require('../events/eventCatalog');
const packageInfo = require('../../package.json');

const ROOT = path.resolve(__dirname, '../..');

const DOC_SOURCES = [
  ['OpenAPI JSON', 'docs/openapi.json', '/api/docs.json'],
  ['Swagger UI', 'runtime route', '/api/docs'],
  ['Postman Collection', 'docs/postman_collection.json', null],
  ['Authentication Guide', 'docs/authentication.md', null],
  ['Frontend API Guide', 'docs/frontend-api-guide.md', null],
  ['Architecture Guide', 'docs/architecture.md', null],
  ['Database Guide', 'docs/database.md', null],
  ['Deployment Guide', 'docs/deployment.md', null],
  ['Environment Guide', 'docs/environment.md', null],
  ['Error Code Reference', 'docs/error-codes.md', null]
];

const MODULES = [
  {
    name: 'Authentication',
    purpose: 'JWT identity, current-user hydration, and role-gated admin access.',
    flow: ['Register', 'Login', 'JWT', 'Protected Route', 'Role Gate'],
    collections: ['users'],
    events: []
  },
  {
    name: 'Books & Catalog',
    purpose: 'Public discovery for books, authors, categories, search, reviews, and related titles.',
    flow: ['Browse', 'Search', 'Detail', 'Related', 'Reviews'],
    collections: ['books', 'categories', 'reviews', 'users'],
    events: []
  },
  {
    name: 'Orders',
    purpose: 'Checkout orchestration that bridges legacy order APIs to payment and inventory engines.',
    flow: ['Checkout', 'Create Order', 'Create Payment Intent', 'Reserve Inventory', 'Return QR'],
    collections: ['orders', 'payments', 'inventoryreservations'],
    events: ['OrderCreated', 'OrderCancelled']
  },
  {
    name: 'Payments',
    purpose: 'Manual UPI intent, dynamic QR, UTR verification, status control, and immutable ledger.',
    flow: ['Intent', 'QR', 'UTR', 'Admin Verification', 'Ledger'],
    collections: ['payments', 'paymentledgers'],
    events: ['PaymentIntentCreated', 'QRCodeGenerated', 'PaymentSubmitted', 'PaymentVerified', 'PaymentRejected']
  },
  {
    name: 'Inventory',
    purpose: 'Reservation-based stock management that prevents overselling and records ledger events.',
    flow: ['Reserve', 'Release', 'Deduct', 'Restore', 'Audit'],
    collections: ['inventoryreservations', 'inventoryledgers', 'books'],
    events: ['InventoryReserved', 'InventoryReleased', 'InventoryDeducted']
  },
  {
    name: 'Invoices',
    purpose: 'Idempotent financial document generation after verified payment.',
    flow: ['Payment Verified', 'Number', 'Persist', 'PDF', 'InvoiceGenerated'],
    collections: ['invoices', 'counters'],
    events: ['InvoiceGenerated']
  },
  {
    name: 'Shipping',
    purpose: 'Fulfillment workflow for shipment creation, courier assignment, tracking, and delivery.',
    flow: ['Create', 'Assign Courier', 'Dispatch', 'Track', 'Deliver'],
    collections: ['shipments', 'shipmentledgers'],
    events: ['ShipmentCreated', 'CourierAssigned', 'ShipmentDispatched', 'ShipmentDelivered']
  },
  {
    name: 'Notifications',
    purpose: 'Asynchronous communication pipeline driven by domain events and channel adapters.',
    flow: ['Event', 'Subscriber', 'Service', 'Channel', 'Provider'],
    collections: ['notifications'],
    events: ['PaymentVerified', 'InvoiceGenerated', 'PaymentRejected', 'OrderCancelled']
  },
  {
    name: 'Analytics',
    purpose: 'Read-optimized event projections for revenue, books, customers, payments, inventory, and shipments.',
    flow: ['Domain Event', 'Projection', 'Aggregate', 'Report', 'Dashboard'],
    collections: ['analyticsevents'],
    events: ['OrderCreated', 'PaymentVerified', 'InvoiceGenerated', 'ShipmentDelivered']
  },
  {
    name: 'Admin Operations',
    purpose: 'Operations surface for payment verification, ledgers, inventory, search, invoices, shipping, and analytics.',
    flow: ['Authorize Admin', 'Search', 'Inspect', 'Act', 'Audit'],
    collections: ['payments', 'orders', 'invoices', 'shipments', 'notifications'],
    events: ['AdminApprovedPayment', 'AdminRejectedPayment', 'AdminRecreatedQR']
  }
];

const TECH_STACK = [
  ['Node.js', process.version, 'Runtime'],
  ['Express', packageInfo.dependencies.express, 'HTTP routing'],
  ['MongoDB', 'Mongoose ' + packageInfo.dependencies.mongoose, 'Persistence'],
  ['JWT', packageInfo.dependencies.jsonwebtoken, 'Authentication'],
  ['Swagger', packageInfo.dependencies['swagger-ui-express'], 'API explorer'],
  ['OpenAPI', '3.1.0', 'Contract'],
  ['Jest', packageInfo.devDependencies.jest, 'Testing'],
  ['Event Bus', 'Internal', 'Async domain events'],
  ['Repository Pattern', 'Implemented', 'Data boundary'],
  ['Service Layer', 'Implemented', 'Business boundary']
];

const WORKFLOWS = [
  ['Payment Engine', ['Checkout', 'Payment Intent', 'QR Generation', 'Customer Payment', 'Submit UTR', 'Admin Verification', 'Payment Verified', 'Ledger', 'Invoice', 'Shipment', 'Notification', 'Analytics']],
  ['Inventory Engine', ['Availability', 'Reservation', 'Expiry Watch', 'Release', 'Deduction', 'Rollback', 'Ledger']],
  ['Invoice Engine', ['Payment Verified', 'Counter', 'Invoice Persisted', 'PDF Generated', 'InvoiceGenerated Event']],
  ['Shipping Engine', ['Invoice Ready', 'Shipment Created', 'Courier Assigned', 'Tracking Updated', 'Delivered']],
  ['Notification Engine', ['Domain Event', 'Subscriber', 'Queue', 'Worker', 'Channel Adapter', 'Provider', 'Customer']],
  ['Analytics Engine', ['Event', 'Projection', 'Aggregation', 'Dashboard', 'Export-ready Response']]
];

function fileExists(relativePath) {
  return fs.existsSync(path.join(ROOT, relativePath));
}

function html(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function attr(value) {
  return html(value).replace(/`/g, '&#96;');
}

function methodClass(method) {
  return method.toLowerCase();
}

function getStats(openapi) {
  const protectedEndpoints = endpointInventory.filter((endpoint) => endpoint.auth !== 'Public').length;
  const publicEndpoints = endpointInventory.length - protectedEndpoints;
  const models = fs.existsSync(path.join(ROOT, 'src/models'))
    ? fs.readdirSync(path.join(ROOT, 'src/models')).filter((file) => file.endsWith('.js')).length
    : 0;
  const sequenceDiagrams = fs.existsSync(path.join(ROOT, 'docs/sequences'))
    ? fs.readdirSync(path.join(ROOT, 'docs/sequences')).filter((file) => file.endsWith('.md')).length
    : 0;

  return {
    operations: endpointInventory.length,
    pathTemplates: Object.keys(openapi.paths || {}).length,
    publicEndpoints,
    protectedEndpoints,
    apiGroups: new Set(endpointInventory.map((endpoint) => endpoint.tag)).size,
    models,
    events: Object.keys(EVENT_CATALOG).length,
    sequenceDiagrams
  };
}

function groupEndpoints() {
  return endpointInventory.reduce((groups, endpoint) => {
    groups[endpoint.tag] = groups[endpoint.tag] || [];
    groups[endpoint.tag].push(endpoint);
    return groups;
  }, {});
}

function buildSearchIndex(openapi) {
  const endpointItems = endpointInventory.map((endpoint) => ({
    type: 'Endpoint',
    title: `${endpoint.method} ${endpoint.path}`,
    subtitle: endpoint.summary,
    target: `endpoint-${endpoint.method.toLowerCase()}-${endpoint.path.replace(/[^a-zA-Z0-9]+/g, '-')}`
  }));

  const moduleItems = MODULES.map((module) => ({
    type: 'Module',
    title: module.name,
    subtitle: module.purpose,
    target: `module-${module.name.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()}`
  }));

  const eventItems = Object.entries(EVENT_CATALOG).map(([name, meta]) => ({
    type: 'Event',
    title: name,
    subtitle: meta.description,
    target: 'event-bus'
  }));

  const schemaItems = Object.keys(openapi.components?.schemas || {}).map((name) => ({
    type: 'Schema',
    title: name,
    subtitle: 'OpenAPI component schema',
    target: 'api-explorer'
  }));

  return [...endpointItems, ...moduleItems, ...eventItems, ...schemaItems];
}

function renderDocSources() {
  return DOC_SOURCES.map(([name, source, href]) => {
    const status = source === 'runtime route' || fileExists(source) ? 'Available' : 'Missing';
    const link = href ? `<a href="${href}">Open</a>` : `<span>${html(source)}</span>`;
    return `<tr><td data-label="Source">${html(name)}</td><td data-label="Path">${html(source)}</td><td data-label="Status"><span class="badge ${status === 'Available' ? 'ok' : 'warn'}">${status}</span></td><td data-label="Action">${link}</td></tr>`;
  }).join('');
}

function renderTechStack() {
  return TECH_STACK.map(([name, version, role]) => `
    <article class="surface stack-card">
      <span class="icon" aria-hidden="true">${html(name.slice(0, 2).toUpperCase())}</span>
      <h3>${html(name)}</h3>
      <p>${html(role)}</p>
      <span class="meta-line">${html(version)}</span>
    </article>
  `).join('');
}

function moduleEndpointCount(moduleName) {
  const normalized = moduleName.toLowerCase();
  return endpointInventory.filter((endpoint) => {
    const tag = endpoint.tag.toLowerCase();
    if (normalized.includes('catalog')) return tag.includes('books') || tag.includes('authors');
    if (normalized.includes('admin')) return tag.includes('admin');
    return tag.includes(normalized.split(' ')[0]);
  }).length;
}

function renderModules() {
  return MODULES.map((module) => `
    <article class="surface module-card searchable" id="module-${attr(module.name.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase())}" data-search="${attr(`${module.name} ${module.purpose} ${module.collections.join(' ')} ${module.events.join(' ')}`)}">
      <div class="module-head">
        <span class="icon" aria-hidden="true">${html(module.name.slice(0, 2).toUpperCase())}</span>
        <div>
          <h3>${html(module.name)}</h3>
          <p>${html(module.purpose)}</p>
        </div>
      </div>
      <div class="chips">${module.collections.map((collection) => `<span>${html(collection)}</span>`).join('')}</div>
      <div class="mobile-module-actions">
        <span>${moduleEndpointCount(module.name)} APIs</span>
        <a href="#api-explorer">Open</a>
      </div>
      <details>
        <summary>Architecture, flow, events</summary>
        <ol class="mini-flow">${module.flow.map((step) => `<li>${html(step)}</li>`).join('')}</ol>
        <p class="muted">Events: ${module.events.length ? module.events.map(html).join(', ') : 'None published by this module surface.'}</p>
      </details>
    </article>
  `).join('');
}

function renderWorkflowDiagrams() {
  return WORKFLOWS.map(([name, steps]) => `
    <details class="surface workflow" open>
      <summary>${html(name)}</summary>
      <button class="workflow-modal-button" type="button" data-workflow="${attr(name)}" data-steps="${attr(steps.join(' → '))}">Open full diagram</button>
      <div class="rail" role="list" aria-label="${attr(name)} workflow">
        ${steps.map((step, index) => `
          <button class="rail-step" type="button" role="listitem" data-step="${attr(step)}">
            <span>${index + 1}</span>${html(step)}
          </button>
        `).join('')}
      </div>
    </details>
  `).join('');
}

function renderApiExplorer() {
  const groups = groupEndpoints();
  return Object.entries(groups).map(([tag, endpoints]) => `
    <section class="endpoint-group searchable" data-search="${attr(tag)}" aria-labelledby="tag-${attr(tag.replace(/[^a-zA-Z0-9]+/g, '-'))}">
      <h3 id="tag-${attr(tag.replace(/[^a-zA-Z0-9]+/g, '-'))}">${html(tag)} <span class="count">${endpoints.length}</span></h3>
      <div class="endpoint-list">
        ${endpoints.map((endpoint) => renderEndpoint(endpoint)).join('')}
      </div>
    </section>
  `).join('');
}

function renderEndpoint(endpoint) {
  const id = `endpoint-${endpoint.method.toLowerCase()}-${endpoint.path.replace(/[^a-zA-Z0-9]+/g, '-')}`;
  const url = endpoint.path.replace(/\{([^}]+)\}/g, ':$1');
  const curl = `curl -X ${endpoint.method} "$API_BASE_URL${url}"${endpoint.auth === 'Public' ? '' : ' -H "Authorization: Bearer $TOKEN"'} -H "Content-Type: application/json"`;
  const axios = `await axios.request({ method: '${endpoint.method}', url: '${url}', headers: { Authorization: 'Bearer ' + token } });`;
  const fetchExample = `await fetch(API_BASE_URL + '${url}', { method: '${endpoint.method}', headers: { Authorization: 'Bearer ' + token } });`;
  const flutter = `await dio.request('${url}', options: Options(method: '${endpoint.method}', headers: {'Authorization': 'Bearer $token'}));`;

  return `
    <article class="endpoint searchable" id="${attr(id)}" data-search="${attr(`${endpoint.method} ${endpoint.path} ${endpoint.summary} ${endpoint.auth} ${endpoint.tag}`)}">
      <details>
        <summary>
          <span class="method ${methodClass(endpoint.method)}">${endpoint.method}</span>
          <code>${html(endpoint.path)}</code>
          <span class="endpoint-summary">${html(endpoint.summary)}</span>
          <span class="badge">${html(endpoint.auth)}</span>
        </summary>
        <div class="endpoint-body">
          <dl>
            <div><dt>Description</dt><dd>${html(endpoint.summary)}</dd></div>
            <div><dt>Authorization</dt><dd>${html(endpoint.auth)}</dd></div>
            <div><dt>Controller</dt><dd><code>${html(endpoint.controller)}</code></dd></div>
            <div><dt>Parameters</dt><dd>${endpoint.params?.length ? endpoint.params.map((param) => `<code>${html(param)}</code>`).join(' ') : 'None'}</dd></div>
            <div><dt>Query</dt><dd>${endpoint.query?.length ? endpoint.query.map((query) => `<code>${html(query)}</code>`).join(' ') : 'None'}</dd></div>
            <div><dt>Request Payload</dt><dd>${endpoint.body ? `<code>${html(endpoint.body)}</code>` : 'None'}</dd></div>
            <div><dt>Status Codes</dt><dd>200, 201, 400, 401, 403, 404, 429, 500</dd></div>
          </dl>
          <div class="code-tabs">
            <button type="button" class="copy" data-copy="${attr(curl)}">Copy cURL</button>
            <button type="button" class="copy" data-copy="${attr(axios)}">Copy Axios</button>
            <button type="button" class="copy" data-copy="${attr(fetchExample)}">Copy Fetch</button>
            <button type="button" class="copy" data-copy="${attr(flutter)}">Copy Flutter</button>
            <a class="small-link" href="/api/docs">Open in Swagger</a>
          </div>
          <pre><code>${html(curl)}</code></pre>
        </div>
      </details>
    </article>
  `;
}

function renderEventRows() {
  return Object.entries(EVENT_CATALOG).map(([name, meta]) => `
    <tr class="searchable" data-search="${attr(`${name} ${meta.producer} ${meta.entity} ${meta.description}`)}">
      <td data-label="Event"><code>${html(name)}</code></td>
      <td data-label="Producer">${html(meta.producer)}</td>
      <td data-label="Entity">${html(meta.entity)}</td>
      <td data-label="Description">${html(meta.description)}</td>
    </tr>
  `).join('');
}

function renderDeveloperPortal(req, res) {
  const openapi = buildOpenApiSpec();
  const stats = getStats(openapi);
  const searchIndex = buildSearchIndex(openapi);
  const nodeEnv = process.env.NODE_ENV || 'development';
  const generatedAt = new Date().toISOString();
  const mongodbConfigured = Boolean(process.env.MONGODB_URI);
  const swaggerVersion = packageInfo.dependencies['swagger-ui-express'];

  res.set('Content-Type', 'text/html; charset=utf-8');
  res.set('Content-Security-Policy', [
    "default-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self' 'unsafe-inline'",
    "connect-src 'self'",
    "img-src 'self' data:",
    "font-src 'self'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; '));

  res.send(`<!doctype html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="HM Backend Enterprise Developer Portal">
  <title>HM Backend Enterprise Developer Portal</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #070a12;
      --bg-soft: #0d1420;
      --panel: rgba(17, 25, 39, .78);
      --panel-strong: rgba(22, 33, 50, .94);
      --text: #edf5ff;
      --muted: #9eafc6;
      --line: rgba(255, 255, 255, .12);
      --brand: #38bdf8;
      --brand-2: #22c55e;
      --accent: #a78bfa;
      --warn: #fbbf24;
      --danger: #fb7185;
      --shadow: 0 24px 80px rgba(0, 0, 0, .36);
      --radius: 10px;
      --sidebar: 280px;
    }
    [data-theme="light"] {
      color-scheme: light;
      --bg: #f7f9fc;
      --bg-soft: #edf2f7;
      --panel: rgba(255, 255, 255, .82);
      --panel-strong: rgba(255, 255, 255, .96);
      --text: #0f172a;
      --muted: #526174;
      --line: rgba(15, 23, 42, .14);
      --shadow: 0 24px 80px rgba(15, 23, 42, .12);
    }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      margin: 0;
      min-height: 100vh;
      overflow-x: hidden;
      padding-left: env(safe-area-inset-left);
      padding-right: env(safe-area-inset-right);
      background:
        radial-gradient(circle at 10% 0%, rgba(56, 189, 248, .18), transparent 26rem),
        radial-gradient(circle at 88% 3%, rgba(167, 139, 250, .16), transparent 24rem),
        linear-gradient(180deg, var(--bg), var(--bg-soft) 48%, var(--bg));
      color: var(--text);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.55;
    }
    a { color: inherit; }
    code, pre { font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace; }
    .skip-link {
      position: fixed;
      top: -4rem;
      left: 1rem;
      z-index: 100;
      padding: .75rem 1rem;
      border-radius: var(--radius);
      background: var(--brand);
      color: #02111d;
      font-weight: 800;
      transition: top .18s ease;
    }
    .skip-link:focus { top: 1rem; }
    .app-shell {
      display: grid;
      grid-template-columns: var(--sidebar) minmax(0, 1fr);
      gap: 30px;
      width: min(1760px, 100% - 32px);
      margin: 0 auto;
    }
    .topbar {
      position: sticky;
      top: 0;
      z-index: 40;
      padding-top: env(safe-area-inset-top);
      backdrop-filter: blur(18px);
      background: color-mix(in srgb, var(--bg) 82%, transparent);
      border-bottom: 1px solid var(--line);
    }
    .topbar-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      width: min(1760px, 100% - 32px);
      margin: 0 auto;
      min-height: 68px;
    }
    .brand {
      display: inline-flex;
      align-items: center;
      gap: .8rem;
      font-weight: 900;
      text-decoration: none;
    }
    .mark, .icon {
      display: grid;
      place-items: center;
      width: 42px;
      height: 42px;
      border: 1px solid var(--line);
      border-radius: var(--radius);
      background: linear-gradient(135deg, rgba(56, 189, 248, .22), rgba(34, 197, 94, .14));
      color: var(--brand);
      font-size: .78rem;
      font-weight: 900;
    }
    .top-actions { display: flex; gap: .65rem; align-items: center; flex-wrap: wrap; }
    .menu-toggle {
      display: none;
      width: 46px;
      min-width: 46px;
      padding: 0;
      flex: 0 0 46px;
    }
    .hamburger {
      position: relative;
      display: block;
      width: 20px;
      height: 14px;
    }
    .hamburger span {
      position: absolute;
      left: 0;
      width: 100%;
      height: 2px;
      border-radius: 999px;
      background: currentColor;
      transition: transform .18s ease, opacity .18s ease, top .18s ease;
    }
    .hamburger span:nth-child(1) { top: 0; }
    .hamburger span:nth-child(2) { top: 6px; }
    .hamburger span:nth-child(3) { top: 12px; }
    body.drawer-open .hamburger span:nth-child(1) {
      top: 6px;
      transform: rotate(45deg);
    }
    body.drawer-open .hamburger span:nth-child(2) { opacity: 0; }
    body.drawer-open .hamburger span:nth-child(3) {
      top: 6px;
      transform: rotate(-45deg);
    }
    .search-box {
      min-width: min(420px, 34vw);
      border: 1px solid var(--line);
      background: var(--panel);
      color: var(--text);
      border-radius: var(--radius);
      padding: .8rem 1rem;
      outline: none;
    }
    .search-box:focus { border-color: var(--brand); box-shadow: 0 0 0 3px rgba(56, 189, 248, .15); }
    .button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: .45rem;
      min-height: 44px;
      padding: 0 .95rem;
      border: 1px solid var(--line);
      border-radius: var(--radius);
      background: var(--panel);
      color: var(--text);
      text-decoration: none;
      font-weight: 800;
      cursor: pointer;
      transition: transform .18s ease, border-color .18s ease, background .18s ease;
    }
    .button.primary { background: linear-gradient(135deg, var(--brand), var(--brand-2)); color: #03111c; border: 0; }
    .button:hover, .button:focus { transform: translateY(-2px); border-color: color-mix(in srgb, var(--brand) 60%, var(--line)); }
    .sidebar {
      position: fixed;
      top: 88px;
      left: max(16px, calc((100vw - 1760px) / 2 + 16px));
      width: var(--sidebar);
      padding: 12px;
      border: 1px solid var(--line);
      border-radius: var(--radius);
      background: var(--panel);
      backdrop-filter: blur(18px);
      overflow: visible;
      z-index: 35;
    }
    .drawer-backdrop { display: none; }
    .nav-title {
      margin: .4rem .65rem .7rem;
      color: var(--muted);
      font-size: .78rem;
      text-transform: uppercase;
      letter-spacing: .08em;
    }
    .side-link {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: .7rem;
      padding: .62rem .7rem;
      min-height: 44px;
      border-radius: 8px;
      color: var(--muted);
      text-decoration: none;
      font-size: .94rem;
      border-left: 3px solid transparent;
      transition: color .16s ease, background .16s ease, border-color .16s ease;
    }
    .side-link:hover, .side-link:focus, .side-link.active {
      color: var(--text);
      background: color-mix(in srgb, var(--panel-strong) 80%, transparent);
      border-left-color: var(--brand);
    }
    main {
      min-width: 0;
      grid-column: 2;
      width: min(100%, 1280px);
      padding: 22px 0 64px;
    }
    .hero {
      min-height: 76vh;
      display: grid;
      grid-template-columns: minmax(0, 1.1fr) minmax(320px, .9fr);
      gap: 24px;
      align-items: center;
      padding: 34px 0 44px;
    }
    .eyebrow {
      display: inline-flex;
      gap: .5rem;
      align-items: center;
      color: var(--brand-2);
      font-size: .78rem;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: .08em;
    }
    h1 {
      margin: 16px 0;
      font-size: clamp(3rem, 9vw, 7.8rem);
      line-height: .9;
      letter-spacing: 0;
    }
    h2 { margin: 0; font-size: clamp(1.75rem, 4vw, 3rem); letter-spacing: 0; }
    h3 { margin: 0 0 .4rem; }
    .lead {
      max-width: 820px;
      color: var(--muted);
      font-size: clamp(1.05rem, 2vw, 1.28rem);
    }
    .hero-actions { display: flex; gap: .75rem; flex-wrap: wrap; margin-top: 28px; }
    .surface {
      border: 1px solid var(--line);
      border-radius: var(--radius);
      background: linear-gradient(180deg, var(--panel-strong), var(--panel));
      box-shadow: var(--shadow);
    }
    .command-card { padding: 0; overflow: hidden; animation: enter .65s ease both; }
    .terminal-head {
      display: flex;
      gap: .45rem;
      padding: 13px 15px;
      border-bottom: 1px solid var(--line);
      background: rgba(255, 255, 255, .045);
    }
    .dot { width: 10px; height: 10px; border-radius: 50%; background: var(--danger); }
    .dot:nth-child(2) { background: var(--warn); }
    .dot:nth-child(3) { background: var(--brand-2); }
    pre {
      margin: 0;
      padding: 18px;
      overflow: auto;
      max-width: 100%;
      color: color-mix(in srgb, var(--brand-2) 70%, var(--text));
      font-size: .9rem;
    }
    .section {
      scroll-margin-top: 86px;
      padding: 48px 0;
      content-visibility: auto;
      contain-intrinsic-size: 1px 900px;
    }
    .section-head {
      display: flex;
      justify-content: space-between;
      gap: 1.5rem;
      align-items: end;
      margin-bottom: 18px;
    }
    .muted { color: var(--muted); }
    .grid { display: grid; gap: 14px; }
    .stats { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .stack-grid { grid-template-columns: repeat(5, minmax(0, 1fr)); }
    .module-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .stat, .stack-card, .module-card, .workflow, .doc-card {
      padding: 17px;
      transition: transform .18s ease, border-color .18s ease;
    }
    .stat:hover, .stack-card:hover, .module-card:hover, .workflow:hover, .doc-card:hover {
      transform: translateY(-3px);
      border-color: color-mix(in srgb, var(--brand) 38%, var(--line));
    }
    .stat strong { display: block; font-size: 2rem; line-height: 1; }
    .stat span, .stack-card p, .module-card p { color: var(--muted); }
    .meta-line { display: block; margin-top: .8rem; color: var(--brand); font-size: .84rem; font-weight: 800; }
    .badge, .count {
      display: inline-flex;
      align-items: center;
      min-height: 24px;
      padding: .2rem .55rem;
      border: 1px solid var(--line);
      border-radius: 999px;
      color: var(--muted);
      font-size: .78rem;
      font-weight: 800;
    }
    .badge.ok { color: var(--brand-2); border-color: rgba(34, 197, 94, .38); }
    .badge.warn { color: var(--warn); border-color: rgba(251, 191, 36, .4); }
    .module-head { display: flex; gap: .9rem; align-items: flex-start; }
    .chips { display: flex; gap: .45rem; flex-wrap: wrap; margin: 14px 0; }
    .chips span {
      padding: .22rem .5rem;
      border: 1px solid var(--line);
      border-radius: 999px;
      color: var(--muted);
      font-size: .8rem;
    }
    .mobile-module-actions,
    .workflow-modal-button {
      display: none;
    }
    details {
      border-top: 1px solid var(--line);
      margin-top: 12px;
      padding-top: 12px;
    }
    summary { cursor: pointer; font-weight: 900; }
    .workflow summary {
      list-style: none;
      min-height: 44px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      font-size: 1.08rem;
    }
    .workflow summary::-webkit-details-marker { display: none; }
    .workflow summary::after {
      content: "+";
      color: var(--brand);
      font-size: 1.25rem;
      line-height: 1;
    }
    .workflow[open] summary::after { content: "-"; }
    .workflow {
      margin-top: 0;
      padding-top: 17px;
    }
    .mini-flow {
      display: flex;
      gap: .5rem;
      flex-wrap: wrap;
      list-style: none;
      padding: 0;
      margin: 12px 0;
    }
    .mini-flow li, .rail-step {
      border: 1px solid var(--line);
      border-radius: var(--radius);
      padding: .55rem .7rem;
      background: color-mix(in srgb, var(--panel-strong) 78%, transparent);
      color: var(--muted);
    }
    .rail {
      display: flex;
      gap: .55rem;
      flex-wrap: wrap;
      margin-top: 14px;
    }
    .rail-step {
      display: inline-flex;
      align-items: center;
      gap: .45rem;
      color: var(--text);
      cursor: pointer;
    }
    .rail-step span {
      display: grid;
      place-items: center;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: color-mix(in srgb, var(--brand) 25%, transparent);
      color: var(--brand);
      font-weight: 900;
    }
    .diagram {
      display: grid;
      grid-template-columns: repeat(7, minmax(96px, 1fr));
      gap: 10px;
    }
    .diagram .box {
      position: relative;
      padding: 16px 10px;
      border: 1px solid var(--line);
      border-radius: var(--radius);
      background: var(--panel);
      text-align: center;
      color: var(--muted);
      font-weight: 900;
    }
    .diagram .box:not(:last-child)::after {
      content: "";
      position: absolute;
      right: -10px;
      top: 50%;
      width: 10px;
      border-top: 1px solid var(--brand);
    }
    .api-toolbar {
      display: flex;
      gap: .75rem;
      flex-wrap: wrap;
      margin-bottom: 18px;
    }
    .endpoint-group { margin-bottom: 24px; }
    .endpoint-list { display: grid; gap: 10px; }
    .endpoint {
      border: 1px solid var(--line);
      border-radius: var(--radius);
      background: var(--panel);
    }
    .endpoint details { border: 0; margin: 0; padding: 0; }
    .endpoint summary {
      display: grid;
      grid-template-columns: 82px minmax(160px, 1fr) minmax(150px, 1.4fr) auto;
      gap: .75rem;
      align-items: center;
      padding: 14px;
      min-height: 56px;
    }
    .method {
      display: inline-flex;
      justify-content: center;
      border-radius: 7px;
      padding: .32rem .5rem;
      font-weight: 950;
      color: #03111c;
      background: var(--brand);
    }
    .method.post { background: var(--brand-2); }
    .method.put { background: var(--warn); }
    .method.delete { background: var(--danger); color: #fff; }
    .endpoint-summary { color: var(--muted); }
    .endpoint-body {
      padding: 0 14px 14px;
      border-top: 1px solid var(--line);
    }
    dl {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }
    dt { color: var(--muted); font-size: .82rem; }
    dd { margin: .2rem 0 0; }
    .code-tabs {
      display: flex;
      gap: .5rem;
      flex-wrap: wrap;
      margin: 12px 0;
    }
    .copy, .small-link {
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--panel-strong);
      color: var(--text);
      padding: .48rem .65rem;
      cursor: pointer;
      text-decoration: none;
      font-weight: 800;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      overflow: hidden;
      border: 1px solid var(--line);
      border-radius: var(--radius);
      background: var(--panel);
    }
    th, td {
      padding: .8rem;
      border-bottom: 1px solid var(--line);
      text-align: left;
      vertical-align: top;
    }
    th { color: var(--muted); font-size: .82rem; text-transform: uppercase; letter-spacing: .06em; }
    .status-line {
      display: inline-flex;
      align-items: center;
      gap: .5rem;
    }
    .pulse {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--warn);
      box-shadow: 0 0 0 0 rgba(251, 191, 36, .45);
      animation: pulse 1.8s infinite;
    }
    .pulse.ok { background: var(--brand-2); box-shadow: 0 0 0 0 rgba(34, 197, 94, .45); }
    .command-palette {
      position: fixed;
      inset: 0;
      z-index: 90;
      display: none;
      background: rgba(0, 0, 0, .55);
      padding: 10vh 16px;
    }
    .command-palette.open { display: block; }
    .command-panel {
      width: min(760px, 100%);
      margin: 0 auto;
      border: 1px solid var(--line);
      border-radius: var(--radius);
      background: var(--panel-strong);
      box-shadow: var(--shadow);
      overflow: hidden;
    }
    .command-panel input {
      width: 100%;
      border: 0;
      border-bottom: 1px solid var(--line);
      background: transparent;
      color: var(--text);
      padding: 1rem;
      outline: none;
      font-size: 1rem;
    }
    .command-results { max-height: 420px; overflow: auto; }
    .command-item {
      display: block;
      padding: .85rem 1rem;
      border-bottom: 1px solid var(--line);
      text-decoration: none;
    }
    .command-item small { display: block; color: var(--muted); }
    .workflow-modal {
      position: fixed;
      inset: 0;
      z-index: 95;
      display: none;
      padding: 20px;
      background: rgba(0, 0, 0, .62);
    }
    .workflow-modal.open { display: grid; place-items: center; }
    .workflow-modal-card {
      width: min(560px, 100%);
      border: 1px solid var(--line);
      border-radius: var(--radius);
      background: var(--panel-strong);
      box-shadow: var(--shadow);
      padding: 18px;
    }
    .workflow-modal-card h2 { font-size: 1.35rem; margin-bottom: .75rem; }
    .workflow-modal-card p { color: var(--muted); line-height: 1.7; }
    .skeleton {
      position: relative;
      overflow: hidden;
      min-height: 16px;
      border-radius: 999px;
      background: color-mix(in srgb, var(--muted) 15%, transparent);
    }
    .skeleton::after {
      content: "";
      position: absolute;
      inset: 0;
      transform: translateX(-100%);
      background: linear-gradient(90deg, transparent, rgba(255,255,255,.16), transparent);
      animation: shimmer 1.3s infinite;
    }
    footer {
      margin-top: 50px;
      padding: 30px 0 40px;
      border-top: 1px solid var(--line);
      color: var(--muted);
    }
    .hidden { display: none !important; }
    @keyframes enter {
      from { opacity: 0; transform: translateY(18px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes shimmer { 100% { transform: translateX(100%); } }
    @keyframes pulse {
      70% { box-shadow: 0 0 0 12px rgba(34,197,94,0); }
      100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
    }
    @media (max-width: 1199px) {
      .app-shell {
        grid-template-columns: 1fr;
        width: min(100% - 28px, 1120px);
      }
      .menu-toggle { display: inline-flex; }
      .sidebar {
        position: fixed;
        top: 0;
        bottom: 0;
        left: 0;
        width: min(340px, 85vw);
        padding: calc(18px + env(safe-area-inset-top)) 14px calc(18px + env(safe-area-inset-bottom));
        border-radius: 0 var(--radius) var(--radius) 0;
        transform: translateX(-102%);
        opacity: 0;
        pointer-events: none;
        transition: transform .22s ease, opacity .22s ease;
        z-index: 60;
      }
      body.drawer-open { overflow: hidden; }
      body.drawer-open .sidebar {
        transform: translateX(0);
        opacity: 1;
        pointer-events: auto;
      }
      .drawer-backdrop {
        display: block;
        position: fixed;
        inset: 0;
        z-index: 55;
        background: rgba(0, 0, 0, .48);
        opacity: 0;
        pointer-events: none;
        transition: opacity .2s ease;
      }
      body.drawer-open .drawer-backdrop {
        opacity: 1;
        pointer-events: auto;
      }
      main { grid-column: 1; width: 100%; }
      .hero { grid-template-columns: 1fr; min-height: auto; padding-top: 22px; }
      .stack-grid, .module-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .diagram { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .diagram .box:not(:last-child)::after { display: none; }
    }
    @media (max-width: 767px) {
      body { line-height: 1.6; }
      .topbar-inner {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 48px 48px;
        align-items: center;
        gap: 8px;
        padding: 10px 0;
        min-height: 0;
      }
      .brand {
        min-width: 0;
        gap: .6rem;
        font-size: .95rem;
      }
      .brand span:last-child {
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
      .mark {
        width: 38px;
        height: 38px;
        flex: 0 0 38px;
      }
      .search-box {
        grid-column: 1 / -1;
        grid-row: 2;
        width: 100%;
        min-width: 0;
        min-height: 48px;
        border-radius: 999px;
        position: sticky;
        top: calc(68px + env(safe-area-inset-top));
        z-index: 41;
        font-size: 1rem;
      }
      .top-actions, .hero-actions { width: 100%; }
      .top-actions { display: contents; }
      .menu-toggle {
        grid-column: 2;
        grid-row: 1;
        justify-self: stretch;
        display: inline-flex;
      }
      #themeToggle {
        grid-column: 3;
        grid-row: 1;
      }
      #commandButton,
      .top-actions > .button.primary {
        display: none;
      }
      .button { width: 100%; min-height: 48px; }
      .hero-actions { display: grid; grid-template-columns: 1fr; }
      .stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .stack-grid, .module-grid, .diagram, dl { grid-template-columns: 1fr; }
      .stat, .stack-card, .module-card, .workflow, .doc-card { padding: 15px; }
      .section { padding: 24px 0; scroll-margin-top: 132px; }
      .section-head { display: block; margin-bottom: 14px; }
      .hero {
        gap: 18px;
        padding: 24px 0;
      }
      h1 { font-size: 32px; line-height: 1.08; }
      h2 { font-size: 22px; line-height: 1.2; }
      h3, .workflow summary { font-size: 18px; }
      .lead, p, .muted { font-size: 16px; }
      .module-head .icon {
        width: 52px;
        height: 52px;
        flex: 0 0 52px;
      }
      .mobile-module-actions {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-top: 12px;
      }
      .mobile-module-actions span,
      .mobile-module-actions a {
        min-height: 44px;
        display: inline-flex;
        align-items: center;
        border-radius: 8px;
        font-weight: 900;
      }
      .mobile-module-actions a {
        justify-content: center;
        padding: 0 14px;
        border: 1px solid var(--line);
        text-decoration: none;
      }
      .endpoint summary { grid-template-columns: 1fr; }
      .endpoint-body { padding: 0 12px 12px; }
      .method { width: max-content; min-width: 72px; }
      .endpoint-summary { font-size: .95rem; }
      .rail { display: grid; grid-template-columns: 1fr; }
      .rail-step { width: 100%; justify-content: flex-start; min-height: 44px; }
      .workflow:not([open]) { padding-bottom: 15px; }
      .workflow-modal-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        min-height: 48px;
        margin: 12px 0 4px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--panel-strong);
        color: var(--text);
        font-weight: 900;
      }
      table, thead, tbody, tr, th, td { display: block; width: 100%; }
      thead { display: none; }
      tr { border-bottom: 1px solid var(--line); padding: .65rem 0; }
      td { border-bottom: 0; padding: .42rem .75rem; }
      td::before { content: attr(data-label); display: block; color: var(--muted); font-size: .76rem; text-transform: uppercase; letter-spacing: .06em; }
    }
    @media (max-width: 420px) {
      .app-shell, .topbar-inner { width: min(100% - 20px, 1120px); }
      .stats { gap: 10px; }
      .stat strong { font-size: 1.55rem; }
    }
    @media (max-width: 340px) {
      .stats { grid-template-columns: 1fr; }
      .brand span:last-child { max-width: 180px; }
    }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { animation: none !important; scroll-behavior: auto !important; transition: none !important; }
    }
  </style>
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="topbar">
    <div class="topbar-inner">
      <a class="brand" href="/">
        <span class="mark" aria-hidden="true">HM</span>
        <span>Enterprise Developer Portal</span>
      </a>
      <div class="top-actions">
        <button id="menuToggle" class="button menu-toggle" type="button" aria-controls="portalSidebar" aria-expanded="false" aria-label="Open navigation menu">
          <span class="hamburger" aria-hidden="true"><span></span><span></span><span></span></span>
        </button>
        <input id="globalSearch" class="search-box" type="search" placeholder="Search endpoints, modules, events, docs...  Ctrl+K" aria-label="Global search">
        <button id="commandButton" class="button" type="button">Command</button>
        <button id="themeToggle" class="button" type="button" aria-pressed="false">Theme</button>
        <a class="button primary" href="/api/docs">Explore Swagger</a>
      </div>
    </div>
  </header>

  <div class="app-shell">
    <div id="drawerBackdrop" class="drawer-backdrop" aria-hidden="true"></div>
    <aside id="portalSidebar" class="sidebar" aria-label="Portal navigation">
      <div>
        <div class="nav-title">Platform</div>
        <a class="side-link" href="#overview">Overview</a>
        <a class="side-link" href="#architecture">Architecture</a>
        <a class="side-link" href="#modules">Modules</a>
        <a class="side-link" href="#api-explorer">API Explorer</a>
      </div>
      <div>
        <div class="nav-title">Engines</div>
        <a class="side-link" href="#workflows">Workflows</a>
        <a class="side-link" href="#event-bus">Event Bus</a>
        <a class="side-link" href="#database">Database</a>
        <a class="side-link" href="#testing">Testing</a>
      </div>
      <div>
        <div class="nav-title">Operate</div>
        <a class="side-link" href="#deployment">Deployment</a>
        <a class="side-link" href="#environment">Environment</a>
        <a class="side-link" href="#frontend">Frontend</a>
        <a class="side-link" href="#quick-links">Quick Links</a>
      </div>
    </aside>

    <main id="main">
      <section class="hero" id="overview">
        <div>
          <div class="eyebrow">Production-ready Backend DX Platform</div>
          <h1>HM Backend</h1>
          <p class="lead">A complete developer experience console for the commerce and publishing backend: OpenAPI explorer, architecture maps, business workflows, events, database references, environment guidance, and live runtime status.</p>
          <div class="hero-actions">
            <a class="button primary" href="/api/docs">Explore Swagger</a>
            <a class="button" href="/api/docs.json">OpenAPI JSON</a>
            <a class="button" href="/health">Health Check</a>
            <a class="button" href="#architecture">Architecture</a>
          </div>
        </div>
        <aside class="surface command-card" aria-label="Live status preview">
          <div class="terminal-head" aria-hidden="true"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>
          <pre><code>GET /health
GET /api/docs
GET /api/docs.json

Status: <span id="terminalHealth">checking...</span>
OpenAPI: ${html(openapi.openapi)}
Swagger: ${html(swaggerVersion)}
Node: ${html(process.version)}</code></pre>
        </aside>
      </section>

      <section class="section" id="stats">
        <div class="section-head"><div><h2>Quick Stats</h2><p class="muted">Generated from OpenAPI, source models, event catalog, and docs.</p></div></div>
        <div class="grid stats">
          <article class="surface stat"><strong>${stats.operations}</strong><span>API operations</span></article>
          <article class="surface stat"><strong>${stats.models}</strong><span>Mongoose models</span></article>
          <article class="surface stat"><strong>${stats.events}</strong><span>Domain events</span></article>
          <article class="surface stat"><strong>${stats.sequenceDiagrams}</strong><span>Sequence diagrams</span></article>
          <article class="surface stat"><strong>${stats.publicEndpoints}</strong><span>Public endpoints</span></article>
          <article class="surface stat"><strong>${stats.protectedEndpoints}</strong><span>Protected endpoints</span></article>
          <article class="surface stat"><strong>${stats.apiGroups}</strong><span>API groups</span></article>
          <article class="surface stat"><strong>${stats.pathTemplates}</strong><span>Path templates</span></article>
        </div>
      </section>

      <section class="section" id="tech-stack">
        <div class="section-head"><div><h2>Tech Stack</h2><p class="muted">Runtime and delivery architecture currently installed in this project.</p></div></div>
        <div class="grid stack-grid">${renderTechStack()}</div>
      </section>

      <section class="section" id="architecture">
        <div class="section-head"><div><h2>Architecture</h2><p class="muted">Layered backend with event-driven side effects and repository/service separation.</p></div></div>
        <div class="diagram" role="list" aria-label="System architecture">
          ${['Frontend', 'Authentication', 'Express', 'Controllers', 'Services', 'Repositories', 'MongoDB'].map((item) => `<div class="box" role="listitem">${html(item)}</div>`).join('')}
        </div>
        <div class="grid module-grid" style="margin-top:14px">
          <article class="surface doc-card"><h3>System Architecture</h3><p class="muted">HTTP concerns stay in routes/controllers; business behavior lives in services; persistence is repository-driven.</p></article>
          <article class="surface doc-card"><h3>Event Driven Architecture</h3><p class="muted">Events publish after transaction commit and fan out to invoices, notifications, shipping, analytics, and placeholders.</p></article>
        </div>
      </section>

      <section class="section" id="modules">
        <div class="section-head"><div><h2>Business Modules</h2><p class="muted">Each module visualizes purpose, flow, collections, and events without duplicating API behavior.</p></div></div>
        <div class="grid module-grid">${renderModules()}</div>
      </section>

      <section class="section" id="workflows">
        <div class="section-head"><div><h2>Workflow Diagrams</h2><p class="muted">Clickable operational timelines for the production engines.</p></div></div>
        <div class="grid">${renderWorkflowDiagrams()}</div>
      </section>

      <section class="section" id="api-explorer">
        <div class="section-head">
          <div><h2>API Explorer</h2><p class="muted">Automatically rendered from the same endpoint inventory used for OpenAPI.</p></div>
          <a class="button" href="/api/docs">Open in Swagger</a>
        </div>
        <div class="api-toolbar">
          <button class="button" type="button" data-filter="all">All</button>
          <button class="button" type="button" data-filter="public">Public</button>
          <button class="button" type="button" data-filter="protected">Protected</button>
        </div>
        ${renderApiExplorer()}
      </section>

      <section class="section" id="auth">
        <div class="section-head"><div><h2>Authentication</h2><p class="muted">JWT flow, role authorization, admin guardrails, and integration examples.</p></div></div>
        <div class="diagram" role="list" aria-label="Authentication flow">
          ${['Register', 'Login', 'JWT Token', 'Bearer Header', 'Protected Route', 'Role Check', 'Response'].map((item) => `<div class="box" role="listitem">${html(item)}</div>`).join('')}
        </div>
        <pre class="surface"><code>Authorization: Bearer &lt;jwt&gt;</code></pre>
      </section>

      <section class="section" id="event-bus">
        <div class="section-head"><div><h2>Event Bus</h2><p class="muted">Publishers, subscribers, queue hooks, retries, idempotency, and correlation-ready event metadata.</p></div></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Event</th><th>Producer</th><th>Entity</th><th>Description</th></tr></thead>
            <tbody>${renderEventRows()}</tbody>
          </table>
        </div>
      </section>

      <section class="section" id="database">
        <div class="section-head"><div><h2>Database</h2><p class="muted">Collections, relationships, indexes, unique constraints, and transaction paths are documented in the database guide.</p></div></div>
        <div class="grid module-grid">
          <article class="surface doc-card"><h3>Collections</h3><p class="muted">Orders, payments, ledgers, reservations, invoices, shipments, notifications, analytics events, books, users, categories.</p></article>
          <article class="surface doc-card"><h3>Transactions</h3><p class="muted">Payment, order bridge, invoice, admin operations, shipping, and inventory services use session-aware writes.</p></article>
        </div>
      </section>

      <section class="section" id="testing">
        <div class="section-head"><div><h2>Testing</h2><p class="muted">Regression coverage spans repositories, services, integrations, auth, events, analytics, invoices, notifications, payments, and shipping.</p></div></div>
        <div class="grid stats">
          <article class="surface stat"><strong>24</strong><span>Suites last validated</span></article>
          <article class="surface stat"><strong>158</strong><span>Tests last validated</span></article>
          <article class="surface stat"><strong>0</strong><span>Known failing tests</span></article>
          <article class="surface stat"><strong>Jest</strong><span>Test runner</span></article>
        </div>
      </section>

      <section class="section" id="deployment">
        <div class="section-head"><div><h2>Deployment & Live Status</h2><p class="muted">Operational readiness links for DevOps and QA teams.</p></div></div>
        <div class="grid stats">
          <article class="surface stat"><strong><span class="status-line"><span id="healthDot" class="pulse"></span><span id="healthText">Checking</span></span></strong><span>Health endpoint</span></article>
          <article class="surface stat"><strong>${html(nodeEnv)}</strong><span>Environment</span></article>
          <article class="surface stat"><strong>${mongodbConfigured ? 'Configured' : 'Missing'}</strong><span>MongoDB URI</span></article>
          <article class="surface stat"><strong>${html(packageInfo.version)}</strong><span>Version</span></article>
          <article class="surface stat"><strong>${html(openapi.openapi)}</strong><span>OpenAPI</span></article>
          <article class="surface stat"><strong>${html(swaggerVersion)}</strong><span>Swagger UI</span></article>
          <article class="surface stat"><strong>${html(process.version)}</strong><span>Node</span></article>
          <article class="surface stat"><strong>${html(generatedAt)}</strong><span>Rendered at</span></article>
        </div>
      </section>

      <section class="section" id="environment">
        <div class="section-head"><div><h2>Environment Variables</h2><p class="muted">Source-driven env guide is available in <code>docs/environment.md</code>. No secret values are rendered here.</p></div></div>
        <div class="grid module-grid">
          <article class="surface doc-card"><h3>Required Runtime</h3><p class="muted"><code>MONGODB_URI</code>, <code>JWT_SECRET</code></p></article>
          <article class="surface doc-card"><h3>Payment QR</h3><p class="muted"><code>MERCHANT_UPI_ID</code>, <code>MERCHANT_NAME</code>, <code>PAYMENT_EXPIRY_DURATION</code>, <code>QR_EXPIRY_MINUTES</code></p></article>
        </div>
      </section>

      <section class="section" id="frontend">
        <div class="section-head"><div><h2>Frontend Integration</h2><p class="muted">React, Axios, Fetch, Flutter, protected routes, pagination, filtering, searching, uploads, and JWT usage are documented in the frontend guide.</p></div></div>
        <div class="grid module-grid">
          <article class="surface doc-card"><h3>Fetch</h3><pre><code>await fetch(API_BASE_URL + '/api/auth/me', {
  headers: { Authorization: 'Bearer ' + token }
});</code></pre></article>
          <article class="surface doc-card"><h3>Axios</h3><pre><code>await axios.get('/api/auth/me', {
  headers: { Authorization: 'Bearer ' + token }
});</code></pre></article>
        </div>
      </section>

      <section class="section" id="docs">
        <div class="section-head"><div><h2>Documentation Sources</h2><p class="muted">The portal links to existing generated artifacts instead of duplicating them.</p></div></div>
        <table>
          <thead><tr><th>Source</th><th>Path</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>${renderDocSources()}</tbody>
        </table>
      </section>

      <section class="section" id="quick-links">
        <div class="section-head"><div><h2>Quick Links</h2><p class="muted">High-frequency entry points for developers, QA, and operations.</p></div></div>
        <div class="grid module-grid">
          <a class="surface doc-card" href="/api/docs"><h3>Swagger</h3><p class="muted">Interactive API console.</p></a>
          <a class="surface doc-card" href="/api/docs.json"><h3>OpenAPI JSON</h3><p class="muted">Contract for tooling and clients.</p></a>
          <a class="surface doc-card" href="/health"><h3>Health</h3><p class="muted">Runtime status endpoint.</p></a>
          <a class="surface doc-card" href="#api-explorer"><h3>API Explorer</h3><p class="muted">Portal-native endpoint browser.</p></a>
        </div>
      </section>

      <footer>
        <p>HM Backend Enterprise Developer Portal. Version ${html(packageInfo.version)}. License ${html(packageInfo.license)}. OpenAPI ${html(openapi.openapi)}. Swagger ${html(swaggerVersion)}.</p>
      </footer>
    </main>
  </div>

  <div id="commandPalette" class="command-palette" role="dialog" aria-modal="true" aria-label="Command palette">
    <div class="command-panel">
      <input id="commandInput" type="search" placeholder="Search and jump...">
      <div id="commandResults" class="command-results"></div>
    </div>
  </div>

  <div id="workflowModal" class="workflow-modal" role="dialog" aria-modal="true" aria-labelledby="workflowModalTitle">
    <div class="workflow-modal-card">
      <h2 id="workflowModalTitle">Workflow</h2>
      <p id="workflowModalSteps"></p>
      <button id="workflowModalClose" class="button" type="button">Close</button>
    </div>
  </div>

  <script>
    (function () {
      var searchIndex = ${JSON.stringify(searchIndex).replace(/</g, '\\u003c')};
      var root = document.documentElement;
      var search = document.getElementById('globalSearch');
      var palette = document.getElementById('commandPalette');
      var commandInput = document.getElementById('commandInput');
      var commandResults = document.getElementById('commandResults');
      var themeToggle = document.getElementById('themeToggle');
      var menuToggle = document.getElementById('menuToggle');
      var drawerBackdrop = document.getElementById('drawerBackdrop');
      var healthDot = document.getElementById('healthDot');
      var healthText = document.getElementById('healthText');
      var terminalHealth = document.getElementById('terminalHealth');
      var workflowModal = document.getElementById('workflowModal');
      var workflowModalTitle = document.getElementById('workflowModalTitle');
      var workflowModalSteps = document.getElementById('workflowModalSteps');
      var workflowModalClose = document.getElementById('workflowModalClose');
      var sideLinks = Array.prototype.slice.call(document.querySelectorAll('.side-link'));
      var sections = sideLinks.map(function (link) {
        return document.querySelector(link.getAttribute('href'));
      }).filter(Boolean);

      function setTheme(theme) {
        root.setAttribute('data-theme', theme);
        try { localStorage.setItem('portal-theme', theme); } catch (error) {}
        themeToggle.setAttribute('aria-pressed', theme === 'light' ? 'true' : 'false');
      }

      try { setTheme(localStorage.getItem('portal-theme') || 'dark'); } catch (error) { setTheme('dark'); }

      themeToggle.addEventListener('click', function () {
        setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
      });

      function setDrawer(open) {
        document.body.classList.toggle('drawer-open', open);
        menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        menuToggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
      }

      menuToggle.addEventListener('click', function () {
        setDrawer(!document.body.classList.contains('drawer-open'));
      });

      drawerBackdrop.addEventListener('click', function () { setDrawer(false); });

      function syncWorkflowDisclosure() {
        var mobile = window.matchMedia('(max-width: 767px)').matches;
        document.querySelectorAll('.workflow').forEach(function (workflow) {
          if (mobile) workflow.removeAttribute('open');
          else workflow.setAttribute('open', '');
        });
      }

      syncWorkflowDisclosure();
      window.addEventListener('resize', function () {
        if (window.innerWidth >= 1200) setDrawer(false);
        syncWorkflowDisclosure();
      });

      function filterPage(term) {
        var value = term.trim().toLowerCase();
        document.querySelectorAll('.searchable').forEach(function (item) {
          var haystack = (item.getAttribute('data-search') || item.textContent || '').toLowerCase();
          item.classList.toggle('hidden', Boolean(value) && haystack.indexOf(value) === -1);
        });
      }

      search.addEventListener('input', function () { filterPage(search.value); });

      function setActiveSection(id) {
        sideLinks.forEach(function (link) {
          link.classList.toggle('active', link.getAttribute('href') === '#' + id);
        });
      }

      sideLinks.forEach(function (link) {
        link.addEventListener('click', function (event) {
          var target = document.querySelector(link.getAttribute('href'));
          if (!target) return;
          event.preventDefault();
          setDrawer(false);
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          history.replaceState(null, '', link.getAttribute('href'));
          setActiveSection(target.id);
        });
      });

      if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) setActiveSection(entry.target.id);
          });
        }, { rootMargin: '-30% 0px -58% 0px', threshold: 0.01 });
        sections.forEach(function (section) { observer.observe(section); });
      } else if (sections[0]) {
        setActiveSection(sections[0].id);
      }

      function renderCommandResults(term) {
        var value = term.trim().toLowerCase();
        var matches = searchIndex.filter(function (item) {
          return !value || (item.type + ' ' + item.title + ' ' + item.subtitle).toLowerCase().indexOf(value) !== -1;
        }).slice(0, 24);
        commandResults.innerHTML = matches.map(function (item) {
          return '<a class="command-item" href="#' + item.target + '"><strong>' + item.title + '</strong><small>' + item.type + ' - ' + item.subtitle + '</small></a>';
        }).join('') || '<div class="command-item"><strong>No results</strong><small>Try another endpoint, module, event, or schema.</small></div>';
      }

      function openPalette() {
        palette.classList.add('open');
        commandInput.value = search.value;
        renderCommandResults(commandInput.value);
        setTimeout(function () { commandInput.focus(); }, 0);
      }

      function closePalette() { palette.classList.remove('open'); search.focus(); }

      document.getElementById('commandButton').addEventListener('click', openPalette);
      commandInput.addEventListener('input', function () { renderCommandResults(commandInput.value); });
      commandResults.addEventListener('click', function (event) {
        if (event.target.closest('a')) closePalette();
      });
      palette.addEventListener('click', function (event) {
        if (event.target === palette) closePalette();
      });
      document.addEventListener('keydown', function (event) {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
          event.preventDefault();
          openPalette();
        }
        if (event.key === 'Escape' && palette.classList.contains('open')) closePalette();
        if (event.key === 'Escape' && document.body.classList.contains('drawer-open')) setDrawer(false);
        if (event.key === 'Escape' && workflowModal.classList.contains('open')) closeWorkflowModal();
      });

      document.querySelectorAll('.copy').forEach(function (button) {
        button.addEventListener('click', function () {
          var text = button.getAttribute('data-copy') || '';
          navigator.clipboard.writeText(text).then(function () {
            var old = button.textContent;
            button.textContent = 'Copied';
            setTimeout(function () { button.textContent = old; }, 1200);
          });
        });
      });

      document.querySelectorAll('[data-filter]').forEach(function (button) {
        button.addEventListener('click', function () {
          var filter = button.getAttribute('data-filter');
          document.querySelectorAll('.endpoint').forEach(function (endpoint) {
            var text = endpoint.textContent.toLowerCase();
            var isPublic = text.indexOf('public') !== -1;
            endpoint.classList.toggle('hidden', filter === 'public' ? !isPublic : filter === 'protected' ? isPublic : false);
          });
        });
      });

      function closeWorkflowModal() {
        workflowModal.classList.remove('open');
      }

      document.querySelectorAll('.workflow-modal-button').forEach(function (button) {
        button.addEventListener('click', function () {
          workflowModalTitle.textContent = button.getAttribute('data-workflow') || 'Workflow';
          workflowModalSteps.textContent = button.getAttribute('data-steps') || '';
          workflowModal.classList.add('open');
          workflowModalClose.focus();
        });
      });

      workflowModalClose.addEventListener('click', closeWorkflowModal);
      workflowModal.addEventListener('click', function (event) {
        if (event.target === workflowModal) closeWorkflowModal();
      });

      fetch('/health', { headers: { Accept: 'application/json' } })
        .then(function (response) {
          if (!response.ok) throw new Error('Health check failed');
          return response.json();
        })
        .then(function (payload) {
          healthDot.classList.add('ok');
          healthText.textContent = payload.status || 'OK';
          terminalHealth.textContent = payload.status || 'OK';
        })
        .catch(function () {
          healthText.textContent = 'Unavailable';
          terminalHealth.textContent = 'unavailable';
        });
    }());
  </script>
</body>
</html>`);
}

module.exports = { renderDeveloperPortal };
