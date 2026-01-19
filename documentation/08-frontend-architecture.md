# Frontend Architecture

This document provides detailed documentation of the frontend applications in the PinnacleSG monorepo.

## Overview

The platform has three frontend applications:

| Application | Location | Stack | Purpose |
|-------------|----------|-------|---------|
| Patient App | `frontend-patient-app/` | React Native Expo | Patient mobile app |
| Doctor App | `frontend-doctor-app/` | React Native Expo | Doctor mobile app |
| Admin Web UI | `frontend-admin-web-ui/` | React + Vite | Admin dashboard |

## Patient App (`frontend-patient-app/`)

### Directory Structure

```
frontend-patient-app/
├── app/                           # Expo Router file-based routing
│   ├── _layout.tsx               # Root layout (providers)
│   └── (app)/
│       └── (root)/
│           ├── (tabs)/           # Tab navigation
│           │   ├── index.tsx     # Home
│           │   ├── visits.tsx    # Visits
│           │   └── support.tsx   # Support
│           ├── appointment/      # Booking flow
│           ├── family/           # Family management
│           ├── documents/        # Document viewer
│           ├── profile/          # User profile
│           ├── teleconsult/      # Video calls
│           └── walkin/           # Walk-in services
├── apis/                          # API client layer
│   ├── client/                   # Generated OpenAPI client
│   ├── auth.ts                   # Auth endpoints
│   ├── user.ts                   # User endpoints
│   └── teleconsult.ts            # Teleconsult endpoints
├── common/
│   ├── components/               # Shared components
│   └── utils/
│       ├── config.ts             # Theme & colors
│       └── notifications.ts      # Push notifications
├── hooks/                        # Custom hooks
├── ctx.tsx                       # Auth context
└── Config.ts                     # API configuration
```

### Navigation (Expo Router)

File-based routing with grouped routes:

```
app/
├── _layout.tsx                    # Root: SessionProvider, QueryClient
├── (app)/
│   ├── _layout.tsx               # Auth check
│   └── (root)/
│       ├── _layout.tsx           # Main navigation
│       ├── (tabs)/
│       │   ├── _layout.tsx       # Tab bar
│       │   ├── index.tsx         # Home tab
│       │   ├── visits.tsx        # Visits tab
│       │   └── support.tsx       # Support tab
│       ├── appointment/
│       │   ├── _layout.tsx
│       │   ├── selection/
│       │   │   ├── service.tsx
│       │   │   ├── location.tsx
│       │   │   └── date.tsx
│       │   └── payment.tsx
│       └── teleconsult/
│           └── video.tsx
```

### State Management

**Authentication Context (`ctx.tsx`):**
```typescript
interface SessionContextType {
  user: User | null;
  session: Session | null;
  signIn: (token: string) => Promise<void>;
  signOut: () => void;
  isLoading: boolean;
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Firebase auth state listener
    const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken();
        // Fetch user profile from API
      } else {
        setUser(null);
      }
    });
    return unsubscribe;
  }, []);

  return (
    <SessionContext.Provider value={{ user, signIn, signOut }}>
      {children}
    </SessionContext.Provider>
  );
}

export const useSession = () => useContext(SessionContext);
```

**Server State (TanStack Query):**
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 2,
    },
  },
  queryCache: new QueryCache({
    onError: (error) => {
      if (error.status === 401) {
        // Handle unauthorized
      }
    },
  }),
});
```

### API Client Integration

**Configuration (`Config.ts`):**
```typescript
const Config = {
  production: {
    apiUrl: "https://pinnaclesg-api.pinnaclefamilyclinic.com.sg",
    stripePublishableKey: "pk_live_...",
  },
  development: {
    apiUrl: "https://pinnacle-api.geddit-apps.com",
    stripePublishableKey: "pk_test_...",
  },
};
```

**Client Setup:**
```typescript
// apis/index.ts
import { OpenAPI } from './client';

OpenAPI.BASE = Config.apiUrl;
OpenAPI.TOKEN = async () => {
  const user = auth().currentUser;
  if (user) {
    return await user.getIdToken();
  }
  return Config.publicToken;
};
```

### Key Features

- **Appointment Booking**: Multi-step flow with service/location/date selection
- **Teleconsult**: Zoom Video SDK integration for video calls
- **Health Reports**: PDF viewing with HL7 data visualization
- **Family Management**: Add/manage family members as dependents
- **Push Notifications**: Firebase Cloud Messaging

---

## Doctor App (`frontend-doctor-app/`)

### Directory Structure

```
frontend-doctor-app/
├── App.tsx                        # Root component
├── screens/
│   ├── LoginScreen.tsx
│   ├── ConsultationScreen.tsx
│   ├── QueueScreen.tsx
│   ├── EndedQueueScreen.tsx
│   └── SettingScreen.tsx
├── navigation/
│   └── AppNavigator.tsx           # React Navigation
├── store/                         # Redux
│   ├── store.ts
│   ├── authSlice.ts
│   ├── patientSlice.ts
│   └── notificationSlice.ts
├── services/
│   └── client/                    # Generated API client
├── auth/
│   └── AuthHandler.tsx
├── lib/
│   └── supabase.ts
└── common/
    ├── components/
    └── utils/
```

### Navigation (React Navigation)

```typescript
// navigation/AppNavigator.tsx
const Stack = createNativeStackNavigator();

export function AppNavigator() {
  const { isAuthenticated } = useSelector((state) => state.auth);

  return (
    <Stack.Navigator>
      {!isAuthenticated ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <>
          <Stack.Screen name="Queue" component={QueueScreen} />
          <Stack.Screen name="Consultation" component={ConsultationScreen} />
          <Stack.Screen name="EndedQueue" component={EndedQueueScreen} />
          <Stack.Screen name="Settings" component={SettingScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
```

### State Management (Redux)

```typescript
// store/store.ts
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import patientReducer from './patientSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    patient: patientReducer,
    notification: notificationReducer,
  },
});
```

**Auth Slice:**
```typescript
// store/authSlice.ts
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    isAuthenticated: false,
    user: null,
    token: null,
  },
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    },
  },
});
```

### Key Features

- **Patient Queue**: Real-time queue display
- **Video Consultation**: Zoom SDK integration
- **Patient Handoff**: Transfer patients between doctors

---

## Admin Web UI (`frontend-admin-web-ui/`)

### Directory Structure

```
frontend-admin-web-ui/
├── src/
│   ├── main.tsx                   # Entry point with routing
│   ├── AuthRoute.tsx              # Protected route wrapper
│   ├── pages/                     # Page components
│   │   ├── Login.tsx
│   │   ├── appointments/
│   │   │   ├── index.tsx          # Management
│   │   │   ├── services.tsx       # Services
│   │   │   └── corporate-codes.tsx
│   │   ├── branches/
│   │   ├── patients/
│   │   ├── teleconsult/
│   │   ├── delivery/
│   │   └── reports/
│   ├── components/
│   │   ├── Sidebar.tsx
│   │   ├── Topbar.tsx
│   │   ├── Table.tsx
│   │   └── ErrorBoundary.tsx
│   ├── context/
│   │   └── AuthProvider.tsx
│   ├── hooks/
│   ├── services/
│   │   ├── supabase.ts
│   │   └── client/                # Generated API client
│   └── utils/
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

### Routing (React Router v6)

```typescript
// main.tsx
const router = createBrowserRouter([
  {
    path: '/',
    element: <Login />,
  },
  {
    path: '/set-password',
    element: <SetPassword />,
  },
  {
    element: <AuthRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          { path: '/accounts', element: <Accounts /> },
          { path: '/appointments', element: <Appointments /> },
          { path: '/appointments/services', element: <Services /> },
          { path: '/branches', element: <Branches /> },
          { path: '/patients', element: <Patients /> },
          { path: '/teleconsult', element: <Teleconsult /> },
          { path: '/delivery', element: <Delivery /> },
          { path: '/reports', element: <Reports /> },
        ],
      },
    ],
  },
]);
```

### Authentication (Supabase)

```typescript
// context/AuthProvider.tsx
interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: Role;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, session, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
```

### Protected Routes

```typescript
// AuthRoute.tsx
export function AuthRoute() {
  const { session, role } = useAuth();

  if (!session) {
    return <Navigate to="/" replace />;
  }

  if (role === 'doctor') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

### Key Components

**Sidebar Navigation:**
```typescript
// components/Sidebar.tsx
const menuItems = [
  { path: '/appointments', label: 'Appointments', icon: CalendarIcon },
  { path: '/branches', label: 'Branches', icon: BuildingIcon },
  { path: '/patients', label: 'Patients', icon: UsersIcon },
  { path: '/teleconsult', label: 'Teleconsult', icon: VideoIcon },
  { path: '/delivery', label: 'Delivery', icon: TruckIcon },
  { path: '/reports', label: 'Reports', icon: ChartIcon },
];
```

**Data Table:**
```typescript
// components/Table.tsx
interface TableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  loading?: boolean;
  pagination?: PaginationConfig;
}

export function Table<T>({ data, columns, loading, pagination }: TableProps<T>) {
  return (
    <AntdTable
      dataSource={data}
      columns={columns}
      loading={loading}
      pagination={pagination}
    />
  );
}
```

### Key Features

- **Appointment Management**: CRUD for appointments, services, corporate codes
- **Branch Configuration**: Operating hours, services per branch
- **Patient Management**: Search, view, edit patient records
- **Teleconsult Monitoring**: Real-time queue monitoring
- **Delivery/Dispatch**: Medication delivery tracking
- **Reports**: Analytics and data exports

---

## API Client Generation

All apps use `@hey-api/openapi-ts` for type-safe API clients:

```bash
# Generate client (requires backend running)
pnpm run gen-client

# Script in package.json
"gen-client": "openapi-ts --input http://localhost:8000/openapi.json --output ./services/client --client axios"
```

### Generated Files

```
services/client/
├── types.gen.ts      # TypeScript interfaces
├── schemas.gen.ts    # Validation schemas
├── services.gen.ts   # API service classes
└── core/
    ├── request.ts    # HTTP client
    └── OpenAPI.ts    # Configuration
```

### Usage Example

```typescript
import { AppointmentService } from './services/client';

// List appointments
const appointments = await AppointmentService.getAppointments({
  branchId: 'uuid',
  startDate: '2024-01-01',
  endDate: '2024-01-31',
});

// Create appointment
const newAppointment = await AppointmentService.createAppointment({
  requestBody: {
    accountId: 'uuid',
    serviceId: 'uuid',
    startDatetime: '2024-01-15T10:00:00',
  },
});
```

---

## Styling

### Mobile Apps (NativeWind)

```typescript
// common/utils/config.ts
export const theme = {
  colors: {
    primary: '#4F46E5',
    secondary: '#10B981',
    danger: '#EF4444',
    warning: '#F59E0B',
    background: '#F9FAFB',
    text: '#111827',
  },
  fonts: {
    regular: 'Manrope_400Regular',
    medium: 'Manrope_500Medium',
    bold: 'Manrope_700Bold',
  },
};

// Usage in components
<View className="bg-primary p-4 rounded-lg">
  <Text className="text-white font-bold">Hello</Text>
</View>
```

### Web App (Tailwind CSS + Ant Design)

```typescript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#4F46E5',
      },
    },
  },
  plugins: [],
};

// Usage with Ant Design
<Button type="primary" className="bg-primary hover:bg-primary/90">
  Submit
</Button>
```

---

## Development Commands

### Patient App
```bash
cd frontend-patient-app
pnpm install
pnpm start           # Expo dev server
pnpm run ios         # iOS simulator
pnpm run android     # Android emulator
pnpm run gen-client  # Generate API client
```

### Doctor App
```bash
cd frontend-doctor-app
pnpm install
pnpm start
pnpm run ios
pnpm run android
```

### Admin Web UI
```bash
cd frontend-admin-web-ui
pnpm install
pnpm dev             # Vite dev server (localhost:5173)
pnpm build           # Production build
pnpm typecheck       # TypeScript check
pnpm run gen-client  # Generate API client
```

---

## Environment Configuration

### Patient App (`Config.ts`)

```typescript
export default {
  production: {
    apiUrl: 'https://pinnaclesg-api.pinnaclefamilyclinic.com.sg',
    stripePublishableKey: 'pk_live_...',
    paymentGateway2C2P: { apiEnvironment: 'Production' },
  },
  development: {
    apiUrl: 'https://pinnacle-api.geddit-apps.com',
    stripePublishableKey: 'pk_test_...',
    paymentGateway2C2P: { apiEnvironment: 'Sandbox' },
  },
};
```

### Admin Web UI (`.env`)

```bash
VITE_ADMIN_API_URL=http://localhost:8000
VITE_ENV=staging
```

---

**Last Updated**: 2026-01-16
