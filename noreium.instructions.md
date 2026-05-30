# Noreium — GitHub Copilot Instructions

## Project overview

Noreium is a personal developer environment management system. It lets developers store tools, APIs, and resources with metadata, group them into collections (e.g. "AI Setup", "Frontend Setup"), and generate reproducible installation scripts for Windows or Linux. The goal is a portable, versioned developer workspace that can recreate an entire environment in minutes.

**Domain:** `noreium.com`
**Stack:** React + Vite (frontend) · Node.js + Express + TypeScript (backend) · PostgreSQL + Prisma · TanStack Query · JWT auth · Zod · Tailwind CSS
**Structure:** pnpm monorepo → `apps/api` (Express) and `apps/web` (React)

---

## Architecture

```
noreium/
├── apps/
│   ├── api/
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── seed.ts
│   │   └── src/
│   │       ├── index.ts         # entry point
│   │       ├── app.ts           # Express app setup
│   │       ├── env.ts           # Zod-validated env
│   │       ├── routes/          # items, collections, scripts, auth
│   │       ├── middleware/      # auth, error, validate
│   │       ├── services/        # business logic layer
│   │       └── types/           # shared TypeScript types
│   └── web/
│       └── src/
│           ├── main.tsx
│           ├── App.tsx
│           ├── api/             # client.ts + per-resource modules
│           ├── pages/           # Library, Collection, ScriptGen
│           ├── components/      # ItemCard, CollectionCard, etc.
│           ├── hooks/           # useItems, useCollections, etc.
│           └── types/           # index.ts (shared contracts)
├── tsconfig.base.json
├── pnpm-workspace.yaml
└── .env.example
```

---

## Database schema (Prisma)

```prisma
model User {
  id           String       @id @default(cuid())
  email        String       @unique
  passwordHash String
  createdAt    DateTime     @default(now())
  items        LibraryItem[]
  collections  Collection[]
}

model LibraryItem {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name        String
  description String?
  type        ItemType
  tags        String[]
  installWin  String?
  installLinux String?
  link        String?
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  collections CollectionItem[]
}

model Collection {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name        String
  description String?
  platform    Platform @default(BOTH)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  items       CollectionItem[]
}

model CollectionItem {
  id           String      @id @default(cuid())
  collectionId String
  collection   Collection  @relation(fields: [collectionId], references: [id], onDelete: Cascade)
  itemId       String
  item         LibraryItem @relation(fields: [itemId], references: [id], onDelete: Cascade)
  order        Int         @default(0)

  @@unique([collectionId, itemId])
}

enum ItemType {
  TOOL
  RUNTIME
  PACKAGE
  API
  RESOURCE
  CONFIG
}

enum Platform {
  WINDOWS
  LINUX
  BOTH
}
```

---

## API routes

All routes under `/api`. Protected routes require `Authorization: Bearer <token>`.

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Returns JWT |
| GET  | `/auth/me` | Current user info |

### Library items (protected)
| Method | Path | Description |
|--------|------|-------------|
| GET    | `/items` | List all items (supports `?type=&tag=&q=`) |
| POST   | `/items` | Create item |
| GET    | `/items/:id` | Get single item |
| PATCH  | `/items/:id` | Update item |
| DELETE | `/items/:id` | Delete item |

### Collections (protected)
| Method | Path | Description |
|--------|------|-------------|
| GET    | `/collections` | List all collections |
| POST   | `/collections` | Create collection |
| GET    | `/collections/:id` | Get collection with items |
| PATCH  | `/collections/:id` | Update collection |
| DELETE | `/collections/:id` | Delete collection |
| POST   | `/collections/:id/items` | Add item to collection |
| DELETE | `/collections/:id/items/:itemId` | Remove item |
| PATCH  | `/collections/:id/items/reorder` | Update item order |

### Script generation (protected)
| Method | Path | Description |
|--------|------|-------------|
| GET    | `/scripts/:collectionId?platform=windows\|linux` | Generate install script |

---

## Coding standards

### General
- TypeScript strict mode everywhere. No `any`. Use `unknown` and narrow explicitly.
- Named exports only. No default exports except React components and the Express `app`.
- All async functions use `async/await`. No raw `.then()` chains.
- Errors bubble up to a central error-handling middleware — routes never send error responses directly.
- No `console.log` in production paths. Use structured logging or remove before commit.
- Environment variables are never accessed directly — always import from `src/env.ts`.

### Backend (Express + Prisma)
- Route files handle HTTP concerns only (parse body, call service, return response).
- Services handle all business logic and Prisma queries.
- Middleware handles cross-cutting concerns (auth, validation, error formatting).
- All request bodies are validated with Zod schemas before reaching the service layer.
- Every Prisma query includes `where: { userId }` for user-scoped data — never query without scoping.
- Use `select` in Prisma queries to return only the fields the client needs — never return `passwordHash`.
- HTTP status codes: 200 OK, 201 Created, 400 Bad Request (validation), 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 500 Internal Server Error.

### Frontend (React + TanStack Query)
- All API calls go through `src/api/client.ts` (the shared Axios instance). Never use `fetch` directly.
- One query hook per resource: `useItems`, `useItem`, `useCollections`, `useCollection`.
- Mutations use `useMutation` with `onSuccess` calling `queryClient.invalidateQueries`.
- Components do not call the API directly — they call hooks only.
- Pages are responsible for layout and data fetching. Components are responsible for rendering only.
- No `useEffect` for data fetching. TanStack Query handles all server state.
- Form state uses `useState` for simple forms. Use `react-hook-form` only if forms become complex.
- The `@/` alias maps to `src/`. Always use it for internal imports.

### Naming conventions
- Files: `camelCase.ts` for utilities, `PascalCase.tsx` for components, `kebab-case.ts` for config.
- React components: `PascalCase`.
- Hooks: `useCamelCase`.
- Types and interfaces: `PascalCase`. Prefix interfaces with nothing — no `IUser`.
- Zod schemas: suffix with `Schema` → `createItemSchema`, `loginSchema`.
- Route files: named after the resource → `items.ts`, `collections.ts`.
- Service files: suffix with `Service` → `itemService.ts`, `collectionService.ts`.
- Constants: `SCREAMING_SNAKE_CASE`.

---

## Type contracts

Define these in `apps/web/src/types/index.ts` and mirror in `apps/api/src/types/index.ts`:

```ts
export type ItemType = 'TOOL' | 'RUNTIME' | 'PACKAGE' | 'API' | 'RESOURCE' | 'CONFIG'
export type Platform = 'WINDOWS' | 'LINUX' | 'BOTH'

export interface LibraryItem {
  id: string
  name: string
  description: string | null
  type: ItemType
  tags: string[]
  installWin: string | null
  installLinux: string | null
  link: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface Collection {
  id: string
  name: string
  description: string | null
  platform: Platform
  items: CollectionItem[]
  createdAt: string
  updatedAt: string
}

export interface CollectionItem {
  id: string
  order: number
  item: LibraryItem
}

export interface User {
  id: string
  email: string
  createdAt: string
}
```

---

## Zod validation schemas (backend)

```ts
// items
export const createItemSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(['TOOL', 'RUNTIME', 'PACKAGE', 'API', 'RESOURCE', 'CONFIG']),
  tags: z.array(z.string()).default([]),
  installWin: z.string().max(2000).optional(),
  installLinux: z.string().max(2000).optional(),
  link: z.string().url().optional().or(z.literal('')),
  notes: z.string().max(2000).optional(),
})

export const updateItemSchema = createItemSchema.partial()

// collections
export const createCollectionSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  platform: z.enum(['WINDOWS', 'LINUX', 'BOTH']).default('BOTH'),
})

export const updateCollectionSchema = createCollectionSchema.partial()

// auth
export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
})

export const loginSchema = registerSchema
```

---

## Script generator logic

The script engine lives in `apps/api/src/services/scriptService.ts`. Given a collection ID and a platform, it fetches all items in order and concatenates their install commands into a valid shell script.

```ts
// Windows output format (.bat)
@echo off
echo Installing: <collection name>
echo.
echo [1/N] <item name>
<installWin command>
echo.
...
echo Done.
pause

// Linux output format (.sh)
#!/bin/bash
set -e
echo "Installing: <collection name>"
echo ""
echo "[1/N] <item name>"
<installLinux command>
echo ""
...
echo "Done."
```

**Edge case rules:**
- If an item has no install command for the requested platform, emit a comment: `# SKIP: <item name> — no <platform> command defined`
- If ALL items are skipped, return a 400 with message: `"No items in this collection have install commands for the selected platform."`
- Sanitize command strings: strip null bytes, reject commands containing `$(` or backtick subshell syntax on the Windows path.
- The response `Content-Type` is `text/plain` for download, with `Content-Disposition: attachment; filename="noreium-<collection-slug>-<platform>.bat|.sh"`.

---

## Auth middleware

```ts
// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../env'

export interface AuthRequest extends Request {
  userId: string
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' })
  }
  try {
    const payload = jwt.verify(header.slice(7), env.JWT_SECRET) as { sub: string }
    ;(req as AuthRequest).userId = payload.sub
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}
```

---

## Error handling

Central error middleware in `src/middleware/error.ts`:

```ts
import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'

export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message)
  }
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      issues: err.flatten().fieldErrors,
    })
  }
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message })
  }
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
}
```

Route handlers wrap async logic like this:

```ts
router.get('/:id', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const item = await itemService.getById(req.params.id, req.userId)
    if (!item) throw new AppError(404, 'Item not found')
    res.json(item)
  } catch (err) {
    next(err)
  }
})
```

---

## Frontend API hooks pattern

```ts
// src/hooks/useItems.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchItems, createItem, updateItem, deleteItem } from '@/api/items'
import type { LibraryItem } from '@/types'

export function useItems(filters?: { type?: string; tag?: string; q?: string }) {
  return useQuery({
    queryKey: ['items', filters],
    queryFn: () => fetchItems(filters),
  })
}

export function useCreateItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createItem,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items'] }),
  })
}

export function useDeleteItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteItem,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items'] }),
  })
}
```

---

## What Noreium is NOT

Do not suggest patterns that pull the project toward:
- A SaaS marketplace or multi-tenant tool browser — this is a personal vault, not a public catalog.
- Real-time sync, websockets, or live collaboration — out of scope for MVP.
- Plugin systems or third-party integrations beyond the script generator.
- A CLI tool (planned for later versions, not the web MVP).
- Any feature that adds complexity without directly serving: store item → group into collection → generate script.

---

## MVP feature checklist

- [x] Project foundation (monorepo, Express, Vite, Prisma, env validation)
- [ ] Prisma schema + migrations + seed
- [ ] Library item CRUD (API + UI)
- [ ] Collections CRUD + item linking (API + UI)
- [ ] Script generator (Windows .bat + Linux .sh)
- [ ] JWT auth + user-scoped data
- [ ] Search + filter by type and tag
- [ ] JSON import / export
- [ ] Empty states and error states in UI
- [ ] Basic responsive layout

