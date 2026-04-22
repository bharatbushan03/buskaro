# BusKaro Database Architecture

## Overview

This document describes the production-ready database architecture for the BusKaro college bus tracking system.

## Technology Stack

- **Database**: PostgreSQL 14+
- **ORM**: Prisma 5.x
- **Geospatial**: Custom Float-based coordinates (PostGIS optional for advanced features)
- **Cache**: Redis 6.x

## Schema Design

### Core Entities

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    User     │────▶│   Student   │◀────│    Bus      │
│  (Auth)     │     │  (Profile)  │     │  (Fleet)    │
└─────────────┘     └─────────────┘     └─────────────┘
       │                    │                  │
       │                    │                  │
       ▼                    ▼                  ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Driver    │◀────│    Route    │────▶│ PickupPoint │
│  (Profile)  │     │   (Path)    │     │   (Stops)   │
└─────────────┘     └─────────────┘     └─────────────┘
       │                    │                  │
       └────────────────────┴──────────────────┘
                            │
                            ▼
                    ┌─────────────┐
                    │  Attendance │
                    │  (Records)  │
                    └─────────────┘
```

## Models

### 1. User (Base Authentication)
```typescript
model User {
  id, email, passwordHash, role, status
  Relations: student?, driver?, admin?
}
```
- Central authentication entity
- One-to-one with role-specific profiles
- Supports soft delete via status

### 2. Student Profile
```typescript
model Student {
  userId, studentId (college ID), name, department
  busId?, routeId?, pickupPointId?
  parentName?, parentPhone?
}
```
- Linked to User via `userId`
- Optional bus, route, pickup assignments
- Parent contact for emergencies

### 3. Driver Profile
```typescript
model Driver {
  userId, name, licenseNumber, licenseExpiry
  isOnDuty, bus? (via AssignedBus relation)
}
```
- License tracking with expiry alerts
- Real-time duty status
- One-to-one bus assignment

### 4. Bus (Fleet Management)
```typescript
model Bus {
  registrationNumber, model, capacity, status
  currentDriverId?, currentRouteId?
  currentLat?, currentLng?, lastLocationAt?
}
```
- Current location cached for real-time tracking
- Status: ACTIVE, INACTIVE, MAINTENANCE, RETIRED

### 5. Route with GeoJSON Path
```typescript
model Route {
  name, routeNumber, pathGeoJson?
  totalDistance, estimatedDuration
  pickupPoints[], buses[]
}
```
- GeoJSON LineString for route visualization
- Estimated duration for ETAs

### 6. Location History
```typescript
model LocationHistory {
  busId, latitude, longitude
  accuracy?, heading?, speed?, altitude?
  recordedAt
}
```
- Time-series location tracking
- Indexes for fast queries by bus + time

### 7. Pickup Point
```typescript
model PickupPoint {
  routeId, name, latitude, longitude
  sequenceOrder, arrivalTime
}
```
- Ordered stops on a route
- Scheduled arrival times

### 8. Pickup PIN
```typescript
model PickupPin {
  pickupPointId, code (unique), status
  latitude, longitude, expiresAt?
  studentId? (optional assignment)
}
```
- Geofenced attendance verification
- Time-limited validity

### 9. Attendance
```typescript
model Attendance {
  studentId, busId, routeId, date
  status (PRESENT/ABSENT/LATE/EXCUSED)
  boardingTime?, alightingTime?
  verifiedByPin, verifiedByNfc, verifiedByQr
  locationLat?, locationLng?
}
```
- Daily attendance records
- Multiple verification methods
- Location proof

### 10. Payment with Razorpay
```typescript
model Payment {
  studentId, amount, status
  razorpayOrderId?, razorpayPaymentId?, razorpaySignature?
  receiptNumber?, invoiceUrl?
}
```
- Full Razorpay integration
- Receipt and invoice tracking

### 11. Notification
```typescript
model Notification {
  userId, type, title, body
  channel (PUSH/SMS/EMAIL/IN_APP)
  status, sentAt?, deliveredAt?, readAt?
}
```
- Multi-channel notification system
- Delivery tracking

### 12. Audit Log
```typescript
model AuditLog {
  action, entityType, entityId
  userId?, oldValues?, newValues?
  ipAddress?, userAgent?, requestId?
  latitude?, longitude?
}
```
- Complete audit trail
- GDPR/privacy compliance
- Geolocation context

## Geospatial Implementation

### Without PostGIS (Current)

Uses Float fields for latitude/longitude:

```prisma
model Bus {
  currentLat  Float?
  currentLng  Float?
}
```

**Benefits:**
- Works with any PostgreSQL installation
- Simple to understand and query
- Sufficient for most use cases

**Distance Query (Application Layer):**
```typescript
// Two-phase query for efficiency
const bounds = calculateBoundingBox(center, radiusKm);
const buses = await prisma.bus.findMany({
  where: {
    currentLat: { gte: bounds.minLat, lte: bounds.maxLat },
    currentLng: { gte: bounds.minLng, lte: bounds.maxLng }
  }
});
// Filter by precise Haversine distance
const nearby = buses.filter(b => 
  calculateDistance(center, {lat: b.currentLat, lng: b.currentLng}) <= radiusKm
);
```

### With PostGIS (Optional Upgrade)

```prisma
datasource db {
  extensions = [postgis(version: "3.3.2")]
}

model LocationHistory {
  coordinates  Unsupported("geometry(Point, 4326)")
  @@index([coordinates], type: Gist)
}
```

**Benefits:**
- Native spatial queries
- Geofencing with `ST_Contains`
- K-nearest neighbor queries
- Spatial joins

## Indexing Strategy

### Location Indexes
```prisma
@@index([latitude, longitude])
@@index([currentLat, currentLng])
@@index([busId, recordedAt])  // Time-series queries
```

### Foreign Key Indexes
```prisma
@@index([userId])
@@index([studentId])
@@index([busId])
@@index([routeId])
```

### Composite Indexes
```prisma
@@index([studentId, date])  // Attendance lookups
@@index([userId, createdAt]) // Notification history
@@index([entityType, entityId]) // Audit log queries
```

## Data Retention

### Location History
- Keep 90 days of high-frequency data
- Archive to cold storage after 90 days
- Aggregate to hourly for historical analytics

### Audit Logs
- Retain for 1 year
- Export before deletion for compliance

### Notifications
- Delete read notifications after 30 days
- Keep unread indefinitely

## Performance Optimization

### Query Patterns

**Nearby Buses (Most Frequent):**
```sql
-- Bounding box filter first
SELECT * FROM buses 
WHERE current_lat BETWEEN $1 AND $2 
  AND current_lng BETWEEN $3 AND $4
  AND status = 'ACTIVE';
-- Then filter by precise distance in app layer
```

**Student Attendance:**
```sql
SELECT * FROM attendances 
WHERE student_id = $1 
  AND date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY date DESC;
```

### Caching Strategy

**Redis Keys:**
```
location:{busId} -> Current location (TTL: 5 min)
route:{routeId}:buses -> Active buses on route (TTL: 1 min)
student:{studentId}:attendance:today -> Today's attendance (TTL: 12 hours)
```

## Migrations

### Creating Migrations
```bash
npx prisma migrate dev --name descriptive_name
```

### Production Deployment
```bash
npx prisma migrate deploy
```

### Reset (Development Only)
```bash
npx prisma migrate reset
```

## Seeding

### Sample Data
```bash
npx prisma db seed
```

Creates:
- 1 Admin
- 2 Drivers
- 3 Buses
- 10 Students
- 2 Routes with pickup points

### Custom Seed Script
Edit `prisma/seed.ts` for custom data.

## Monitoring

### Query Performance
Enable Prisma query logging in development:
```typescript
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
```

### Database Metrics
Track:
- Connection pool utilization
- Query duration (p95, p99)
- Table bloat
- Index usage

## Security

### Row-Level Security (RLS)
Enable for multi-tenant scenarios:
```sql
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
CREATE POLICY student_isolation ON students
  USING (auth.uid() = user_id);
```

### Data Encryption
- TLS for connections (required)
- At-rest encryption (AWS RDS/Azure)
- Column-level encryption for PII (optional)

## Backup Strategy

### Automated Backups
- Daily full backups
- Point-in-time recovery (PITR) enabled
- Cross-region replication for disaster recovery

### Manual Backup
```bash
pg_dump -Fc buskaro > backup.dump
```

### Restore
```bash
pg_restore -d buskaro backup.dump
```

## Scaling Considerations

### Read Replicas
- Route read queries to replicas
- Keep writes on primary

### Partitioning
- Partition `location_history` by date
- Partition `audit_logs` by month

### Sharding (Future)
- Shard by `route_id` for multi-region
- Consistent hashing for even distribution

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Geospatial](https://postgis.net/documentation/)
- [Redis Caching Patterns](https://redis.io/docs/manual/patterns/)
