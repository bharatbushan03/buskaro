# BusKaro Pickup System Documentation

## Overview

The Pickup System is an Uber-style dynamic pickup request feature that allows students to request bus pickups at custom locations. Drivers can view nearby requests and accept/comple them in real-time.

## Core Concepts

- **Pickup Request**: A student's request for bus pickup at a specific GPS location
- **Active Pin**: A pickup request that is PENDING or ACCEPTED and not expired
- **Expiry**: Pickups automatically expire after 30 minutes
- **Nearby Search**: Drivers see pickups within a configurable radius (default: 5km)

## Architecture

```
Student App          Server               Driver App          Database
    |                  |                      |                    |
    |--pin-location--->|                      |                    |
    |                  |--create pickup------->|                    |
    |                  |                      |--broadcast new---->|
    |                  |                      |                    |
    |                  |<--nearby pickups----|                    |
    |                  |                      |--query geo-------->|
    |                  |                      |                    |
    |                  |<--accept pickup------|                    |
    |<--confirmed------|                      |                    |
    |                  |                      |                    |
    |                  |<--complete pickup----|                    |
    |<--completed-------|                      |                    |
```

## Database Schema

### PickupRequest Model

```prisma
model PickupRequest {
  id              String    @id @default(uuid())
  studentId       String    // Foreign key to Student
  
  // Location
  latitude        Float
  longitude       Float
  address         String?   // Optional human-readable address
  accuracy        Float?    // GPS accuracy in meters
  
  // Status
  status          PickupRequestStatus @default(PENDING)
  
  // Assignment (set when driver accepts)
  driverId        String?   // Foreign key to Driver
  busId           String?   // Foreign key to Bus
  
  // Timing
  requestedAt     DateTime  @default(now())
  expiresAt       DateTime  // 30 minutes from requestedAt
  completedAt     DateTime? // Set when status becomes COMPLETED
  
  // Metadata
  notes           String?   // Student's message to driver
  priority        Int       @default(0) // For future prioritization
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

enum PickupRequestStatus {
  PENDING     // Waiting for driver
  ACCEPTED    // Driver assigned
  COMPLETED   // Pickup done
  EXPIRED     // Auto-expired after 30 min
  CANCELLED   // Student cancelled
}
```

## API Endpoints

### Student Endpoints

#### POST /api/students/pin-location
Create a new pickup request.

**Request:**
```json
{
  "latitude": 28.6139,
  "longitude": 77.2090,
  "address": "Near Central Park Gate 3",
  "accuracy": 10.5,
  "notes": "I am wearing a red jacket"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "pickup": {
      "id": "uuid",
      "studentId": "uuid",
      "latitude": 28.6139,
      "longitude": 77.2090,
      "status": "PENDING",
      "expiresAt": "2024-01-15T11:00:00Z"
    },
    "expiresAt": "2024-01-15T11:00:00Z",
    "message": "Pickup request created successfully"
  }
}
```

**Rules:**
- Only one active pin per student
- Max 5 pins per hour (rate limiting)
- Valid GPS coordinates required (-90 to 90, -180 to 180)

#### GET /api/students/my-pin
Get student's current active pickup.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "PENDING",
    "latitude": 28.6139,
    "longitude": 77.2090,
    "expiresAt": "2024-01-15T11:00:00Z"
  }
}
```

#### DELETE /api/students/cancel-pin/:id
Cancel an active pickup.

**Response:**
```json
{
  "success": true,
  "message": "Pickup request cancelled successfully"
}
```

### Driver Endpoints

#### GET /api/drivers/pickups
Get nearby pending pickups.

**Query Parameters:**
- `latitude` (required): Driver's current latitude
- `longitude` (required): Driver's current longitude
- `radiusKm` (optional): Search radius in km (default: 5)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "studentId": "uuid",
      "latitude": 28.6139,
      "longitude": 77.2090,
      "address": "Near Central Park",
      "distanceKm": 2.3,
      "notes": "I am wearing a red jacket",
      "requestedAt": "2024-01-15T10:30:00Z",
      "expiresAt": "2024-01-15T11:00:00Z"
    }
  ],
  "count": 1
}
```

**Distance Calculation:**
Uses Haversine formula for accurate spherical distance:
```sql
6371 * acos(
  cos(radians(:lat)) * cos(radians(latitude)) *
  cos(radians(longitude) - radians(:lng)) +
  sin(radians(:lat)) * sin(radians(latitude))
)
```

#### PATCH /api/drivers/pickup/:id/accept
Accept a pickup request.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "ACCEPTED",
    "driverId": "uuid",
    "busId": "uuid"
  },
  "message": "Pickup accepted successfully"
}
```

#### PATCH /api/drivers/pickup/:id/complete
Mark pickup as completed.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "COMPLETED",
    "completedAt": "2024-01-15T10:45:00Z"
  },
  "message": "Pickup completed successfully"
}
```

### Admin Endpoints

#### GET /api/pickups/stats
Get pickup system statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 150,
    "pending": 12,
    "accepted": 8,
    "completed": 120,
    "expired": 8,
    "cancelled": 2
  }
}
```

## Socket.IO Events

### Student Events (Client → Server)

#### student:pin-location
Create pickup via socket (alternative to REST).

```javascript
socket.emit('student:pin-location', {
  latitude: 28.6139,
  longitude: 77.2090,
  address: 'Near Central Park',
  notes: 'I am wearing red'
}, (response) => {
  if (response.success) {
    console.log('Pickup created:', response.data);
  } else {
    console.error('Error:', response.error);
  }
});
```

#### student:cancel-pin
Cancel pickup via socket.

```javascript
socket.emit('student:cancel-pin', {
  pickupId: 'uuid'
}, (response) => {
  // Handle response
});
```

### Driver Events (Client → Server)

#### driver:pickup-complete
Mark pickup complete via socket.

```javascript
socket.emit('driver:pickup-complete', {
  pickupId: 'uuid'
}, (response) => {
  // Handle response
});
```

### Server Broadcast Events (Server → Clients)

#### pickup:new-request
Broadcast to all drivers when new pickup created.

```javascript
socket.on('pickup:new-request', (data) => {
  console.log('New pickup:', data);
  // data: { id, studentId, latitude, longitude, address, notes, requestedAt, expiresAt }
});
```

#### pickup:confirmed
Sent to student when driver accepts.

```javascript
socket.on('pickup:confirmed', (data) => {
  console.log('Pickup confirmed:', data);
  // data: { pickupId, driverId, busId, status }
});
```

#### pickup:completed
Sent to student when driver completes.

```javascript
socket.on('pickup:completed', (data) => {
  console.log('Pickup completed:', data);
  // data: { pickupId, completedAt }
});
```

#### pickup:expired
Sent to student when pickup expires.

```javascript
socket.on('pickup:expired', (data) => {
  console.log('Pickup expired:', data);
  // data: { pickupId, expiredAt }
});
```

#### pickup:removed
Sent to all drivers when pickup is no longer available.

```javascript
socket.on('pickup:removed', (data) => {
  console.log('Pickup removed:', data);
  // data: { pickupId }
});
```

## Auto-Expiry System

### Background Job
- Runs every minute via node-cron
- Expires pickups where `expiresAt <= NOW()`
- Emits `pickup:expired` to affected students
- Emits `pickup:removed` to all drivers

### Configuration
```typescript
const PICKUP_EXPIRY_MINUTES = 30;
const CRON_SCHEDULE = '*/1 * * * *'; // Every minute
```

### Starting the Job
```typescript
import { startPickupExpiryJob } from './jobs/pickup-expiry.job';

// Start on server boot
startPickupExpiryJob();
```

## Rate Limiting

### Student Pin Creation
- Max 5 pins per hour per student
- Uses Redis for distributed rate limiting
- Key: `pickup:rate:{studentId}`

```typescript
const rateKey = `pickup:rate:${studentId}`;
const currentCount = await redis.get(rateKey);
if (currentCount && parseInt(currentCount) >= 5) {
  throw new Error('Rate limit exceeded');
}
await redis.incr(rateKey);
await redis.expire(rateKey, 3600); // 1 hour window
```

## Geo Query Examples

### Find Nearby Pickups (Haversine Formula)
```sql
SELECT 
  pr.*,
  (6371 * acos(
    cos(radians(:lat)) * cos(radians(pr.latitude)) *
    cos(radians(pr.longitude) - radians(:lng)) +
    sin(radians(:lat)) * sin(radians(pr.latitude))
  )) AS "distanceKm"
FROM pickup_requests pr
WHERE pr.status = 'PENDING'
  AND pr.expires_at > NOW()
  AND (6371 * acos(
    cos(radians(:lat)) * cos(radians(pr.latitude)) *
    cos(radians(pr.longitude) - radians(:lng)) +
    sin(radians(:lat)) * sin(radians(pr.latitude))
  )) <= 5  -- 5km radius
ORDER BY "distanceKm" ASC
LIMIT 50;
```

### With PostGIS (Future Enhancement)
```sql
-- If using PostGIS extension
SELECT 
  pr.*,
  ST_Distance(
    ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
    ST_SetSRID(ST_MakePoint(pr.longitude, pr.latitude), 4326)::geography
  ) / 1000 AS distance_km
FROM pickup_requests pr
WHERE pr.status = 'PENDING'
  AND pr.expires_at > NOW()
  AND ST_DWithin(
    ST_SetSRID(ST_MakePoint(pr.longitude, pr.latitude), 4326)::geography,
    ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
    5000  -- 5km in meters
  )
ORDER BY distance_km ASC;
```

## File Structure

```
src/
├── modules/
│   └── pickups/
│       ├── pickup.controller.ts    # HTTP request handlers
│       ├── pickup.service.ts       # Business logic
│       ├── pickup.repository.ts    # Database operations
│       └── pickup.routes.ts        # Route definitions
├── sockets/
│   ├── handlers/
│   │   └── pickup.handler.ts       # Socket event handlers
│   ├── events.ts                   # Event constants
│   └── index.ts                    # Socket server setup
├── jobs/
│   └── pickup-expiry.job.ts        # Background expiry job
└── docs/
    └── PICKUP_SYSTEM.md            # This documentation
```

## Usage Examples

### Student Creating Pickup
```javascript
// Using REST API
const response = await fetch('/api/students/pin-location', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    latitude: 28.6139,
    longitude: 77.2090,
    notes: 'I am near the main gate'
  })
});

// Using Socket.IO
socket.emit('student:pin-location', {
  latitude: 28.6139,
  longitude: 77.2090,
  notes: 'I am near the main gate'
}, (response) => {
  if (response.success) {
    console.log('Pickup created:', response.data.pickup.id);
  }
});
```

### Driver Viewing Nearby Pickups
```javascript
// REST API
const response = await fetch(
  `/api/drivers/pickups?latitude=${lat}&longitude=${lng}&radiusKm=5`,
  {
    headers: { 'Authorization': `Bearer ${token}` }
  }
);
const { data } = await response.json();

// Display on map
for (const pickup of data) {
  addMarker({
    lat: pickup.latitude,
    lng: pickup.longitude,
    distance: pickup.distanceKm,
    student: pickup.student
  });
}
```

### Real-time Updates
```javascript
// Driver listening for new pickups
socket.on('pickup:new-request', (pickup) => {
  // Check if within driver's route
  const distance = calculateDistance(driverLocation, pickup);
  if (distance <= 5) {
    showNotification(`New pickup ${distance.toFixed(1)}km away`);
    addMarkerToMap(pickup);
  }
});

// Student waiting for confirmation
socket.on('pickup:confirmed', (data) => {
  showNotification('Driver is on the way!');
  displayDriverInfo(data.driverId, data.busId);
});
```

## Testing

### Create Test Pickup
```bash
curl -X POST http://localhost:3000/api/students/pin-location \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <student_token>" \
  -d '{
    "latitude": 28.6139,
    "longitude": 77.2090,
    "address": "Test Location",
    "notes": "Test pickup"
  }'
```

### Get Nearby Pickups
```bash
curl "http://localhost:3000/api/drivers/pickups?latitude=28.61&longitude=77.20" \
  -H "Authorization: Bearer <driver_token>"
```

### Accept Pickup
```bash
curl -X PATCH http://localhost:3000/api/drivers/pickup/<id>/accept \
  -H "Authorization: Bearer <driver_token>"
```

## Future Enhancements

1. **DBSCAN Clustering**: Group nearby pickups for batch collection
2. **ETA Prediction**: ML-based arrival time estimation
3. **Route Optimization**: Suggest optimal pickup sequences
4. **Push Notifications**: Firebase/OneSignal integration
5. **Heatmap**: Visualize pickup density areas
6. **Driver Assignment**: Auto-assign based on proximity and capacity

## Error Handling

### Common Errors

#### Rate Limit Exceeded
```json
{
  "success": false,
  "error": {
    "message": "Rate limit exceeded: Maximum 5 pickup requests per hour",
    "code": "RATE_LIMIT_EXCEEDED"
  }
}
```

#### Invalid Coordinates
```json
{
  "success": false,
  "error": {
    "message": "Invalid GPS coordinates",
    "code": "VALIDATION_ERROR"
  }
}
```

#### Active Pickup Exists
```json
{
  "success": false,
  "error": {
    "message": "You already have an active pickup request. Cancel it first.",
    "code": "CONFLICT"
  }
}
```

#### Pickup Not Found
```json
{
  "success": false,
  "error": {
    "message": "Pickup request not found",
    "code": "NOT_FOUND"
  }
}
```

## Performance Considerations

1. **Geo Index**: Add index on (latitude, longitude) for faster queries
2. **Pagination**: Limit nearby results to 50 per request
3. **Caching**: Cache active pickups in Redis for faster reads
4. **WebSocket Rooms**: Use room-based broadcasts instead of global emits
5. **Database Cleanup**: Archive completed/expired pickups periodically

## Monitoring

Key metrics to track:
- Average time from request to acceptance
- Pickup completion rate
- Expiry rate (should be low)
- Average distance between driver and pickup
- Peak request times
