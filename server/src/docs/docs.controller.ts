import { Request, Response } from 'express';
import { openApiSpec } from './openapi';

/**
 * Returns the raw OpenAPI 3.0 specification as JSON.
 * Endpoint: GET /api/v1/openapi.json
 */
export function getOpenApiSpecHandler(req: Request, res: Response): void {
  res.setHeader('Content-Type', 'application/json');
  res.json(openApiSpec);
}

/**
 * Serves an interactive, responsive, dark-walnut API documentation console.
 * Endpoint: GET /api/docs
 */
export function getApiDocsUiHandler(req: Request, res: Response): void {
  const specJsonString = JSON.stringify(openApiSpec).replace(/</g, '\\u003c');

  const html = `<!doctype html>
<html lang="en" class="dark">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>StockPulse Engine | OpenAPI 3.0 Interactive Documentation</title>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220%22><text y=%2226%22 font-size=%2224%22>⚡</text></svg>">
    <style>
      body {
        margin: 0;
        padding: 0;
        background-color: #09090b;
        color: #f4f4f5;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      }
      #fallback-banner {
        display: none;
        padding: 16px 24px;
        background: #18181b;
        border-bottom: 1px solid #27272a;
      }
    </style>
  </head>
  <body>
    <!-- Official Scalar Standalone Script & Spec Anchor -->
    <script
      id="api-reference"
      type="application/json"
      data-url="/api/v1/openapi.json"
      data-configuration='{"theme":"amber","darkMode":true,"layout":"modern","searchHotKey":"k","showSidebar":true}'>
      ${specJsonString}
    </script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>

    <noscript>
      <div style="padding: 40px; max-width: 800px; margin: 0 auto;">
        <h1>StockPulse API Reference</h1>
        <p>Please enable JavaScript to view the interactive OpenAPI documentation console.</p>
        <p>Direct OpenAPI specification available at: <a href="/api/v1/openapi.json" style="color: #f59e0b;">/api/v1/openapi.json</a></p>
      </div>
    </noscript>
  </body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
}

/**
 * Serves classic Swagger UI as an additional interactive console option.
 * Endpoint: GET /swagger
 */
export function getSwaggerUiHandler(req: Request, res: Response): void {
  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>StockPulse Engine | Swagger UI</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui.css" />
    <style>
      body {
        margin: 0;
        background: #171310;
      }
      .swagger-ui {
        filter: invert(88%) hue-rotate(180deg);
      }
      .swagger-ui .topbar {
        display: none;
      }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui-bundle.js" crossorigin></script>
    <script src="https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui-standalone-preset.js" crossorigin></script>
    <script>
      window.onload = () => {
        window.ui = SwaggerUIBundle({
          url: '/api/v1/openapi.json',
          dom_id: '#swagger-ui',
          deepLinking: true,
          presets: [
            SwaggerUIBundle.presets.apis,
            SwaggerUIStandalonePreset
          ],
          layout: "StandaloneLayout"
        });
      };
    </script>
  </body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
}
