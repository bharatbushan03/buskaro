# BusKaro

BusKaro is a college bus tracking system with a Node.js backend API and an Expo React Native mobile app for students and drivers.

## Project Structure

```text
.
├── src/                 # Backend API modules, middleware, sockets, config
├── prisma/              # Prisma schema and seed data
├── frontend/
│   ├── mobile/          # Expo React Native app
│   └── web/             # Admin web app
└── docker/              # Deployment support
```

## Requirements

- Node.js 20.19.4 or newer for the Expo mobile app
- Node.js 18 or newer for the backend
- PostgreSQL 14 or newer
- Redis 6 or newer
- Latest Expo Go app on Android/iOS

If your system Node is older, Expo may show:

```text
Node.js is outdated and unsupported. Please update to a newer Node.js LTS version.
```

Install the latest LTS from <https://nodejs.org/en/download> or run Expo with a temporary newer Node:

```bash
npx -p node@20.19.4 node node_modules/expo/bin/cli start --lan --clear
```

## Backend Setup

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

The API runs on port `5000` by default and exposes endpoints under `/api/v1`.

Useful backend scripts:

```bash
npm run dev
npm run typecheck
npm run db:studio
npm run db:seed
```

## Mobile App Setup

```bash
cd frontend/mobile
npm install
npm run type-check
npx expo start --lan --clear
```

For Expo SDK 54, keep Expo Go updated from the Play Store/App Store. Older Expo Go versions will show:

```text
Project is incompatible with this version of Expo Go
This project requires a newer version of Expo Go.
```

The mobile app derives the backend URL from the Expo development server host during local development. You can override it manually:

```bash
EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_IP:5000
```

On Windows PowerShell:

```powershell
$env:EXPO_PUBLIC_API_URL="http://YOUR_COMPUTER_IP:5000"
npx expo start --lan --clear
```

## Seed Login Accounts

After running `npm run db:seed`, use:

| Role | Email | Password |
| --- | --- | --- |
| Student | `amit@college.edu` | `student123` |
| Driver | `driver1@buskaro.com` | `driver123` |
| Admin | `admin@buskaro.com` | `admin123` |

## Recent Mobile Fixes

- Updated the Expo mobile app to SDK 54-compatible packages.
- Added Expo config files for Metro, Babel, fonts, and secure storage.
- Fixed mobile API endpoint constants for student dashboard, pickup requests, driver trips, route, and pickups.
- Fixed driver dashboard trip status handling by mapping backend `IN_PROGRESS`/`PAUSED` to mobile `IN_SERVICE`.
- Fixed driver route and pickup backend queries to match the Prisma schema.
- Made denied location permission non-fatal so the dashboard can still load.
- Added `.expo/` to `.gitignore`.

## Driver Dashboard Notes

Driver tracking requires location permission on the phone. If permission is denied, the dashboard still loads, but live driver location updates are disabled until permission is granted in device settings.

If the mobile app shows stale auth or token errors after backend changes, log out and log in again with one of the seed accounts.

## Validation

Mobile validation:

```bash
cd frontend/mobile
npm run type-check
npx expo export --platform android --output-dir .expo-export-check --clear
```

Backend smoke test example:

```powershell
$login = Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/v1/auth/login -ContentType 'application/json' -Body '{"email":"driver1@buskaro.com","password":"driver123"}'
$token = $login.data.accessToken
Invoke-RestMethod -Method Get -Uri http://localhost:5000/api/v1/drivers/route -Headers @{ Authorization = "Bearer $token" }
Invoke-RestMethod -Method Get -Uri http://localhost:5000/api/v1/drivers/pickups/nearby -Headers @{ Authorization = "Bearer $token" }
```

## Main Backend Modules

- `auth` - login, register, refresh, logout
- `students` - student dashboard, bus tracking, pickup status
- `drivers` - driver dashboard, route navigation, trip lifecycle
- `pickups` - dynamic pickup pins and requests
- `buses` - fleet and bus tracking
- `routes` - routes and pickup points
- `payments` - fee and payment records
- `attendance` - bus attendance records

## License

MIT
