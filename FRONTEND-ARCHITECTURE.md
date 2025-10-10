# Frontend Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            FRONTEND APPLICATION                             │
│                         (Next.js 15 + React 19)                            │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              ENTRY POINTS                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  • middleware.ts         → Authentication & Route Protection                 │
│  • app/layout.tsx        → Root Layout (Fonts, Toast, Global Styles)        │
│  • app/page.tsx          → Landing Page                                      │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              ROUTING LAYER                                   │
│                          (App Router Structure)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  PUBLIC ROUTES                    │  PROTECTED ROUTES                       │
│  ├─ /login                        │  ├─ /dashboard                         │
│  │  └─ Login Form                 │  │  ├─ Dashboard Layout               │
│  │                                 │  │  ├─ Tariff Chart                   │
│  ├─ /signup                        │  │  └─ Server Actions                 │
│  │  └─ Signup Form                 │  │                                     │
│  │                                 │  ├─ /history                           │
│  │                                 │  │  └─ Query History                   │
│  │                                 │  │                                     │
│  │                                 │  └─ /tariffhistory                     │
│  │                                 │     └─ WITS Tariff History             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           API ROUTES (Next.js)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│  • /api/wits-tariff      → WITS Tariff Data Endpoints                       │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                            CORE LIBRARIES                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  lib/                                                                        │
│  ├─ auth.ts              → Authentication Logic                             │
│  │  ├─ login()           → JWT Token Generation                             │
│  │  ├─ register()        → User Registration                                │
│  │  ├─ logout()          → Session Cleanup                                  │
│  │  ├─ getToken()        → Token Retrieval                                  │
│  │  ├─ getAuthHeaders()  → Auth Headers Builder                             │
│  │  └─ authenticatedFetch() → Authenticated HTTP Client                     │
│  │                                                                           │
│  ├─ supabaseClient.ts    → Supabase Client Instance                         │
│  │                                                                           │
│  └─ utils.ts             → Utility Functions                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         COMPONENT ARCHITECTURE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  SHARED COMPONENTS (components/)                                             │
│  ├─ app-sidebar.tsx      → Main Application Sidebar                         │
│  ├─ site-header.tsx      → Site Header                                      │
│  ├─ login-form.tsx       → Login Form Component                             │
│  ├─ signup-form.tsx      → Registration Form Component                      │
│  ├─ data-table.tsx       → Data Table Component                             │
│  ├─ chart-area-interactive.tsx → Interactive Chart Component                │
│  ├─ section-cards.tsx    → Section Card Components                          │
│  │                                                                           │
│  ├─ NAVIGATION COMPONENTS                                                    │
│  │  ├─ nav-main.tsx      → Main Navigation                                  │
│  │  ├─ nav-secondary.tsx → Secondary Navigation                             │
│  │  ├─ nav-user.tsx      → User Navigation Menu                             │
│  │  └─ nav-documents.tsx → Documents Navigation                             │
│  │                                                                           │
│  └─ UI COMPONENTS (components/ui/)                                           │
│     └─ Radix UI + shadcn/ui Components                                      │
│        ├─ Alert Dialog, Avatar, Checkbox, Dialog                            │
│        ├─ Dropdown Menu, Label, Popover, Progress                           │
│        ├─ Select, Separator, Tabs, Toggle, Tooltip                          │
│        └─ etc.                                                               │
│                                                                              │
│  PAGE-SPECIFIC COMPONENTS (app/[page]/components/)                           │
│  └─ dashboard/components/                                                    │
│     └─ TariffChart.tsx   → Dashboard Tariff Chart                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           CUSTOM HOOKS                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  hooks/                  → Custom React Hooks                                │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                          DATA LAYER                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  PRISMA ORM                                                                  │
│  ├─ schema.prisma        → Database Schema Definition                       │
│  ├─ seed.ts              → Database Seed Script                             │
│  └─ @prisma/client       → Generated Prisma Client                          │
│                                                                              │
│  SERVER ACTIONS                                                              │
│  └─ app/dashboard/actions/ → Server-side Actions                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                        EXTERNAL SERVICES                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐   │
│  │   Backend API    │     │    Supabase      │     │   WITS API       │   │
│  │  (Spring Boot)   │     │   (Database)     │     │  (Tariff Data)   │   │
│  └──────────────────┘     └──────────────────┘     └──────────────────┘   │
│         ↑                         ↑                         ↑               │
│         │                         │                         │               │
│    JWT Auth API              Data Storage             External Data         │
│    - /auth/generateToken                                                    │
│    - /auth/addNewUser                                                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         KEY TECHNOLOGIES                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  FRAMEWORK & RUNTIME                                                         │
│  • Next.js 15.5.3        → React Framework (App Router)                     │
│  • React 19.1.0          → UI Library                                       │
│  • TypeScript 5          → Type Safety                                      │
│                                                                              │
│  STYLING                                                                     │
│  • Tailwind CSS 4        → Utility-First CSS                                │
│  • Radix UI              → Headless UI Components                           │
│  • lucide-react          → Icon Library                                     │
│  • class-variance-authority → Component Variants                            │
│                                                                              │
│  STATE & FORMS                                                               │
│  • react-hook-form       → Form Management                                  │
│  • zod 4                 → Schema Validation                                │
│  • @tanstack/react-table → Table State Management                           │
│                                                                              │
│  DATA VISUALIZATION                                                          │
│  • recharts 2.15.4       → Chart Components                                 │
│                                                                              │
│  UTILITIES                                                                   │
│  • @dnd-kit/*            → Drag & Drop                                      │
│  • date-fns              → Date Manipulation                                │
│  • chrono-node           → Natural Language Date Parsing                    │
│  • sonner               → Toast Notifications                               │
│  • cmdk                  → Command Menu                                     │
│                                                                              │
│  DATABASE & ORM                                                              │
│  • Prisma 6.16.2         → Database ORM                                     │
│  • @supabase/supabase-js → Supabase Client                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         AUTHENTICATION FLOW                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. User Login/Signup                                                        │
│     ↓                                                                        │
│  2. Form Submission (react-hook-form + zod)                                  │
│     ↓                                                                        │
│  3. API Call to Backend (lib/auth.ts)                                        │
│     ↓                                                                        │
│  4. JWT Token Stored (localStorage + Cookies)                                │
│     ↓                                                                        │
│  5. Middleware Validation (middleware.ts)                                    │
│     ↓                                                                        │
│  6. Protected Route Access                                                   │
│     ↓                                                                        │
│  7. Authenticated Requests (authenticatedFetch)                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                          BUILD & DEPLOYMENT                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  • Turbopack             → Fast Development & Build                          │
│  • ESLint                → Code Linting                                      │
│  • PostCSS               → CSS Processing                                    │
│  • Bun Runtime           → Package Manager & Runtime                         │
│                                                                              │
│  SCRIPTS                                                                     │
│  • npm run dev           → Development Server (Turbopack)                    │
│  • npm run build         → Production Build                                  │
│  • npm run start         → Production Server                                 │
│  • npm run lint          → Lint Code                                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                          DATA FLOW PATTERN                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  User Interaction                                                            │
│       ↓                                                                      │
│  React Component (Client/Server Component)                                   │
│       ↓                                                                      │
│  ┌────────────────┬────────────────┐                                        │
│  │                │                │                                        │
│  Server Action   API Route    authenticatedFetch                            │
│  │                │                │                                        │
│  └────────┬───────┴────────────────┘                                        │
│           ↓                                                                  │
│  Backend API / Supabase / Prisma                                             │
│           ↓                                                                  │
│  Data Response                                                               │
│           ↓                                                                  │
│  React State Update                                                          │
│           ↓                                                                  │
│  UI Re-render                                                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
frontend/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   └── wits-tariff/          # WITS Tariff API
│   ├── dashboard/                # Dashboard Page
│   │   ├── actions/              # Server Actions
│   │   │   └── dashboardactions.ts
│   │   └── components/           # Dashboard Components
│   │       └── TariffChart.tsx
│   ├── history/                  # Query History Page
│   ├── login/                    # Login Page
│   ├── signup/                   # Signup Page
│   ├── tariffhistory/            # Tariff History Page
│   ├── layout.tsx                # Root Layout
│   ├── page.tsx                  # Home Page
│   └── globals.css               # Global Styles
│
├── components/                   # Shared Components
│   ├── ui/                       # UI Components (Radix + shadcn)
│   ├── app-sidebar.tsx
│   ├── login-form.tsx
│   ├── signup-form.tsx
│   ├── data-table.tsx
│   ├── chart-area-interactive.tsx
│   └── nav-*.tsx                 # Navigation Components
│
├── lib/                          # Core Libraries
│   ├── auth.ts                   # Authentication Logic
│   ├── supabaseClient.ts         # Supabase Client
│   └── utils.ts                  # Utilities
│
├── hooks/                        # Custom React Hooks
│
├── prisma/                       # Database ORM
│   ├── schema.prisma             # Database Schema
│   └── seed.ts                   # Seed Data
│
├── public/                       # Static Assets
│
├── scripts/                      # Utility Scripts
│
├── middleware.ts                 # Route Protection
├── next.config.ts                # Next.js Configuration
├── tailwind.config.js            # Tailwind Configuration
├── tsconfig.json                 # TypeScript Configuration
└── package.json                  # Dependencies
```

## Architecture Principles

1. **App Router Architecture**: Uses Next.js 15 App Router with server and client components
2. **Component-Based Design**: Modular, reusable components with clear separation of concerns
3. **Type Safety**: Full TypeScript coverage with Zod schema validation
4. **Authentication**: JWT-based authentication with middleware protection
5. **Data Management**: Prisma ORM for database, Server Actions for mutations
6. **Styling**: Tailwind CSS with Radix UI primitives for accessible components
7. **State Management**: React hooks + Server State via Server Actions
8. **API Integration**: Authenticated fetch wrapper for backend communication

## Key Features

- **Server-Side Rendering**: Leveraging Next.js App Router for optimal performance
- **Client-Side Interactivity**: React 19 with modern hooks for dynamic UIs
- **Form Validation**: react-hook-form + Zod for robust form handling
- **Data Visualization**: recharts for interactive tariff charts
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Accessibility**: Radix UI primitives ensure ARIA compliance
- **Type Safety**: End-to-end TypeScript with strict mode enabled
