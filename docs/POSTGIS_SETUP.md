# PostGIS Setup Guide for BusKaro

This guide explains how to enable advanced geospatial features using PostGIS.

## Overview

PostGIS is a spatial database extender for PostgreSQL. It adds support for geographic objects, allowing location queries to be run in SQL.

**Current State:** BusKaro uses Float fields for coordinates (works without PostGIS)
**Optional Upgrade:** PostGIS enables advanced spatial queries and indexing

## Installation

### Docker (Recommended for Development)

```bash
docker run -d \
  --name buskaro-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=yourpassword \
  -e POSTGRES_DB=buskaro \
  -p 5432:5432 \
  postgis/postgis:15-3.3
```

### Ubuntu/Debian

```bash
# Install PostgreSQL
sudo apt-get update
sudo apt-get install postgresql-14

# Install PostGIS
sudo apt-get install postgresql-14-postgis-3

# Enable extension
sudo -u postgres psql -d buskaro -c "CREATE EXTENSION postgis;"
```

### macOS (Homebrew)

```bash
brew install postgis
brew services start postgresql

# Enable extension
psql -d buskaro -c "CREATE EXTENSION postgis;"
```

### Windows

1. Download PostgreSQL installer from EnterpriseDB
2. During installation, check "PostGIS" in the components
3. Use Stack Builder to install PostGIS after PostgreSQL setup

## Verification

Check if PostGIS is installed:

```sql
SELECT PostGIS_Version();
-- Should return: 3.3 USE_GEOS=1 USE_PROJ=1 USE_STATS=1
```

Check if extension is enabled:

```sql
SELECT * FROM pg_extension WHERE extname = 'postgis';
```

## Schema Migration to PostGIS

### Step 1: Backup Data

```bash
pg_dump -Fc buskaro > buskaro_backup.dump
```

### Step 2: Update Schema

Modify `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  extensions = [postgis(version: "3.3.2")]
}

// Update LocationHistory model
model LocationHistory {
  id            String    @id @default(uuid()) @db.Uuid
  busId         String    @map("bus_id") @db.Uuid
  
  // PostGIS geometry (with spatial index)
  coordinates   Unsupported("geometry(Point, 4326)")  @map("coordinates")
  
  // Keep raw values for compatibility
  latitude      Float
  longitude     Float
  
  // Metadata
  accuracy      Float?
  heading       Float?
  speed         Float?
  altitude      Float?
  recordedAt    DateTime  @default(now()) @map("recorded_at")
  
  bus           Bus       @relation(fields: [busId], references: [id], onDelete: Cascade)
  
  @@index([coordinates], type: Gist)  // Spatial index
  @@index([busId, recordedAt])
  @@map("location_history")
}
```

### Step 3: Migration Commands

```bash
# Generate migration
npx prisma migrate dev --name add_postgis

# Apply to production
npx prisma migrate deploy

# Regenerate client
npx prisma generate
```

### Step 4: Migrate Existing Data

```sql
-- Convert existing Float data to geometry
UPDATE location_history 
SET coordinates = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
WHERE coordinates IS NULL;

-- Update Bus current location
ALTER TABLE buses ADD COLUMN current_location geometry(Point, 4326);

UPDATE buses 
SET current_location = ST_SetSRID(ST_MakePoint(current_lng, current_lat), 4326)
WHERE current_lat IS NOT NULL AND current_lng IS NOT NULL;
```

## Geospatial Queries with PostGIS

### 1. Find Buses Within Radius (Native SQL)

```sql
SELECT b.*, 
  ST_Distance(
    b.current_location::geography,
    ST_SetSRID(ST_MakePoint(77.5946, 12.9716), 4326)::geography
  ) / 1000 AS distance_km
FROM buses b
WHERE ST_DWithin(
  b.current_location::geography,
  ST_SetSRID(ST_MakePoint(77.5946, 12.9716), 4326)::geography,
  5000  -- 5km in meters
)
AND b.status = 'ACTIVE';
```

### 2. Find Nearest Bus (KNN Query)

```sql
SELECT b.*,
  ST_Distance(
    b.current_location::geography,
    ST_SetSRID(ST_MakePoint(77.5946, 12.9716), 4326)::geography
  ) AS distance_meters
FROM buses b
WHERE b.status = 'ACTIVE'
ORDER BY b.current_location <-> ST_SetSRID(ST_MakePoint(77.5946, 12.9716), 4326)
LIMIT 1;
```

### 3. Route Intersection

```sql
-- Check if bus route passes through a geofence
SELECT r.name, 
  ST_Intersects(
    r.path_geometry,
    ST_Buffer(
      ST_SetSRID(ST_MakePoint(77.5946, 12.9716), 4326)::geography,
      1000  -- 1km buffer
    )::geometry
  ) AS passes_through
FROM routes r
WHERE r.id = 'route-uuid';
```

### 4. Geofencing - Check if Point is Inside Area

```sql
-- Define campus boundary (polygon)
WITH campus AS (
  SELECT ST_SetSRID(ST_GeomFromText(
    'POLYGON((77.59 12.97, 77.60 12.97, 77.60 12.98, 77.59 12.98, 77.59 12.97))'
  ), 4326) AS boundary
)
SELECT b.registration_number,
  ST_Contains(c.boundary, b.current_location) AS is_inside_campus
FROM buses b, campus c
WHERE b.id = 'bus-uuid';
```

## Prisma with Raw PostGIS Queries

### Repository Pattern

```typescript
// src/repositories/geo.repository.ts
export class GeoRepository {
  async findNearbyBusesWithPostGIS(
    location: GeoPoint,
    radiusKm: number
  ): Promise<Bus[]> {
    const result = await prisma.$queryRaw<Bus[]>`
      SELECT b.*, 
        ST_Distance(
          b.current_location::geography,
          ST_SetSRID(ST_MakePoint(${location.longitude}, ${location.latitude}), 4326)::geography
        ) / 1000 AS distance_km
      FROM buses b
      WHERE ST_DWithin(
        b.current_location::geography,
        ST_SetSRID(ST_MakePoint(${location.longitude}, ${location.latitude}), 4326)::geography,
        ${radiusKm * 1000}
      )
      AND b.status = 'ACTIVE'
      ORDER BY distance_km;
    `;
    return result;
  }
}
```

## Performance Comparison

### Without PostGIS (Current)
- **Pros:** Simple, works everywhere, easy to understand
- **Cons:** Distance calculation in application layer, no spatial indexes
- **Query Time:** ~50-100ms for nearby buses

### With PostGIS
- **Pros:** Native spatial queries, GiST indexes, complex geospatial operations
- **Cons:** Requires PostGIS extension, steeper learning curve
- **Query Time:** ~10-20ms for nearby buses (with spatial index)

## When to Use PostGIS

**Use Current Float Approach When:**
- Simple point-in-radius queries
- Small to medium dataset (< 1M location records)
- Team not familiar with spatial databases
- Hosting doesn't support PostGIS (some managed DBs)

**Upgrade to PostGIS When:**
- Complex spatial queries needed (geofencing, route intersection)
- Large dataset (> 1M location records)
- Need K-nearest neighbor queries
- Multi-region geospatial analysis
- Advanced mapping features

## Migration Checklist

- [ ] Backup existing database
- [ ] Install PostGIS on target database
- [ ] Update Prisma schema with extensions
- [ ] Create migration for geometry columns
- [ ] Migrate existing Float data to geometry
- [ ] Add spatial indexes (GiST)
- [ ] Update application queries
- [ ] Test all geospatial features
- [ ] Monitor query performance
- [ ] Update documentation

## Troubleshooting

### Extension Not Found
```sql
-- Check available extensions
SELECT * FROM pg_available_extensions WHERE name LIKE 'postgis%';

-- Install if missing
CREATE EXTENSION postgis;
```

### Geometry Errors
```sql
-- Check SRID of existing data
SELECT ST_SRID(coordinates) FROM location_history LIMIT 1;

-- Transform to correct SRID if needed
UPDATE location_history 
SET coordinates = ST_Transform(coordinates, 4326)
WHERE ST_SRID(coordinates) != 4326;
```

### Index Not Being Used
```sql
-- Check if GiST index exists
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'location_history';

-- Force analyze
ANALYZE location_history;
```

## Additional Resources

- [PostGIS Official Documentation](https://postgis.net/documentation/)
- [PostGIS Cheat Sheet](https://postgis.net/workshops/postgis-intro/
- [Prisma Raw Queries](https://www.prisma.io/docs/concepts/components/prisma-client/raw-database-access)
- [Spatial Indexing in PostgreSQL](https://www.postgresql.org/docs/current/indexes-types.html)

## Support

For issues with PostGIS migration, check:
1. Prisma documentation on PostgreSQL extensions
2. PostGIS version compatibility
3. Database user permissions for creating extensions
