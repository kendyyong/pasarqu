# Pasarqu: AI Copilot Instructions

## Project Overview
**Pasarqu** is a local marketplace platform built with React 18 + TypeScript + Vite, designed to support multiple user roles (super admins, local admins, merchants, couriers, and buyers) managing products across geographically distributed markets.

## Architecture

### Core Stack
- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite 5.1 (dev server on port 3000)
- **Backend**: Supabase (PostgreSQL + Auth)
- **Maps**: Google Maps API + React Leaflet
- **Styling**: Tailwind CSS + custom color palette
- **UI Components**: Lucide React icons

### Build & Run Commands
```bash
npm run dev      # Start dev server (watch mode)
npm run build    # TypeScript compile + Vite production build
npm run lint     # ESLint with zero warnings policy
npm run preview  # Preview production build locally
```

## State Management Pattern

**Context API architecture** with five core contexts in [src/contexts/](../src/contexts/):

1. **AuthContext** - User authentication, session, profile roles
   - Used via `useAuth()` hook
   - Provides: `session`, `user`, `profile`, `isAdmin`, `isMerchant`, `isCourier`, `login()`, `logout()`
   - Auto-syncs with Supabase auth state changes

2. **MarketContext** - Global market data and shopping cart
   - Used via `useMarket()` hook
   - Cart state persists to `localStorage` (key: `pasarqu_cart`)
   - Provides: `markets[]`, `selectedMarket`, `cart[]`, `addToCart()`, `updateQty()`, `removeFromCart()`, `clearCart()`

3. **ConfigContext** - Global app configuration (admin fees, shipping rates, branding)
   - Used via `useConfig()` hook
   - Static DEFAULT_CONFIG defined in file; extend by calling `updateConfig()`

4. **ChatContext** - Chat thread management (currently mock data)
   - Used via `useChat()` hook
   - Mock threads in MOCK_THREADS array

5. **ToastContext** - User notifications
   - Used via `useToast()` hook
   - Provides: `showToast(message, type)` where type is 'success' | 'error' | 'info'
   - Auto-dismisses after 3 seconds

## Key Conventions

### Role-Based Access Control (RBAC)
User roles defined in [src/types.ts](../src/types.ts):
- `SUPER_ADMIN` - Platform-wide management
- `LOCAL_ADMIN` - Market-specific operations
- `SELLER` / `MERCHANT` - Product sellers
- `COURIER` - Delivery personnel
- `BUYER` - Customers

Each dashboard page in [src/pages/](../src/pages/) is role-specific and should check user role before rendering admin features.

### Type Definitions
Core types centralized in [src/types.ts](../src/types.ts):
- `User` - Authentication and profile
- `Market` - Geographic market with shipping tiers
- `Product` - Inventory item with metadata
- `CartItem` - extends Product with `quantity`
- `Order` / `OrderItem` - Transaction entities
- `PromoPackage` - Subscription offerings

### Colors & Branding
Tailwind extends in [tailwind.config.js](../tailwind.config.js):
- Primary: Teal/Tosca (`#14b8a6` as base)
- Secondary: Amber/Yellow (`#f59e0b`)
- Tertiary: Navy (`#0f172a`)
- Used as `bg-primary-500`, `text-secondary-500`, etc.

## Data Flow Patterns

### Cart Management
1. `addToCart(product)` → checks if exists in state
2. If exists, increment quantity; else add with quantity=1
3. Store persists to localStorage automatically via useEffect
4. `updateQty(productId, delta)` - modify quantity by delta (can be negative)
5. Items with quantity ≤ 0 filtered out

### Market Selection
| Action | Target | Key Storage |
|--------|--------|------------|
| User selects market | `setSelectedMarket(market)` | localStorage key: `selected_market_id` |
| App.tsx reads on mount | `localStorage.getItem('selected_market_id')` | Restored on page refresh |

### Authentication Flow
1. `AuthProvider` initializes from Supabase session
2. Listens to `supabase.auth.onAuthStateChange()` for real-time sync
3. On auth state change: fetches user profile from `profiles` table
4. **Important**: Uses `.maybeSingle()` not `.single()` to avoid 406 errors on empty profiles

## Supabase Integration

### Connection
Hardcoded credentials in `src/lib/supabaseClient.ts`:
- URL: `https://rutyhzpctkfsshckiuqn.supabase.co`
- All client code uses `import { supabase }` from this file

### Common Queries
```typescript
// Fetch profile with safe null handling
await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();

// Fetch markets with details
await supabase.from('markets').select('*');

// Fetch products filtered by market
await supabase.from('products').select('*').eq('market_id', marketId);
```

## Component Organization

### Pages [src/pages/](../src/pages/)
- **Home.tsx** - Public landing page with market selection
- **auth/** - Authentication pages (login, register, partner portals)
- **checkout/** - Payment processing (CheckoutPaymentPage)
- **admin/** - SuperAdminDashboard, LocalAdminDashboard
- **merchant/** - MerchantDashboard
- **courier/** - CourierDashboard
- **customer/** - CustomerDashboard
- **promo/** - Promotional management screens

### Components [src/components/](../src/components/)
- **MobileLayout** - Responsive wrapper with bottom tab navigation
- **CartDrawer** - Shopping cart sidebar
- **ProductGrid** - Product listing with add-to-cart
- **HeroOnboarding** - Hero banner section
- **GhostBar** - Navigation bar component
- **AppLogo** - Branding logo
- **LocationPicker** - Map-based location selection

## UI/UX Patterns

### Toast Notifications
```typescript
import { useToast } from '../contexts/ToastContext';

const { showToast } = useToast();
showToast("Order created successfully", "success");
showToast("Failed to add product", "error");
showToast("Syncing data...", "info");
```

### Protected Routes
Check user role before rendering sensitive screens:
```typescript
if (!user || profile?.role !== 'SUPER_ADMIN') {
  return <Redirect to="/unauthorized" />;
}
```

### Export Utilities
Admin dashboards include:
- **exportToPDF()** - Generates PDF with letterhead using jsPDF + autoTable
- **exportToExcel()** - Creates .xlsx files using xlsx library

## Development Workflow

### Adding a New Page
1. Create file in appropriate [src/pages/](../src/pages/) subdirectory
2. Wrap with role-check using `useAuth()` hook
3. Export default from an index if using subdirectories
4. Add route in [App.tsx](../src/App.tsx) Routes section
5. Import page at top of App.tsx

### Adding Context Data
1. Define type interface in context file
2. Use `createContext()` + `useContext()` pattern
3. Export provider component and hook function
4. Wrap App in provider at tree root

### Styling Guidelines
- Use Tailwind utilities for all CSS
- Reference custom colors: `bg-primary-500`, `text-secondary-400`
- Responsive: `hidden md:block` for desktop-only, `md:hidden` for mobile
- Fixed positioning for headers/nav (set appropriate `z-index` value)

## Important Notes

### Environment Variables
- **GEMINI_API_KEY** - Set in `.env.local` for Google Gemini API
- Accessed as `process.env.GEMINI_API_KEY` (injected by Vite in vite.config.ts)

### Common Gotchas
1. **localStorage vs Context**: Cart uses localStorage for persistence; contexts reset on page reload unless explicitly saved
2. **Supabase Queries**: Always use `.maybeSingle()` for optional single rows to avoid 406 errors
3. **Role Comparisons**: Some code checks `profile?.role`, others check `isAdmin`/`isMerchant` helpers—standardize when refactoring
4. **TypeScript Strict Mode**: Project uses types strictly; ensure all optional fields marked with `?`

## Project Structure Essentials
```
src/
├── contexts/         # State management (Auth, Market, Config, Chat, Toast)
├── pages/            # Feature pages organized by user role
├── components/       # Reusable UI components
├── lib/              # External service clients (Supabase)
├── utils/            # Helpers (geo.ts, notifications.ts, whatsapp.ts)
├── types.ts          # Central type definitions
└── App.tsx           # Main router and provider setup
```

---
**Last Updated**: Feb 11, 2026 | **Framework**: React 18 + TypeScript 5.2 | **Target**: nodejs
