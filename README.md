# Asaas MCP Server

A complete Model Context Protocol (MCP) server for integrating with the Asaas payment platform. Provides structured tools for customers, payments, subscriptions, installments, refunds, and webhooks.

## Features

- **Customers**: Create, read, update, delete, and list customers
- **Payments**: Full payment lifecycle (create, status, PIX QR Code, bank slip, cancel, refund)
- **Subscriptions**: Recurring billing with flexible cycles
- **Installments**: Parcelamento (installment plans) with multiple payments
- **Refunds**: Full and partial refunds for payments and installments
- **Webhooks**: Configure and manage webhook subscriptions
- **Idempotency**: Built-in support via `externalReference` and idempotency keys
- **Security**: No credentials in logs, input validation, structured errors
- **Observability**: Structured logging with Pino

## Quick Start

### Prerequisites

- Node.js 20+
- Asaas account with API key

### Installation

```bash
# Clone and install
cd asaas-mcp-server
npm install

# Configure environment
cp .env.example .env
# Edit .env with your ASAAS_API_KEY

# Build
npm run build

# Run
npm start
```

### Development

```bash
# Run with hot reload
npm run dev

# Run tests
npm test

# Lint and format
npm run lint
npm run format
```

## Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ASAAS_API_KEY` | Yes | - | Your Asaas API key |
| `ASAAS_API_URL` | No | `https://api-sandbox.asaas.com/v3` | Asaas API endpoint |
| `ASAAS_WEBHOOK_AUTH_TOKEN` | No | - | Token for validating webhook signatures |
| `LOG_LEVEL` | No | `info` | Log level (fatal, error, warn, info, debug, trace) |
| `HTTP_TIMEOUT_MS` | No | `30000` | HTTP request timeout |
| `HTTP_MAX_RETRIES` | No | `3` | Max retry attempts |
| `HTTP_RETRY_DELAY_MS` | No | `1000` | Base retry delay |

### Sandbox vs Production

**Sandbox** (default): `https://api-sandbox.asaas.com/v3`
- Use for development/testing
- Enable "Foreign customers" in sandbox settings if needed
- Use sandbox-specific test endpoints for payment simulation

**Production**: `https://api.asaas.com/v3`
- Real money movements
- Requires approved account

## MCP Client Configuration

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "asaas": {
      "command": "node",
      "args": ["/path/to/asaas-mcp-server/dist/index.js"],
      "env": {
        "ASAAS_API_KEY": "your_api_key",
        "ASAAS_API_URL": "https://api-sandbox.asaas.com/v3"
      }
    }
  }
}
```

### Other MCP Clients

The server communicates via stdio. Configure your client to launch:
- Command: `node`
- Args: `[/path/to/dist/index.js]`
- Environment: Set `ASAAS_API_KEY` and optionally `ASAAS_API_URL`

## Available Tools

### Customers

| Tool | Description |
|------|-------------|
| `asaas_create_customer` | Create a new customer |
| `asaas_get_customer` | Get customer by ID |
| `asaas_list_customers` | List customers with filters |
| `asaas_update_customer` | Update customer details |
| `asaas_delete_customer` | Delete a customer |
| `asaas_restore_customer` | Restore deleted customer |

### Payments

| Tool | Description |
|------|-------------|
| `asaas_create_payment` | Create a new charge |
| `asaas_get_payment` | Get payment details |
| `asaas_list_payments` | List payments with filters |
| `asaas_update_payment` | Update payment |
| `asaas_delete_payment` | Cancel/delete payment |
| `asaas_restore_payment` | Restore deleted payment |
| `asaas_get_payment_status` | Get simplified payment status |
| `asaas_get_payment_pix_qrcode` | Get PIX QR Code and payload |
| `asaas_get_payment_bank_slip` | Get boleto details |
| `asaas_confirm_cash_receipt` | Confirm cash payment |
| `asaas_undo_cash_receipt` | Undo cash confirmation |

### Subscriptions

| Tool | Description |
|------|-------------|
| `asaas_create_subscription` | Create recurring subscription |
| `asaas_get_subscription` | Get subscription details |
| `asaas_list_subscriptions` | List subscriptions |
| `asaas_update_subscription` | Update subscription |
| `asaas_cancel_subscription` | Cancel subscription |
| `asaas_update_subscription_credit_card` | Update credit card |
| `asaas_list_subscription_payments` | List generated charges |

### Installments

| Tool | Description |
|------|-------------|
| `asaas_create_installment` | Create installment plan |
| `asaas_get_installment` | Get installment plan |
| `asaas_list_installments` | List installment plans |
| `asaas_delete_installment` | Delete installment plan |
| `asaas_list_installment_payments` | List generated charges |
| `asaas_generate_installment_booklet` | Generate carnê PDF |
| `asaas_cancel_installment_payments` | Cancel pending charges |

### Refunds

| Tool | Description |
|------|-------------|
| `asaas_refund_payment` | Refund a payment (full/partial) |
| `asaas_list_payment_refunds` | List refund history |
| `asaas_refund_installment` | Refund installment payment |
| `asaas_refund_bank_slip` | Refund boleto payment |

### Webhooks

| Tool | Description |
|------|-------------|
| `asaas_create_webhook` | Create webhook config |
| `asaas_get_webhook` | Get webhook config |
| `asaas_list_webhooks` | List webhooks |
| `asaas_update_webhook` | Update webhook |
| `asaas_delete_webhook` | Delete webhook |
| `asaas_remove_webhook_penalty` | Remove penalties |
| `asaas_list_webhook_events` | List available events |

## Usage Examples

### Create Customer + Payment Flow

```javascript
// 1. Create customer
const customer = await asaas_create_customer({
  name: "João Silva",
  cpfCnpj: "12345678901",
  email: "joao@email.com",
  phone: "11999999999",
  externalReference: "user_123"
});

// 2. Create PIX payment
const payment = await asaas_create_payment({
  customer: customer.id,
  billingType: "PIX",
  value: 150.00,
  dueDate: "2026-10-15",
  description: "Order #12345",
  externalReference: "order_12345"
});

// 3. Get PIX QR Code
const pix = await asaas_get_payment_pix_qrcode({
  paymentId: payment.id
});
// Use pix.payload (copia e cola) or pix.qrCodeBase64

// 4. Check status
const status = await asaas_get_payment_status({ paymentId: payment.id });
```

### Create Subscription

```javascript
const subscription = await asaas_create_subscription({
  customer: "cus_xxx",
  billingType: "PIX",
  value: 99.90,
  nextDueDate: "2026-11-01",
  cycle: "MONTHLY",
  description: "Plano Premium Mensal",
  externalReference: "sub_premium_user_123"
});
```

### Configure Webhook

```javascript
const webhook = await asaas_create_webhook({
  name: "Production Webhook",
  url: "https://myapp.com/webhooks/asaas",
  email: "dev@myapp.com",
  enabled: true,
  interrupted: false,
  apiVersion: 3,
  authToken: "whsec_your_secure_token_here",
  sendType: "SEQUENTIALLY",
  events: [
    "PAYMENT_RECEIVED",
    "PAYMENT_CONFIRMED",
    "PAYMENT_OVERDUE",
    "PAYMENT_REFUNDED",
    "SUBSCRIPTION_CREATED",
    "SUBSCRIPTION_INACTIVATED"
  ]
});
// IMPORTANT: Save webhook.authToken for validating incoming requests!
```

## Webhook Event Processing

The server provides utilities for processing webhook events in your application:

```typescript
import { parseWebhookEvent, validateWebhookEvent, WEBHOOK_EVENTS } from 'asaas-mcp-server';

// In your webhook endpoint
app.post('/webhooks/asaas', (req, res) => {
  const event = parseWebhookEvent(req.body);
  
  // Verify idempotency
  if (await alreadyProcessed(event.id)) {
    return res.status(200).send('OK');
  }
  
  // Validate event type
  if (!validateWebhookEvent(event.event)) {
    return res.status(400).send('Unknown event');
  }
  
  // Process asynchronously
  processEventAsync(event);
  
  res.status(200).send('OK');
});
```

## Idempotency

All write operations support idempotency via:
- **`externalReference`**: Your internal ID (order_id, user_id, etc.)
- **Idempotency-Key header**: Automatically generated for create operations

```javascript
// Same externalReference = same operation (idempotent)
await asaas_create_payment({
  customer: "cus_xxx",
  billingType: "PIX",
  value: 100,
  dueDate: "2026-10-15",
  externalReference: "order_123" // Unique per order
});
```

## Security

- API keys never logged or exposed to the model
- Structured errors without stack traces
- Input validation with Zod schemas
- Sensitive data redaction in logs (credit cards, tokens, passwords)
- Timeout and retry controls
- No blind retries on financial operations

## Error Handling

Errors are mapped to structured codes:

| Code | HTTP | Description |
|------|------|-------------|
| `ASAAS_AUTHENTICATION_ERROR` | 401 | Invalid API key |
| `ASAAS_PERMISSION_ERROR` | 403 | Insufficient permissions |
| `ASAAS_NOT_FOUND` | 404 | Resource not found |
| `ASAAS_VALIDATION_ERROR` | 400 | Invalid input |
| `ASAAS_CONFLICT` | 409 | Conflict/idempotency |
| `ASAAS_RATE_LIMITED` | 429 | Rate limit exceeded |
| `ASAAS_SERVICE_ERROR` | 5xx | Asaas service error |

## Testing

```bash
# Unit tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

Test files:
- `tests/unit/` - Unit tests for schemas, client, formatting
- `tests/integration/` - Integration tests (require sandbox credentials)

## Architecture

```
src/
├── index.ts                 # Entry point
├── config.ts               # Configuration management
├── server/
│   └── mcp-server.ts       # MCP server setup
├── asaas/
│   ├── client.ts           # HTTP client with retry/timeout
│   ├── types.ts            # TypeScript types from OpenAPI
│   ├── errors.ts           # Error classes and mapping
│   └── endpoints/          # API endpoint wrappers
├── tools/                  # MCP tool implementations
├── schemas/                # Zod validation schemas
├── utils/
│   ├── logging.ts          # Pino logger
│   ├── pagination.ts       # Pagination helpers
│   ├── formatting.ts       # Currency, dates, sanitization
│   └── errors.ts           # MCP error conversion
```

## Money Handling

All monetary values use **cents (integers)** internally to avoid floating-point issues:
- Input: `150.00` (BRL)
- Internal: `15000` (cents)
- Output: `150.00` (formatted)

Use `toCents()` and `fromCents()` from `utils/formatting.ts` for conversions.

## Date Handling

Dates use ISO 8601 format:
- Date only: `YYYY-MM-DD` (due dates, creation dates)
- DateTime: `YYYY-MM-DDTHH:mm:ss` (timestamps, webhook events)
- All dates in UTC unless specified

## Limitations

- Webhook event receiving requires a separate HTTP server (not included)
- Maximum 10 webhooks per Asaas account
- Sandbox has some feature limitations (foreign customers, etc.)
- Rate limits: 100 req/s (sandbox), higher in production

## License

MIT
