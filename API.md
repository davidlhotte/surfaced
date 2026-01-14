# API Documentation - LocateUs

## Authentication

All admin API endpoints require Shopify session authentication.
Public storefront endpoints use shop domain identification.

---

## Admin API Endpoints

### Stores

#### List Stores
```http
GET /api/stores?page=1&limit=20&search=&category=
```

**Response:**
```json
{
  "stores": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

#### Create Store
```http
POST /api/stores
Content-Type: application/json

{
  "name": "Main Store",
  "address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "postalCode": "10001",
  "country": "US",
  "phone": "+1-555-0100",
  "email": "store@example.com",
  "website": "https://example.com",
  "category": "retail",
  "featured": false
}
```

#### Get Store
```http
GET /api/stores/{id}
```

#### Update Store
```http
PUT /api/stores/{id}
Content-Type: application/json

{ ... }
```

#### Delete Store
```http
DELETE /api/stores/{id}
```

---

### CSV Import/Export

#### Import CSV
```http
POST /api/import
Content-Type: multipart/form-data

file: stores.csv
```

**Response:**
```json
{
  "success": true,
  "imported": 45,
  "errors": [
    { "row": 12, "errors": ["Invalid email format"] }
  ]
}
```

#### Download Template
```http
GET /api/import/template
```

#### Export CSV (Plus+ only)
```http
GET /api/export
```

---

### Settings

#### Get Settings
```http
GET /api/settings
```

#### Update Settings
```http
PUT /api/settings
Content-Type: application/json

{
  "mapSizePreset": "RECTANGLE",
  "markerColor": "#FF5733",
  "enableSearch": true,
  "distanceUnit": "MILES"
}
```

---

### Billing

#### Get Current Plan
```http
GET /api/billing
```

#### Create Subscription
```http
POST /api/billing
Content-Type: application/json

{
  "plan": "BASIC"
}
```

**Response:**
```json
{
  "confirmationUrl": "https://admin.shopify.com/..."
}
```

---

## Public Storefront API

### Get Store Data
```http
GET /api/storefront/{shop-domain}?lat=&lng=&search=&category=
```

**Response:**
```json
{
  "stores": [
    {
      "id": "...",
      "name": "Main Store",
      "address": "123 Main St",
      "city": "New York",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "distance": 2.5
    }
  ],
  "settings": {
    "mapSizePreset": "RECTANGLE",
    "markerColor": "#FF5733",
    "enableSearch": true
  },
  "poweredBy": true
}
```

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| Admin API | 1000 req/min |
| Public API | 100 req/min |
| Geocoding | 10 req/sec |

---

## Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Invalid input data |
| `RATE_LIMITED` | Too many requests |
| `UNAUTHORIZED` | Invalid/missing session |
| `FORBIDDEN` | Plan doesn't allow this action |
| `NOT_FOUND` | Resource not found |
| `INTERNAL_ERROR` | Server error |

**Error Response Format:**
```json
{
  "error": "Human readable message",
  "code": "ERROR_CODE",
  "details": { ... }
}
```
