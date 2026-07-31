# AgriPrice GH API

## Auth

### POST `/api/auth/login`
- Auth: No
- Body: `{ "username": "admin", "password": "admin12345" }`
- Response: `{ "success": true, "token": "...", "user": { "id": "...", "role": "superadmin" } }`
- Curl:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin12345"}'
```

## Crops

### GET `/api/crops`
- Auth: No
- Query: `active=true` optional
- Response: `{ "success": true, "data": [Crop] }`

### POST `/api/crops`
- Auth: JWT Bearer
- Body: `{ "name", "localName", "category", "unit", "season", "description", "imageUrl", "isActive" }`
- Response: `{ "success": true, "data": Crop }`

### PUT `/api/crops/:id`
- Auth: JWT Bearer
- Body: same as create
- Response: `{ "success": true, "data": Crop }`

### PUT `/api/crops/:id/image`
- Auth: JWT Bearer
- Body: `multipart/form-data` with `image`
- Response: `{ "success": true, "data": Crop }`

### DELETE `/api/crops/:id`
- Auth: JWT Bearer
- Response: `{ "success": true, "message": "Crop deleted" }`

## Markets

### GET `/api/markets`
- Auth: No
- Query: `active=true` optional
- Response: `{ "success": true, "data": [Market] }`

### POST `/api/markets`
- Auth: JWT Bearer
- Body: `{ "name", "city", "region", "type", "coordinates": { "lat", "lng" }, "contactPhone", "isActive" }`
- Response: `{ "success": true, "data": Market }`

### PUT `/api/markets/:id`
- Auth: JWT Bearer
- Body: same as create
- Response: `{ "success": true, "data": Market }`

### DELETE `/api/markets/:id`
- Auth: JWT Bearer
- Response: `{ "success": true, "message": "Market deleted" }`

## Prices

### GET `/api/prices`
- Auth: No
- Response: latest price documents per crop-market pair

### GET `/api/prices/latest`
- Auth: No
- Response: sorted latest price table

### GET `/api/prices/compare?crop=Maize`
- Auth: No
- Response: `{ "success": true, "crop": Crop, "data": [Price] }`

### GET `/api/prices/trends/:cropId`
- Auth: No
- Response: `{ "success": true, "crop": Crop, "data": [{ "week", "averagePrice" }] }`

### GET `/api/prices/history`
- Auth: JWT Bearer
- Response: full populated history

### POST `/api/prices`
- Auth: JWT Bearer
- Body: `{ "cropId", "marketId", "price", "dateRecorded?", "source?", "notes?" }`
- Response: `{ "success": true, "data": Price }`

### POST `/api/prices/bulk`
- Auth: JWT Bearer
- Body: `{ "cropId", "prices": [{ "marketId", "price" }], "dateRecorded?", "source?" }`
- Response: `{ "success": true, "data": [Price] }`

### PUT `/api/prices/:id`
- Auth: JWT Bearer
- Body: partial price fields
- Response: `{ "success": true, "data": Price }`

### DELETE `/api/prices/:id`
- Auth: JWT Bearer
- Response: `{ "success": true, "message": "Price deleted" }`

## Admin

### GET `/api/admin/stats`
- Auth: JWT Bearer
- Response: `{ "success": true, "data": { "totalCrops", "totalMarkets", "pricesUpdatedToday", "smsQueries24h", "ussdSessions24h", "recentActivity": [] } }`

## Users

### GET `/api/users`
- Auth: JWT Bearer superadmin
- Response: `{ "success": true, "data": [User] }`

### POST `/api/users`
- Auth: JWT Bearer superadmin
- Body: `{ "username", "password", "role", "phoneNumber", "verified" }`
- Response: `{ "success": true, "data": User }`

### PUT `/api/users/:id`
- Auth: JWT Bearer superadmin
- Body: same as create, fields optional
- Response: `{ "success": true, "data": User }`

### DELETE `/api/users/:id`
- Auth: JWT Bearer superadmin
- Response: `{ "success": true, "message": "User deleted" }`

## SMS

### POST `/api/sms/incoming`
- Auth: No
- Body: `{ "text": "PRICE MAIZE ACCRA", "phoneNumber": "+233..." }`
- Response: `{ "success": true, "message": "..." }`

## USSD

### POST `/api/ussd/session`
- Auth: No
- Body: `{ "sessionId": "...", "phoneNumber": "+233...", "text": "1*2*3" }`
- Response: plain text `CON ...` or `END ...`
