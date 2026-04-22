# BusKaro Authentication & Security Guide

## Overview

This document describes the production-grade authentication and authorization system for BusKaro.

## Authentication Flow

```
┌─────────┐     ┌──────────────┐     ┌─────────────┐     ┌─────────┐
│  Client │────▶│  POST /login │────▶│ Auth Server │────▶│   DB    │
└─────────┘     └──────────────┘     └─────────────┘     └─────────┘
                                              │
                                              ▼
┌─────────┐     ┌──────────────┐     ┌─────────────┐
│  Client │◀────│ Access Token │◀────│   Refresh   │
└─────────┘     └──────────────┘     │    Token    │
                                     └─────────────┘
```

## Token System

### Access Token
- **Expiry**: 15 minutes
- **Storage**: Client-side (memory/localStorage - your choice)
- **Usage**: Sent in `Authorization: Bearer <token>` header
- **Payload**: `{ userId, email, role, type: 'access', iat, exp }`

### Refresh Token
- **Expiry**: 7 days
- **Storage**: HTTP-only cookie or secure storage
- **Usage**: Sent in request body to `/api/v1/auth/refresh`
- **Rotation**: Single-use tokens (rotation on every refresh)
- **Revocation**: Stored in Redis for instant invalidation

### Token Rotation Flow
```
1. Client: POST /refresh with refresh_token_1
2. Server: Verify, revoke refresh_token_1
3. Server: Generate new pair (access_token_2, refresh_token_2)
4. Server: Store refresh_token_2 in Redis
5. Client: Receive new tokens
```

## API Endpoints

### Authentication
| Endpoint | Method | Rate Limit | Description |
|----------|--------|------------|-------------|
| `/api/v1/auth/register` | POST | 3/hr | Register new user |
| `/api/v1/auth/login` | POST | 5/5min | Login user |
| `/api/v1/auth/refresh` | POST | 10/min | Refresh tokens |
| `/api/v1/auth/logout` | POST | - | Logout device |
| `/api/v1/auth/logout-all` | POST | - | Logout all devices |
| `/api/v1/auth/change-password` | POST | - | Change password |
| `/api/v1/auth/me` | GET | - | Get profile |

### Rate Limiting Headers
```http
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 4
X-RateLimit-Window: 300
```

## Password Security

### Requirements
- **Minimum length**: 8 characters
- **Maximum length**: 128 characters
- **Complexity**:
  - At least one uppercase letter (A-Z)
  - At least one lowercase letter (a-z)
  - At least one number (0-9)
  - At least one special character (!@#$%^&* etc.)
- **Restrictions**:
  - No sequential characters (abc, 123)
  - No repeated characters (aaa, 111)
  - Cannot be only letters or only numbers

### Password Hashing
- **Algorithm**: bcrypt
- **Cost factor**: 12 (2^12 iterations)
- **Salt**: Automatically generated per password

### Password Strength Meter
```typescript
calculatePasswordStrength(password: string): number // 0-100

// Score interpretation:
// 0-39: weak
// 40-59: fair
// 60-79: good
// 80-100: strong
```

## RBAC (Role-Based Access Control)

### Roles
| Role | Description |
|------|-------------|
| `ADMIN` | Full system access |
| `DRIVER` | Bus operations, attendance |
| `STUDENT` | Personal data, payments, attendance view |

### Role Permissions

#### ADMIN
All permissions granted.

#### DRIVER
- View buses, routes, students
- Update bus location
- Mark and verify attendance
- Send notifications
- View pickup points

#### STUDENT
- View buses and routes
- View own attendance
- Make payments
- Create pickup PINs
- Receive notifications

### Permission-Based Middleware

```typescript
// Check specific role
router.get('/admin-only', authenticate, requireRole('ADMIN'), handler);

// Check multiple roles
router.get('/staff', authenticate, requireRole('ADMIN', 'DRIVER'), handler);

// Check specific permission
router.post('/mark-attendance', 
  authenticate, 
  requirePermission(Permission.ATTENDANCE_MARK), 
  handler
);

// Check any of multiple permissions
router.get('/reports', 
  authenticate, 
  requireAnyPermission(Permission.ANALYTICS_VIEW, Permission.SYSTEM_ADMIN), 
  handler
);

// Resource ownership check
router.put('/profile/:userId', 
  authenticate, 
  requireOwnershipOrAdmin('userId'), 
  handler
);

// Convenience middleware
router.get('/buses', authenticate, driverOnly, handler);
router.get('/payments', authenticate, adminOnly, handler);
```

## Security Headers

Applied by Helmet middleware:

| Header | Value | Purpose |
|--------|-------|---------|
| `Content-Security-Policy` | default-src 'self' | XSS prevention |
| `X-Frame-Options` | DENY | Clickjacking prevention |
| `X-Content-Type-Options` | nosniff | MIME sniffing prevention |
| `Strict-Transport-Security` | max-age=31536000 | HTTPS enforcement |
| `X-XSS-Protection` | 0 | Legacy XSS (disabled for CSP) |
| `Referrer-Policy` | strict-origin-when-cross-origin | Privacy |
| `Permissions-Policy` | geolocation=(), microphone=() | Feature restriction |

## Rate Limiting

### Fixed Window Algorithm
- Simple counter per time window
- Resets at window boundary
- May allow burst at window edge

### Sliding Window Algorithm
- More accurate counting
- Continuous window sliding
- Better burst prevention
- Higher Redis overhead

### Presets
```typescript
// Auth endpoints
login: 5 attempts / 5 minutes per email/IP
register: 3 attempts / hour per IP
refresh: 10 attempts / minute

// General API
general: 100 requests / minute

// Real-time
location: 60 updates / minute (1/sec)
```

## Error Handling

### Authentication Errors
```json
{
  "success": false,
  "error": {
    "message": "Invalid credentials",
    "code": "AUTH_INVALID_CREDENTIALS",
    "status": 401
  }
}
```

### Authorization Errors
```json
{
  "success": false,
  "error": {
    "message": "Access denied. Required role(s): ADMIN",
    "code": "AUTH_INSUFFICIENT_PERMISSIONS",
    "status": 403
  }
}
```

### Rate Limit Errors
```json
{
  "success": false,
  "error": {
    "message": "Too many login attempts. Please wait 5 minutes.",
    "code": "RATE_LIMIT_EXCEEDED",
    "retryAfter": 300,
    "status": 429
  }
}
```

## Session Management

### Redis Storage
```
Key: refresh_token:<token_id>
Value: { userId, email, role, createdAt }
TTL: 7 days (604800 seconds)
```

### Logout Scenarios

#### Single Device Logout
1. Client sends refresh token
2. Server deletes token from Redis
3. Access token expires naturally (15 min)

#### All Devices Logout
1. Delete all refresh tokens for user
2. Optional: Add user to blocklist
3. All tokens invalidated immediately

### Security Events
- Failed login attempts (log for monitoring)
- Token rotation events
- Password changes
- Role/permission changes

## CORS Configuration

```typescript
{
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  maxAge: 86400 // 24 hours
}
```

## Input Validation

### Email Validation
- Valid email format
- Domain validation (optional)
- Normalization (lowercase, trim)

### Password Validation
- Strength requirements (see above)
- No common passwords
- Check against breach databases (optional)

### Sanitization
- XSS prevention via express-validator
- NoSQL injection prevention
- Trim whitespace from strings

## Audit Logging

### Events Logged
- User login/logout
- Failed authentication attempts
- Password changes
- Token refresh
- Permission changes
- Role assignments

### Log Format
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "info",
  "event": "USER_LOGIN",
  "userId": "uuid",
  "email": "user@example.com",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "requestId": "uuid"
}
```

## Security Checklist

- [ ] JWT secrets are strong (min 32 chars)
- [ ] HTTPS only in production
- [ ] Rate limiting enabled
- [ ] Helmet security headers applied
- [ ] CORS properly configured
- [ ] Input validation on all endpoints
- [ ] Password hashing with bcrypt
- [ ] Refresh token rotation enabled
- [ ] Redis for token storage
- [ ] Audit logging configured
- [ ] Role-based access control
- [ ] Error messages don't leak info
- [ ] Rate limit headers exposed
- [ ] Session timeout configured
- [ ] Secure cookie settings (if using cookies)

## Testing

### Authentication Tests
```bash
# Test login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@buskaro.com","password":"admin123"}'

# Test with token
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer <access_token>"

# Test refresh
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refresh_token>"}'
```

### Rate Limiting Test
```bash
# Should fail after 5 attempts
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done
```

## Best Practices

### Client-Side
1. Store access token in memory (not localStorage for SPAs)
2. Implement token refresh interceptor
3. Handle 401 errors by refreshing token
4. Clear tokens on logout
5. Use HTTPS only

### Server-Side
1. Always validate tokens before processing
2. Use parameterized queries (Prisma does this)
3. Sanitize all inputs
4. Log security events
5. Monitor failed attempts
6. Implement account lockout (optional)
7. Regular security audits

## Troubleshooting

### Token Validation Failures
- Check JWT_SECRET in .env
- Verify token hasn't expired
- Ensure token format is correct

### Rate Limit Issues
- Check Redis connection
- Verify rate limit key generation
- Review X-RateLimit headers

### CORS Errors
- Verify CORS_ORIGIN in .env
- Check preflight request handling
- Ensure credentials header is set

## Additional Resources

- [JWT Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-jwt-bcp-05)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
