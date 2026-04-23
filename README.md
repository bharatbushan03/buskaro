# BusKaro Backend

AI-powered college bus tracking system - Production-ready backend API.

## Architecture

This project follows a **layered architecture** pattern:

```
Controller → Service → Repository → Database
```

### Key Design Principles

1. **Modularity**: Feature-based module organization
2. **Dependency Injection**: Services receive repositories via constructors
3. **Separation of Concerns**: Each layer has a single responsibility
4. **Type Safety**: Full TypeScript coverage with strict mode
5. **Scalability**: Stateless design suitable for horizontal scaling

## Folder Structure

```
src/
├── config/           # App configuration (database, redis, etc.)
├── constants/        # App-wide constants
├── types/            # Global TypeScript types
├── utils/            # Utility functions
├── middleware/       # Express middlewares
├── services/         # Shared services (email, sms, etc.)
├── repositories/     # Database abstraction layer
├── sockets/          # Socket.io real-time handlers
├── modules/          # Feature-based modules
│   ├── auth/         # Authentication
│   ├── users/        # User management
│   ├── buses/        # Bus fleet & tracking
│   ├── routes/       # Routes & pickup points
│   ├── pickups/      # Pickup operations
│   ├── payments/     # Fee management
│   ├── attendance/   # Student attendance
│   └── notifications/# Push notifications
├── app.ts            # Express app factory
└── server.ts         # Application entry point
```

## Module Structure

Each module follows a consistent pattern:

```
modules/[module]/
├── [module].routes.ts      # Route definitions
├── [module].controller.ts  # Request handlers
├── [module].service.ts     # Business logic
├── [module].repository.ts  # Database operations
└── [module].types.ts       # Module-specific types
```

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 6+

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Set up database
npx prisma migrate dev
npx prisma generate

# Start development server
npm run dev
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `REDIS_URL` | Redis connection string | Yes |
| `JWT_SECRET` | JWT signing key (min 32 chars) | Yes |
| `JWT_REFRESH_SECRET` | Refresh token signing key | Yes |
| `PORT` | Server port (default: 5000) | No |
| `NODE_ENV` | Environment (development/production) | No |

## API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login user |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/logout` | Logout user |
| POST | `/api/v1/auth/logout-all` | Logout all devices |
| POST | `/api/v1/auth/change-password` | Change password |
| GET | `/api/v1/auth/me` | Get current user |

### Health Check

```
GET /health
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type check |
| `npm run db:migrate` | Run database migrations |
| `npm run db:studio` | Open Prisma Studio |

## Technology Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL + Prisma ORM
- **Cache**: Redis (ioredis)
- **Auth**: JWT (jsonwebtoken)
- **Real-time**: Socket.io
- **Validation**: express-validator
- **Logging**: Winston
- **Security**: Helmet, CORS, Rate Limiting

## License

MIT