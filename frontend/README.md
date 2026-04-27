# BusKaro Frontend Architecture

This directory contains the frontend applications for the BusKaro real-time bus tracking system.

## 📁 Structure

```
frontend/
├── mobile/          # React Native app (Student + Driver)
├── web/             # React web app (Admin Dashboard)
└── README.md        # This file
```

---

## 📱 Mobile App

### Tech Stack
- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: React Navigation (Stack + Bottom Tabs)
- **State Management**: Zustand (with persistence)
- **Data Fetching**: TanStack Query (React Query)
- **Real-time**: Socket.IO Client
- **HTTP Client**: Axios with interceptors
- **Maps**: React Native Maps
- **Location**: Expo Location

### Project Structure
```
frontend/mobile/
├── App.tsx                      # Entry point
├── package.json                 # Dependencies
├── tsconfig.json               # TypeScript config
└── src/
    ├── types/
    │   └── index.ts            # All TypeScript types
    ├── theme/
    │   ├── colors.ts           # Color palette
    │   ├── typography.ts       # Font styles
    │   ├── spacing.ts          # 8px grid system
    │   └── index.ts            # Theme exports
    ├── constants/
    │   └── api.ts              # API endpoints & socket events
    ├── store/
    │   └── auth.store.ts       # Auth state (Zustand)
    ├── services/
    │   ├── api.service.ts     # Axios client
    │   ├── socket.service.ts  # Socket.IO client
    │   └── location.service.ts # GPS tracking
    ├── navigation/
    │   ├── RootNavigator.tsx   # Root (Auth vs App)
    │   ├── AuthNavigator.tsx   # Auth flow
    │   ├── StudentNavigator.tsx # Student tabs
    │   ├── DriverNavigator.tsx  # Driver tabs
    │   └── index.ts            # Nav exports
    ├── screens/
    │   ├── auth/
    │   │   ├── LoginScreen.tsx
    │   │   └── RegisterScreen.tsx
    │   ├── student/
    │   │   ├── HomeScreen.tsx      # Dashboard
    │   │   ├── TrackScreen.tsx     # Map tracking
    │   │   ├── PickupScreen.tsx    # Request pickup
    │   │   └── PaymentsScreen.tsx  # View payments
    │   ├── driver/
    │   │   ├── DashboardScreen.tsx # Trip control
    │   │   ├── PickupsScreen.tsx   # View requests
    │   │   └── NavigationScreen.tsx # Route nav
    │   └── shared/
    │       └── ProfileScreen.tsx   # Common profile
    ├── components/              # Reusable components
    ├── hooks/                   # Custom hooks
    └── utils/                   # Utilities
```

### Design System

#### Colors
- **Primary**: Blue palette (500: #2196F3)
- **Secondary**: Green palette (500: #4CAF50)
- **Success**: #4CAF50
- **Error**: #F44336
- **Warning**: #FF9800
- **Grey**: 50-900 scale for neutrals

#### Typography
- **H1**: 48px Bold
- **H2**: 36px SemiBold
- **H3**: 30px SemiBold
- **H4**: 24px Medium
- **Body**: 16px Regular
- **Small**: 14px Regular
- **Caption**: 12px Regular

#### Spacing (8px Grid)
```
1 = 4px    5 = 20px   9 = 36px
2 = 8px    6 = 24px   10 = 40px
3 = 12px   7 = 28px   12 = 48px
4 = 16px   8 = 32px   16 = 64px
```

### Setup Commands
```bash
cd frontend/mobile

# Install dependencies
npm install

# Start development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Type check
npm run type-check

# Lint
npm run lint
```

### Navigation Flow
```
RootNavigator
├── Auth (Not authenticated)
│   ├── Login
│   └── Register
│
├── StudentMain (Role: STUDENT)
│   ├── Home (Tab)
│   ├── Track (Tab)
│   ├── Pickup (Tab)
│   ├── Payments (Tab)
│   └── Profile (Tab)
│
└── DriverMain (Role: DRIVER)
    ├── Dashboard (Tab)
    ├── Pickups (Tab)
    ├── Navigation (Tab)
    └── Profile (Tab)
```

---

## 🌐 Web Admin Dashboard

### Tech Stack
- **Framework**: React + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Real-time**: Socket.IO Client
- **Charts**: Recharts
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

### Project Structure
```
frontend/web/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
└── src/
    ├── main.tsx              # Entry point
    ├── App.tsx               # Root component
    ├── types/
    │   └── index.ts          # Shared types
    ├── constants/
    │   └── api.ts            # API config
    ├── store/
    │   ├── auth.store.ts     # Auth state
    │   └── sidebar.store.ts  # UI state
    ├── services/
    │   ├── api.service.ts    # Axios client
    │   └── socket.service.ts  # Socket client
    ├── components/
    │   ├── common/           # Reusable components
    │   │   ├── Button.tsx
    │   │   ├── Card.tsx
    │   │   ├── Input.tsx
    │   │   ├── Table.tsx
    │   │   └── Modal.tsx
    │   └── layout/           # Layout components
    │       ├── Sidebar.tsx
    │       ├── Header.tsx
    │       └── Layout.tsx
    ├── hooks/
    │   ├── useAuth.ts
    │   ├── useSocket.ts
    │   └── useApi.ts
    ├── pages/
    │   ├── auth/
    │   │   └── Login.tsx
    │   ├── dashboard/
    │   │   └── Dashboard.tsx
    │   ├── users/
    │   │   ├── UsersList.tsx
    │   │   └── UserDetail.tsx
    │   ├── buses/
    │   │   ├── BusesList.tsx
    │   │   └── BusDetail.tsx
    │   ├── routes/
    │   │   ├── RoutesList.tsx
    │   │   └── RouteDetail.tsx
    │   ├── payments/
    │   │   └── PaymentsList.tsx
    │   └── settings/
    │       └── Settings.tsx
    ├── router/
    │   └── index.tsx         # Route definitions
    └── utils/
        └── helpers.ts
```

### Setup Commands
```bash
cd frontend/web

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npx tsc --noEmit

# Lint
npm run lint
```

### Admin Navigation
```
Layout (with Sidebar)
├── Dashboard
│   ├── Overview stats
│   ├── Live bus map
│   └── Recent activity
│
├── Users
│   ├── All Users
│   ├── Students
│   └── Drivers
│
├── Buses
│   ├── Bus List
│   ├── Bus Routes
│   └── Track Buses
│
├── Routes
│   ├── Route List
│   └── Stop Management
│
├── Payments
│   ├── Transactions
│   └── Revenue Report
│
├── Attendance
│   └── Daily Reports
│
└── Settings
    └── General Settings
```

---

## 🔐 Authentication Flow

### Mobile & Web (Shared Pattern)
1. **Login**: Email + Password → JWT tokens
2. **Token Storage**:
   - Mobile: SecureStore (encrypted)
   - Web: LocalStorage (httpOnly cookie preferred)
3. **Auto Refresh**: Axios interceptor handles 401 → refresh → retry
4. **Role Routing**: Different navigators for Student/Driver/Admin
5. **Logout**: Clear storage + reset state + navigate to Login

### Token Structure
```typescript
interface AuthTokens {
  accessToken: string;    // Short-lived (15 min)
  refreshToken: string;   // Long-lived (7 days)
}
```

---

## 🌐 API Integration

### Axios Setup
- **Base URL**: From env var
- **Timeout**: 15 seconds
- **Interceptors**:
  - Request: Add Authorization header
  - Response: Handle 401 with token refresh

### React Query Setup
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // 5 minutes
      retry: 2,
    },
  },
});
```

### API Endpoints
See `constants/api.ts` files for complete endpoint definitions.

---

## ⚡ Socket.IO Integration

### Connection
```typescript
socket.connect(token);  // Authenticated connection
```

### Student Events
- `student:bus-location` - Real-time bus position
- `student:eta-update` - ETA changes
- `student:bus-arrival` - Bus arriving notification
- `student:pickup-confirmed` - Pickup accepted
- `student:attendance-marked` - Attendance recorded

### Driver Events
- `driver:pickup-cluster-updated` - New pickup clusters
- `driver:route-optimized` - Route recalculated
- `driver:location-update` - Send GPS position

### Admin Events
- `admin:bus-location-global` - All buses
- `admin:dashboard-update` - Live stats

---

## 📱 Mobile Development Notes

### Permissions (iOS/Android)
- **Location**: Always in use (for drivers)
- **Background Location**: Required for tracking
- **Notifications**: For pickup/attendance alerts

### Map Configuration
- Use Google Maps API key
- Configure in `app.json` for Expo

### Location Tracking
- Update interval: 5 seconds or 10 meters
- Battery optimization: Use significant location changes
- Background mode: Configure in app config

---

## 🎨 Component Library

### Mobile Components (to build)
- `Button` - Primary, secondary, outline variants
- `Card` - Elevated container with shadow
- `Input` - Text input with validation
- `MapView` - Bus tracking map
- `BusMarker` - Custom bus marker
- `PickupCard` - Pickup request card
- `ETABadge` - ETA display component
- `AttendanceStatus` - Present/absent indicator
- `PaymentCard` - Payment history item

### Web Components (to build)
- `Button` - All variants
- `Card` - Dashboard cards
- `Input` - Form inputs
- `Table` - Data tables with sorting
- `Modal` - Dialog overlays
- `Sidebar` - Navigation sidebar
- `StatCard` - Dashboard stat display
- `LiveMap` - Real-time bus map
- `Chart` - Recharts wrapper

---

## 🚀 Deployment

### Mobile
1. **Expo Build**:
   ```bash
   eas build --platform ios
   eas build --platform android
   ```
2. **App Store / Play Store**: Submit builds manually

### Web
1. **Build**: `npm run build`
2. **Deploy**: Upload `dist/` to hosting (Vercel/Netlify/S3)

---

## 📝 Coding Standards

### TypeScript
- Strict mode enabled
- No `any` types
- Interface naming: `PascalCase`
- Use union types for status/state

### Components
- Functional components with hooks
- Props interface defined
- Default exports for screens
- Named exports for utilities

### Styling
- Mobile: StyleSheet (no inline styles)
- Web: Tailwind classes
- Theme tokens always used (no hardcoded values)

### File Naming
- Components: `PascalCase.tsx`
- Utilities: `camelCase.ts`
- Constants: `UPPER_SNAKE_CASE`

---

## 🔧 Environment Variables

### Mobile (.env)
```
EXPO_PUBLIC_API_URL=https://api.buskaro.com
EXPO_PUBLIC_SOCKET_URL=wss://api.buskaro.com
EXPO_PUBLIC_MAPS_API_KEY=your_key
```

### Web (.env)
```
VITE_API_URL=https://api.buskaro.com
VITE_SOCKET_URL=wss://api.buskaro.com
```

---

## 📊 Future Enhancements

- [ ] Push notifications (Expo Notifications)
- [ ] Deep linking
- [ ] Offline support (React Query cache)
- [ ] Biometric auth
- [ ] Dark mode
- [ ] Multi-language support
- [ ] Analytics (Firebase/Amplitude)
- [ ] E2E testing (Detox/Cypress)
