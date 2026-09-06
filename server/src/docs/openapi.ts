export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'StockPulse Multi-Tenant Inventory & Order Engine API',
    version: '1.0.0',
    description: `
**StockPulse** is a distributed, high-concurrency B2B inventory management platform and Point-of-Sale (POS) order engine.

### Key Architectural Guarantees
- **ACID Pessimistic Concurrency**: Eliminates inventory overselling and race conditions via PostgreSQL \`SELECT ... FOR UPDATE\` row-level locking.
- **Zero-Wait Deadlock Prevention**: Enforces deterministic ascending ID sorting (\`ORDER BY id ASC\`) to eliminate Coffman circular wait conditions ($C_4$).
- **Zero-Trust Multi-Tenancy**: 3-tier defense-in-depth isolation (JWT claims, query-level scoping, database composite unique indexes).
- **Sub-50ms API Latency**: Hardware-backed database connection pool and optimized indexed queries.
    `,
    contact: {
      name: 'StockPulse Engineering Team',
      url: 'https://github.com/shatwiks/StockPulse-Multi-Tenant-Inventory-Order-Engine',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: '/api/v1',
      description: 'Current Environment API Gateway',
    },
    {
      url: 'http://localhost:3001/api/v1',
      description: 'Local Development Server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token acquired from /auth/login.',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'INSUFFICIENT_STOCK' },
              message: { type: 'string', example: 'One or more items do not have sufficient stock.' },
              details: { type: 'object' },
            },
          },
          message: { type: 'string', example: 'Operation failed.' },
        },
      },
      ShortageDetail: {
        type: 'object',
        properties: {
          productId: { type: 'string', format: 'uuid' },
          sku: { type: 'string', example: 'WH-MOUSE-RGB' },
          productName: { type: 'string', example: 'Ergonomic Wireless Mouse' },
          requestedQuantity: { type: 'integer', example: 5 },
          availableQuantity: { type: 'integer', example: 2 },
          shortage: { type: 'integer', example: 3 },
        },
      },
      InsufficientStockError: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'INSUFFICIENT_STOCK' },
              message: { type: 'string', example: 'One or more items do not have sufficient stock.' },
              details: {
                type: 'object',
                properties: {
                  shortages: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/ShortageDetail' },
                  },
                },
              },
            },
          },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'admin@bharat-retail.in' },
          password: { type: 'string', format: 'password', example: 'StockPulse2026!' },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  email: { type: 'string' },
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  role: { type: 'string', enum: ['ADMIN', 'MANAGER', 'CASHIER'] },
                  organizationId: { type: 'string', format: 'uuid' },
                },
              },
              organization: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  name: { type: 'string', example: 'Bharat Logistics & Retail' },
                  slug: { type: 'string', example: 'bharat-retail' },
                },
              },
            },
          },
        },
      },
      Product: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          sku: { type: 'string', example: 'ELEC-LAPTOP-PRO' },
          name: { type: 'string', example: 'Enterprise Laptop Pro 16' },
          description: { type: 'string' },
          price: { type: 'number', example: 89999.0 },
          stockQuantity: { type: 'integer', example: 45 },
          lowStockThreshold: { type: 'integer', example: 10 },
          status: { type: 'string', enum: ['ACTIVE', 'DRAFT', 'DISCONTINUED', 'OUT_OF_STOCK'] },
          categoryId: { type: 'string', format: 'uuid', nullable: true },
          category: {
            type: 'object',
            nullable: true,
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string', example: 'Electronics' },
            },
          },
        },
      },
      OrderItemInput: {
        type: 'object',
        required: ['productId', 'quantity'],
        properties: {
          productId: { type: 'string', format: 'uuid' },
          quantity: { type: 'integer', minimum: 1, example: 2 },
        },
      },
      CreateOrderRequest: {
        type: 'object',
        required: ['items'],
        properties: {
          customerName: { type: 'string', example: 'Anand Kumar' },
          customerEmail: { type: 'string', format: 'email', example: 'anand@example.in' },
          items: {
            type: 'array',
            items: { $ref: '#/components/schemas/OrderItemInput' },
          },
        },
      },
      Order: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          orderNumber: { type: 'string', example: 'ORD-17727192-A83B' },
          customerName: { type: 'string' },
          totalAmount: { type: 'number', example: 179998.0 },
          status: { type: 'string', enum: ['PENDING', 'COMPLETED', 'CANCELLED'] },
          createdAt: { type: 'string', format: 'date-time' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                productId: { type: 'string', format: 'uuid' },
                quantity: { type: 'integer' },
                unitPrice: { type: 'number' },
                subtotal: { type: 'number' },
              },
            },
          },
        },
      },
      Category: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Industrial Hardware' },
          description: { type: 'string' },
          productCount: { type: 'integer', example: 14 },
        },
      },
      SystemHealth: {
        type: 'object',
        properties: {
          systemStatus: { type: 'string', enum: ['OPERATIONAL', 'DEGRADED', 'OUTAGE'] },
          timestamp: { type: 'string', format: 'date-time' },
          database: {
            type: 'object',
            properties: {
              status: { type: 'string', example: 'CONNECTED' },
              engine: { type: 'string', example: 'PostgreSQL 16.x' },
              latencyMs: { type: 'number', example: 4.8 },
              connectionPool: {
                type: 'object',
                properties: {
                  active: { type: 'integer', example: 1 },
                  idle: { type: 'integer', example: 9 },
                  maxConnections: { type: 'integer', example: 10 },
                },
              },
            },
          },
          apiSla: {
            type: 'object',
            properties: {
              uptimeTarget: { type: 'string', example: '99.99%' },
              p50LatencyMs: { type: 'number', example: 14 },
              p95LatencyMs: { type: 'number', example: 38 },
              p99LatencyMs: { type: 'number', example: 72 },
            },
          },
          auditStream: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                type: { type: 'string', example: 'ORDER_PLACED' },
                actor: { type: 'string', example: 'Aarav Sharma' },
                description: { type: 'string' },
                timestamp: { type: 'string', format: 'date-time' },
                status: { type: 'string', example: 'SUCCESS' },
              },
            },
          },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  paths: {
    '/auth/login': {
      post: {
        tags: ['Authentication & RBAC'],
        summary: 'Tenant User Login',
        description: 'Authenticates a corporate tenant user (Admin, Manager, or Cashier) and returns a signed JWT containing organization partition parameters.',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Authentication successful. Returns JWT token and tenant context.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginResponse' },
              },
            },
          },
          401: {
            description: 'Invalid credentials or inactive user account.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/products': {
      get: {
        tags: ['Catalog & Inventory'],
        summary: 'List Tenant Products',
        description: 'Retrieves all products strictly scoped to the authenticated tenant organization. Supports full-text search, category filter, and low-stock alarms.',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search term by SKU or title' },
          { name: 'categoryId', in: 'query', schema: { type: 'string' }, description: 'Filter by category UUID' },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['ACTIVE', 'DRAFT', 'DISCONTINUED', 'OUT_OF_STOCK'] } },
        ],
        responses: {
          200: {
            description: 'Filtered product catalog for the current tenant.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Product' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Catalog & Inventory'],
        summary: 'Create New Product',
        description: 'Creates a new product record inside the authenticated tenant catalog. Requires ADMIN or MANAGER role.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['sku', 'name', 'price', 'stockQuantity'],
                properties: {
                  sku: { type: 'string', example: 'IND-SENSOR-4K' },
                  name: { type: 'string', example: 'Precision Optical Sensor 4K' },
                  description: { type: 'string' },
                  price: { type: 'number', example: 14500.0 },
                  stockQuantity: { type: 'integer', minimum: 0, example: 30 },
                  lowStockThreshold: { type: 'integer', default: 5 },
                  categoryId: { type: 'string', format: 'uuid', nullable: true },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Product successfully created.' },
          403: { description: 'Forbidden. Cashiers cannot create products.' },
          409: { description: 'Conflict. SKU already exists in this organization.' },
        },
      },
    },
    '/products/{id}': {
      patch: {
        tags: ['Catalog & Inventory'],
        summary: 'Update Product Details',
        description: 'Updates product title, description, price, or threshold. Requires ADMIN or MANAGER role.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Product updated successfully.' },
          403: { description: 'Insufficient permissions.' },
          404: { description: 'Product not found in this tenant.' },
        },
      },
      delete: {
        tags: ['Catalog & Inventory'],
        summary: 'Delete Product',
        description: 'Soft or hard deletes a product from the tenant catalog. Requires ADMIN or MANAGER role.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Product deleted.' },
          403: { description: 'Forbidden.' },
          404: { description: 'Not found.' },
        },
      },
    },
    '/products/{id}/stock': {
      patch: {
        tags: ['Catalog & Inventory'],
        summary: 'Adjust Physical Stock Quantity',
        description: 'Direct inventory stock count adjustment with audit log recording. Requires ADMIN or MANAGER role.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['stockQuantity'],
                properties: {
                  stockQuantity: { type: 'integer', minimum: 0, example: 50 },
                  reason: { type: 'string', example: 'Physical stock replenishment from Mumbai warehouse' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Stock adjusted successfully.' },
        },
      },
    },
    '/categories': {
      get: {
        tags: ['Categories'],
        summary: 'List Product Categories',
        description: 'Retrieves all product categories for the active tenant organization.',
        responses: {
          200: {
            description: 'List of categories.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Category' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Categories'],
        summary: 'Create Category',
        description: 'Creates a new product classification category for the tenant. Requires ADMIN or MANAGER role.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', example: 'Smart Logistics Sensors' },
                  description: { type: 'string', example: 'IoT tracking and warehouse automation hardware' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Category created successfully.' },
          409: { description: 'Category name already exists in this tenant.' },
        },
      },
    },
    '/orders': {
      post: {
        tags: ['Orders & POS Checkout (ACID Concurrency)'],
        summary: 'Atomic POS Checkout with Pessimistic Row Locking',
        description: `
Executes an atomic checkout across one or more line items.
- **Pessimistic Row Lock**: Executes \`SELECT ... FOR UPDATE ORDER BY id ASC\` to lock inventory rows.
- **Deadlock Elimination**: Ascending ID sorting guarantees zero cyclic waits.
- **Strict Invariant**: If ANY item in the basket lacks sufficient stock, the entire transaction is rolled back with HTTP 409 Conflict. Zero negative stock drift guaranteed.
        `,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateOrderRequest' },
            },
          },
        },
        responses: {
          201: {
            description: 'Order atomically placed and inventory decremented.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Order' },
                  },
                },
              },
            },
          },
          409: {
            description: 'Insufficient stock. Transaction rolled back with itemized shortages.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/InsufficientStockError' },
              },
            },
          },
        },
      },
      get: {
        tags: ['Orders & POS Checkout (ACID Concurrency)'],
        summary: 'List Tenant Orders',
        description: 'Retrieves chronological historical orders and order items for the tenant organization.',
        responses: {
          200: {
            description: 'List of tenant orders.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Order' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/concurrency/demo-product': {
      get: {
        tags: ['Concurrency Stress Testing'],
        summary: 'Get Concurrency Demo Target Product',
        description: 'Returns or seeds the dedicated flash-sale item used for live browser multi-terminal stress testing.',
        responses: {
          200: {
            description: 'Target demo product.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Product' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/concurrency/reset-stock': {
      post: {
        tags: ['Concurrency Stress Testing'],
        summary: 'Reset Demo Product Stock',
        description: 'Atomically resets the demo product inventory to a specified quantity for repeatable recruiter benchmarks.',
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  stockQuantity: { type: 'integer', default: 5, example: 5 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Stock reset completed.' },
        },
      },
    },
    '/system/health': {
      get: {
        tags: ['Observability & Telemetry'],
        summary: 'System Telemetry & Operational Health',
        description: 'Returns live PostgreSQL connection pool metrics, database ping latency, SLA percentiles (p50/p95/p99), and chronological audit event stream.',
        responses: {
          200: {
            description: 'Live system telemetry.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/SystemHealth' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/organization': {
      get: {
        tags: ['Organization & Multi-Tenancy'],
        summary: 'Get Tenant Profile & Members',
        description: 'Returns tenant organization details, subscription tier, and employee roster.',
        responses: {
          200: { description: 'Tenant profile and member directory.' },
        },
      },
      patch: {
        tags: ['Organization & Multi-Tenancy'],
        summary: 'Update Tenant Settings',
        description: 'Updates tenant name or metadata. Requires ADMIN role.',
        responses: {
          200: { description: 'Organization updated.' },
        },
      },
    },
  },
};
