# EventNest Backend Implementation Plan

Generated from analysis of the frontend (`eventnest-client`) and the backend specification (`eventnest-backend-guide.md`).

---

## Analysis Summary

### Frontend Findings

The frontend makes **zero real API calls** — all data is hardcoded with `setTimeout` mocks. However, it has well-defined types and simulated flows that indicate exactly what the backend needs to support:

| Page | Simulated Flow | Auth Required | Key Types |
|---|---|---|---|
| `/login` | `login({email, password})` -> `{user, token}` -> redirect `/` | No (inverse) | `LoginPayload`, `AuthUser` |
| `/register` | `register({name, email, password})` -> `{user, token}` -> redirect `/` | No (inverse) | `RegisterPayload`, `AuthUser` |
| `/events` | 12 hardcoded events, client-side filtering/pagination | No | `EventItem` |
| `/events/[id]` | Hardcoded details with `organizerName`, `time`, reviews with `userName` | Reads user for review form | Local `EventDetails`, `ReviewItem` |
| `/events/add` | `setTimeout` mock, sends `image: string` (single) | **Yes** (ProtectedRoute) | Local `FormValues` |
| `/events/manage` | Hardcoded 4 events, filters by `organizerId` or admin role | **Yes** (ProtectedRoute) | `ManageEventItem` (EventItem + organizerId) |
| `/contact` | `setTimeout` mock | No | Local `ContactForm` |

### Key Frontend Types

From `src/types/index.ts`:

```ts
interface EventItem {
  _id: string;
  title: string;
  shortDescription: string;
  fullDescription?: string;
  date: string;
  location: string;
  price: number;
  category: string;
  images: string[];
  ratingAverage: number;
  capacity?: number;
}

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  avatar?: string;
}

interface RegisterPayload {
  name: string;
  email: string;
  password: string;  // Note: NO confirmPassword
}

interface LoginPayload {
  email: string;
  password: string;
}
```

From `events/[id]/page.tsx` (local types):

```ts
type ReviewItem = {
  id: string;
  userName: string;    // flat field, not nested user.name
  rating: number;
  comment: string;
  date: string;        // not createdAt
};

type EventDetails = {
  _id: string;
  organizerName: string;  // flat field, not populated object
  time: string;           // not in backend model
  reviews: ReviewItem[];
  // ... other EventItem fields
};
```

From `events/manage/page.tsx` (local type):

```ts
type ManageEventItem = EventItem & {
  organizerId: string;  // flat field, not populated organizer
};
```

### Key Frontend Behaviors

- **Auth storage**: `localStorage` keys `eventnest_user` (JSON) and `eventnest_token` (raw string)
- **ProtectedRoute**: Checks `user` in React state (restored from localStorage on mount); redirects to `/login` if null
- **AuthProvider**: On mount reads stored user/token; provides `{ user, token, loading, login, register, logout }`
- **Login page**: On success calls `router.push("/")`; if user already logged in, redirects away
- **Register page**: On success calls `router.push("/")`; if user already logged in, redirects away
- **Add event page**: Protected by `<ProtectedRoute>`; on success shows message then redirects to `/events/manage`
- **Manage events page**: Protected by `<ProtectedRoute>`; admin sees all events, regular user sees only own events (filtered by `organizerId`)
- **Event details page**: Shows review form only if `user` is truthy; review submission is client-side only (mock)
- **Events listing page**: Client-side filtering by search text, category, location, maxPrice, sort order; 8 items per page

---

## Mismatch Report

| # | Issue | Frontend Expects | Backend Spec Defines | Resolution |
|---|---|---|---|---|
| 1 | Register `confirmPassword` | Not sent in `RegisterPayload` | Required in request body | Make `confirmPassword` optional in Zod schema since frontend validates passwords match client-side |
| 2 | Event `organizerName` | Flat string field on event details | Populated `organizer` object `{ id, name, email }` | Include both `organizerName` and `organizer` in event detail response |
| 3 | Review `userName`/`date` | Flat `userName` and `date` fields | Nested `user: { id, name }` and `createdAt` | Include both flat and nested fields in review responses |
| 4 | Add event `image` | Single `image: string` field in form | `images: string[]` array | Accept both `image` and `images` in Zod schema, normalize to `images[]` via `.transform()` |
| 5 | Manage `organizerId` | Expected field on event items | `organizer` ObjectId reference | Map from `organizer` to `organizerId` in `/users/events` response |
| 6 | Event ID field | `_id` (MongoDB style) used everywhere | Spec shows `id` in responses | Return Mongoose `_id` naturally (both `_id` and `id` available in JSON); frontend already uses `_id` |
| 7 | Event `time` field | Used in event details sidebar | Not in Event model | Include empty string `""` in event detail response for forward compatibility |

---

## Phase 1: Bootstrap Server, DB, and Middleware

### Goal

Set up the Express application foundation: database connection, middleware stack, error handling, and the server entry point.

### Files to Create

```
src/
├── config/
│   └── db.ts                    (exists but empty)
├── middleware/
│   ├── authMiddleware.ts
│   ├── errorMiddleware.ts
│   ├── roleMiddleware.ts
│   └── validateMiddleware.ts
├── types/
│   └── express.d.ts
├── app.ts                       (exists but empty)
└── server.ts                    (exists but empty)
```

### `src/config/db.ts`

- Export `connectDB()` function
- Use `mongoose.connect(process.env.MONGODB_URI!)`
- Log success/failure with `console.log`/`console.error`
- The `.env` already has `MONGODB_URI` configured with Atlas credentials

### `src/app.ts`

- Load `dotenv/config` at the top
- Create Express app
- Configure middleware stack in order:
  1. `cors({ origin: process.env.CLIENT_URL, credentials: true })`
  2. `express.json({ limit: '10mb' })`
  3. `express.urlencoded({ extended: true })`
- Mount route routers under `/api/v1`:
  - `/api/v1/auth` → authRoutes
  - `/api/v1/events` → eventRoutes
  - `/api/v1/reviews` → reviewRoutes
  - `/api/v1/users` → userRoutes
- Mount centralized error handler **after** all routes
- Export the app

**Express 5 note**: `req.query` parsing is disabled by default in Express 5. Configure with `app.set('query parser', 'extended')` or use the `qs` middleware explicitly so that filter query params on `GET /events` are parsed correctly.

### `src/server.ts`

- Import `app` and `connectDB`
- Call `connectDB()` first (await)
- Then call `app.listen(PORT)`
- Log the running port

### `src/middleware/errorMiddleware.ts`

- Export `errorHandler(err, req, res, next)` middleware
- Handle error types:
  - **Zod errors** (name === 'ZodError'): return 422 with field-level errors mapped from `err.issues`
  - **Mongoose ValidationError**: return 400 with messages
  - **Mongoose CastError** (invalid ObjectId): return 400 "Invalid ID format"
  - **JsonWebTokenError**: return 401 "Invalid token"
  - **TokenExpiredError**: return 401 "Token expired"
  - **Duplicate key error** (code 11000): return 409 "Email already in use"
  - **Custom operational errors** (`err.statusCode`): use that status code
  - **Default**: return 500 "Internal server error"
- Response shape: `{ success: false, message: "...", errors?: [...] }`

### `src/middleware/validateMiddleware.ts`

- Export `validate(schema)` function that returns middleware
- Validate `req.body` against the Zod schema
- On success: replace `req.body` with parsed/sanitized data, call `next()`
- On failure: call `next(error)` with the Zod error attached

### `src/middleware/authMiddleware.ts`

- Export `protect` middleware
- Read `Authorization` header, extract Bearer token
- If no token: call `next()` without setting `req.user` (route-level auth check handles rejection)
- If token present: verify with `jwt.verify(token, JWT_SECRET)`
- Fetch user from DB using decoded `id` (select: name, email, role, avatar)
- If user not found: call `next()` (invalid token)
- Attach to `req.user`: `{ id: user._id.toString(), name: user.name, email: user.email, role: user.role }`
- Call `next()`
- Errors: call `next()` silently (let route-level check handle auth rejection)

### `src/middleware/roleMiddleware.ts`

- Export `requireRole(...roles: string[])` middleware
- Check `req.user` exists and `req.user.role` is in the allowed roles
- If not: return 403 "Not authorized"
- Export `requireOwnerOrAdmin(getOwnerId: (req) => string)` middleware
- Check `req.user` exists AND (`req.user.role === 'admin'` OR `req.user.id === getOwnerId(req)`)
- If not: return 403 "Not authorized"

### `src/types/express.d.ts`

```ts
interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

declare namespace Express {
  interface Request {
    user?: AuthUser;
  }
}
```

---

## Phase 2: Auth Routes, Token Flow, and User Session

### Goal

Implement user registration, login, and session restoration. Seed demo users.

### Files to Create

```
src/
├── models/
│   └── User.ts
├── validations/
│   └── authValidation.ts
├── controllers/
│   └── authController.ts
├── routes/
│   └── authRoutes.ts
└── utils/
    └── jwt.ts
```

### `src/models/User.ts`

Mongoose schema fields:
- `name`: String, required, trim, minlength 2
- `email`: String, required, unique, lowercase, trim
- `password`: String, required, minlength 8, **`select: false`** (never returned by default)
- `role`: String, enum `["user", "admin"]`, default `"user"`
- `avatar`: String, default `""`
- `timestamps: true` (auto createdAt, updatedAt)

Pre-save hook:
- If `password` is modified: hash with `bcryptjs.hash(password, 10)`
- Call `next()`

Instance method:
- `comparePassword(candidatePassword)`: uses `bcryptjs.compare()`

Export type `UserDocument = InferSchemaType<typeof userSchema>` and model `User`.

### `src/utils/jwt.ts`

- `signToken(payload: { id: string; email: string; role: string }): string`
  - Uses `jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })`
- `verifyToken(token: string): { id: string; email: string; role: string }`
  - Uses `jwt.verify(token, JWT_SECRET)` and returns decoded payload

### `src/validations/authValidation.ts`

```ts
// Register: confirmPassword is OPTIONAL (frontend doesn't send it)
export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Valid email is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string().optional(),
}).refine(
  (data) => !data.confirmPassword || data.password === data.confirmPassword,
  { path: ["confirmPassword"], message: "Passwords do not match" }
);

export const loginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
```

**Mismatch #1 resolution**: `confirmPassword` is optional. The frontend validates passwords match client-side and never sends this field. If someone sends it, it's validated against `password`.

### `src/controllers/authController.ts`

#### `registerUser`
1. Validate `req.body` with `registerSchema` (already done by middleware)
2. Check if email exists in DB → if yes, return 409 "Email already in use"
3. Create user: `User.create({ name, email, password })`
4. Generate JWT: `signToken({ id: user._id, email: user.email, role: user.role })`
5. Return 201:
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "token": "jwt-token",
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "avatar": ""
    }
  }
}
```

#### `loginUser`
1. Validate `req.body` with `loginSchema`
2. Find user by email **with password included**: `User.findOne({ email }).select('+password')`
3. If not found OR password doesn't match: return 401 "Invalid email or password"
4. Generate JWT
5. Return 200 with same shape as register

#### `getCurrentUser`
1. `req.user` is already set by auth middleware
2. Fetch fresh user from DB: `User.findById(req.user.id)`
3. Return 200:
```json
{
  "success": true,
  "message": "Current user fetched successfully",
  "data": {
    "user": {
      "id": "user_id",
      "name": "Demo User",
      "email": "demo@eventnest.com",
      "role": "user",
      "avatar": ""
    }
  }
}
```

### `src/routes/authRoutes.ts`

```ts
router.post('/register', validate(registerSchema), registerUser);
router.post('/login', validate(loginSchema), loginUser);
router.get('/me', protect, getCurrentUser);
```

---

## Phase 3: Event Models, Routes, and CRUD

### Goal

Implement Event and Review models, event CRUD with filtering/pagination, featured events, related events, and review routes.

### Files to Create

```
src/
├── models/
│   └── Event.ts
│   └── Review.ts
├── validations/
│   ├── eventValidation.ts
│   └── reviewValidation.ts
├── controllers/
│   └── eventController.ts
│   └── reviewController.ts
├── routes/
│   └── eventRoutes.ts
│   └── reviewRoutes.ts
└── utils/
    └── apiFeatures.ts
```

### `src/models/Review.ts`

Mongoose schema fields:
- `event`: ObjectId, ref "Event", required
- `user`: ObjectId, ref "User", required
- `rating`: Number, required, min 1, max 5
- `comment`: String, required, maxlength 500
- `timestamps: true`

Index: `{ event: 1, user: 1 }`, unique: true (one review per user per event)

### `src/models/Event.ts`

Mongoose schema fields:
- `title`: String, required, minlength 5, maxlength 100
- `shortDescription`: String, required, maxlength 150
- `fullDescription`: String, required
- `date`: Date, required
- `location`: String, required
- `price`: Number, required, min 0, default 0
- `category`: String, required, enum: `["DevOps", "AI/ML", "Web Development", "Mobile", "Cloud", "Security", "Other"]`
- `images`: `[String]`, default `[]`
- `organizer`: ObjectId, ref "User", required
- `capacity`: Number, default 100
- `ratingAverage`: Number, default 0, min 0, max 5
- `reviews`: `[ObjectId]`, ref "Review"
- `timestamps: true`

Indexes: `{ category: 1 }`, `{ date: 1 }`, `{ createdAt: -1 }`

### `src/validations/eventValidation.ts`

```ts
const categories = ["DevOps", "AI/ML", "Web Development", "Mobile", "Cloud", "Security", "Other"] as const;

export const createEventSchema = z.object({
  title: z.string().min(5).max(100),
  shortDescription: z.string().min(1).max(150),
  fullDescription: z.string().min(50),
  date: z.coerce.date(),
  location: z.string().min(1),
  price: z.coerce.number().min(0),
  category: z.enum(categories),
  capacity: z.coerce.number().min(1).optional().default(100),
  images: z.array(z.string().url()).optional().default([]),
  image: z.string().url().optional(),
}).transform((data) => ({
  ...data,
  images: data.images?.length ? data.images : data.image ? [data.image] : [],
}));
```

**Mismatch #4 resolution**: The Zod `.transform()` normalizes a single `image` string into `images[]`. The frontend add-event form sends `image: string`; this gets converted to `["that-url"]` before reaching the database.

### `src/validations/reviewValidation.ts`

```ts
export const createReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().min(3).max(500),
});
```

### `src/utils/apiFeatures.ts`

Class or set of helper functions for building Mongoose queries:

```
class ApiFeatures {
  constructor(query, queryString)

  search()          // text search on title, shortDescription, fullDescription
  filter()          // category, location, minPrice, maxPrice
  sort()            // sort by date, price, ratingAverage with order (asc/desc)
  paginate()        // skip/limit from page and limit params
  getFilters()      // for building the Mongoose query object
}
```

- `search()`: If `search` param exists, add `$or` regex conditions on `title`, `shortDescription`, `fullDescription` (case-insensitive)
- `filter()`: Build `{ category, location: { $regex: location, $options: 'i' }, price: { $gte: minPrice, $lte: maxPrice } }`
- `sort()`: Default sort by `date` ascending. Map sort param to Mongoose sort string
- `paginate()`: Calculate `skip` and `limit` from `page` (default 1) and `limit` (default 8)

### `src/controllers/eventController.ts`

#### `getAllEvents` — `GET /events`
1. Build query features from `req.query` (search, category, location, minPrice, maxPrice, sort, order, page, limit)
2. Count total matching documents for pagination
3. Apply search → filter → sort → paginate to Event query
4. Populate `organizer` with `{ _id, name }` (minimal)
5. Return:
```json
{
  "success": true,
  "message": "Events fetched successfully",
  "data": {
    "items": [
      {
        "_id": "...",
        "title": "...",
        "shortDescription": "...",
        "date": "...",
        "location": "...",
        "price": 0,
        "category": "DevOps",
        "images": ["..."],
        "ratingAverage": 4.8,
        "capacity": 150,
        "organizerId": "user_id",
        "organizer": { "_id": "user_id", "name": "EventNest Community" }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 8,
      "totalItems": 20,
      "totalPages": 3,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

**Mismatch #5 resolution**: Include `organizerId` mapped from `organizer` for frontend compatibility.

#### `getFeaturedEvents` — `GET /events/featured`
1. Query events where `date >= now`
2. Sort by `date` ascending
3. Limit to 4
4. Return same item shape as listing

#### `getEventById` — `GET /events/:id`
1. Find event by ID
2. Populate `organizer` with `{ _id, name, email }`
3. Populate `reviews` with user info, sort by newest first
4. Return:
```json
{
  "success": true,
  "message": "Event fetched successfully",
  "data": {
    "event": {
      "_id": "...",
      "title": "...",
      "shortDescription": "...",
      "fullDescription": "...",
      "date": "...",
      "time": "",
      "location": "...",
      "price": 0,
      "category": "DevOps",
      "images": ["..."],
      "ratingAverage": 4.8,
      "capacity": 150,
      "organizerName": "EventNest Community",
      "organizer": { "_id": "...", "name": "EventNest Community", "email": "..." },
      "reviews": [
        {
          "_id": "...",
          "userName": "Mahin Hasan",
          "rating": 5,
          "comment": "...",
          "date": "2026-06-20T00:00:00.000Z",
          "createdAt": "2026-06-20T00:00:00.000Z",
          "user": { "_id": "...", "name": "Mahin Hasan" }
        }
      ]
    }
  }
}
```

**Mismatch #2 and #3 resolution**: Include `organizerName` (from populated `organizer.name`), `time` (empty string), `userName` (from populated `user.name`), and `date` (alias for `createdAt`).

#### `createEvent` — `POST /events`
1. User is authenticated (from `protect` middleware)
2. Create event with `organizer: req.user.id`
3. Return 201:
```json
{
  "success": true,
  "message": "Event created successfully",
  "data": {
    "event": {
      "_id": "new_event_id",
      "title": "Dhaka DevOps Meetup 2026"
    }
  }
}
```

#### `updateEvent` — `PUT /events/:id`
1. Find event by ID
2. If not found: 404
3. Check owner or admin (`requireOwnerOrAdmin`)
4. Apply validated updates
5. Return updated event

#### `deleteEvent` — `DELETE /events/:id`
1. Find event by ID
2. If not found: 404
3. Check owner or admin
4. Delete associated reviews: `Review.deleteMany({ event: id })`
5. Delete event
6. Return:
```json
{
  "success": true,
  "message": "Event deleted successfully",
  "data": null
}
```

#### `getRelatedEvents` — `GET /events/related/:id`
1. Find current event to get its category
2. Query events with same category, excluding current ID
3. Sort by nearest upcoming date
4. Limit to 3 or 4
5. Return array of event items

### `src/controllers/reviewController.ts`

#### `getReviewsByEvent` — `GET /reviews/event/:eventId`
1. Find all reviews for the event
2. Populate user name
3. Calculate average rating and total count
4. Return:
```json
{
  "success": true,
  "message": "Reviews fetched successfully",
  "data": {
    "items": [...],
    "averageRating": 4.8,
    "totalReviews": 12
  }
}
```

#### `createReviewForEvent` — `POST /reviews/event/:eventId`
1. User is authenticated
2. Validate request body
3. Ensure event exists
4. Check if user already reviewed this event → if yes, update (upsert behavior)
5. Create review
6. Add review ID to event's `reviews` array
7. Recalculate event `ratingAverage`
8. Return 201:
```json
{
  "success": true,
  "message": "Review submitted successfully",
  "data": {
    "review": {
      "_id": "...",
      "rating": 5,
      "comment": "..."
    }
  }
}
```

#### `deleteReview` — `DELETE /reviews/:id`
1. User is authenticated
2. Find review by ID
3. If not found: 404
4. Check review owner or admin
5. Remove review from event's `reviews` array
6. Recalculate event `ratingAverage`
7. Delete review
8. Return success

#### Helper: `recalculateEventRating(eventId)`
1. Aggregate reviews for the event: `{ $group: { _id: null, avg: { $avg: "$rating" } } }`
2. Update event's `ratingAverage` to the computed average (or 0 if no reviews)
3. Save event

### `src/routes/eventRoutes.ts`

```ts
router.get('/featured', getFeaturedEvents);
router.get('/related/:id', getRelatedEvents);
router.get('/', getAllEvents);
router.get('/:id', getEventById);
router.post('/', protect, validate(createEventSchema), createEvent);
router.put('/:id', protect, requireOwnerOrAdmin(...), validate(createEventSchema), updateEvent);
router.delete('/:id', protect, requireOwnerOrAdmin(...), deleteEvent);
```

**Route ordering note**: `/featured` and `/related/:id` must be defined before `/:id` to avoid path conflicts.

### `src/routes/reviewRoutes.ts`

```ts
router.get('/event/:eventId', getReviewsByEvent);
router.post('/event/:eventId', protect, validate(createReviewSchema), createReviewForEvent);
router.delete('/:id', protect, deleteReview);
```

---

## Phase 4: Manage Events, User Routes, Seed Data

### Goal

Implement user event management (for the `/events/manage` page), admin routes, and seed script for demo data.

### Files to Create

```
src/
├── controllers/
│   └── userController.ts
├── routes/
│   └── userRoutes.ts
└── utils/
    └── seed.ts
```

### `src/controllers/userController.ts`

#### `getCurrentUserEvents` — `GET /users/events`
1. User is authenticated (from `protect` middleware)
2. If `req.user.role === 'admin'`: query ALL events
3. If regular user: query events where `organizer === req.user.id`
4. Populate organizer with minimal info
5. Return:
```json
{
  "success": true,
  "message": "User events fetched successfully",
  "data": {
    "items": [
      {
        "_id": "...",
        "title": "...",
        "shortDescription": "...",
        "date": "...",
        "location": "...",
        "price": 0,
        "category": "DevOps",
        "images": ["..."],
        "ratingAverage": 4.8,
        "capacity": 150,
        "organizerId": "user_id",
        "organizer": { "_id": "user_id", "name": "..." }
      }
    ]
  }
}
```

**Mismatch #5 resolution**: Include `organizerId` field mapped from `organizer` for the manage page's client-side filtering.

#### `getAllUsers` — `GET /users/all`
1. User must be admin (from `requireRole('admin')`)
2. Query all users, exclude passwords
3. Return array of users

### `src/routes/userRoutes.ts`

```ts
router.get('/events', protect, getCurrentUserEvents);
router.get('/all', protect, requireRole('admin'), getAllUsers);
```

### `src/utils/seed.ts`

Standalone script runnable via `npx tsx src/utils/seed.ts`.

#### Demo Users

```ts
const users = [
  {
    name: "Demo User",
    email: "demo@eventnest.com",
    password: "demo123456",  // will be hashed by pre-save hook
    role: "user",
    avatar: ""
  },
  {
    name: "Admin User",
    email: "admin@eventnest.com",
    password: "admin123456",
    role: "admin",
    avatar: ""
  }
];
```

#### Demo Events (12 events across categories)

Categories and approximate distribution:
- DevOps: 2-3 events
- AI/ML: 2-3 events
- Web Development: 2 events
- Cloud: 2 events
- Security: 1-2 events
- Mobile: 1 event

All with future dates (August–November 2026), mix of free and paid, spread across different locations (Dhaka, Online, Singapore, Kuala Lumpur, Bangkok, Chattogram).

Use realistic titles and descriptions matching the frontend's hardcoded examples for visual consistency.

#### Demo Reviews

Add 2-3 reviews for at least 3 different events, using different users. Include varied ratings (4, 5).

#### Script Behavior

1. Connect to MongoDB
2. Drop existing collections (User, Event, Review)
3. Insert users
4. Insert events (assign organizers randomly between the two users)
5. Insert reviews
6. Log summary
7. Disconnect

---

## Phase 5: Frontend-Backend Verification

### Goal

Verify every frontend page can communicate with the backend cleanly. Test each endpoint and confirm response shapes match frontend expectations.

### Verification Matrix

| # | Page | Endpoint(s) | Response Shape Verification | Mismatch Handled |
|---|---|---|---|---|
| 1 | `/login` | `POST /auth/login` | Returns `{ success, data: { token, user: { id, name, email, role, avatar } } }` — matches `AuthUser` type | — |
| 2 | `/register` | `POST /auth/register` | Accepts `{ name, email, password }` without `confirmPassword` — matches `RegisterPayload` | #1 |
| 3 | `AuthProvider` init | `GET /auth/me` | Returns user object for session restore | — |
| 4 | `/events` | `GET /events?search=&category=&...` | Returns `items[]` with `_id`, `images[]`, `ratingAverage` matching `EventItem` | #6 |
| 5 | `/events/[id]` | `GET /events/:id` | Returns `organizerName`, `reviews[].userName`, `reviews[].date` | #2, #3 |
| 6 | `/events/add` | `POST /events` | Accepts `image` string, normalizes to `images[]`; returns created event `_id` | #4 |
| 7 | `/events/manage` | `GET /users/events` | Returns `organizerId` field on each item | #5 |
| 8 | `/events/manage` | `DELETE /events/:id` | Works for owner or admin | — |
| 9 | Event details | `GET /events/related/:id` | Returns same-category events with `_id`, `title`, `date`, `location`, `price`, `category`, `images` | — |
| 10 | Reviews | `GET /reviews/event/:eventId` | Returns reviews with `userName`, `date`, `rating`, `comment` | #3 |
| 11 | Reviews | `POST /reviews/event/:eventId` | Authenticated creation with `{ rating, comment }` | — |
| 12 | Admin | `GET /users/all` | Returns all users, admin only | — |

### Manual Test Sequence

1. Start server: `npx tsx src/server.ts`
2. Seed database: `npx tsx src/utils/seed.ts`
3. Test auth flow:
   - `POST /api/v1/auth/register` with `{ name, email, password }` → 201 with token
   - `POST /api/v1/auth/login` with demo credentials → 200 with token
   - `GET /api/v1/auth/me` with Bearer token → 200 with user
4. Test event flow:
   - `GET /api/v1/events` → 200 with paginated items
   - `GET /api/v1/events/featured` → 200 with 4 featured events
   - `GET /api/v1/events/:id` → 200 with full details + organizerName + reviews
   - `POST /api/v1/events` with token → 201 with event id
   - `PUT /api/v1/events/:id` → 200 (owner only)
   - `DELETE /api/v1/events/:id` → 200 (owner or admin)
   - `GET /api/v1/events/related/:id` → 200 with same-category events
5. Test review flow:
   - `GET /api/v1/reviews/event/:eventId` → 200 with reviews
   - `POST /api/v1/reviews/event/:eventId` with token → 201
   - `DELETE /api/v1/reviews/:id` → 200 (owner or admin)
6. Test user flow:
   - `GET /api/v1/users/events` with token → 200 (filtered by owner, or all for admin)
   - `GET /api/v1/users/all` with admin token → 200 (all users)

---

## Server Startup Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "seed": "tsx src/utils/seed.ts"
  }
}
```

---

## Dependencies Already Installed (from package.json)

- `express@^5.2.1` — **Express 5** (native async error handling)
- `mongoose@^9.7.4`
- `cors@^2.8.6`
- `dotenv@^17.4.2`
- `jsonwebtoken@^9.0.3`
- `bcryptjs@^3.0.3`
- `zod@^4.4.3`
- `tsx@^4.23.1` (dev)
- `typescript@^7.0.2` (dev)
- All necessary `@types/*` packages

No additional packages need to be installed.

---

## Express 5 Considerations

1. **Native async error handling**: Async route handlers that throw will automatically forward to the error handler. No need for `try-catch` wrappers in every controller function.
2. **`req.query` parsing**: By default, Express 5 does not parse query strings. Configure with `app.set('query parser', 'extended')` in `app.ts` so that `req.query` returns parsed objects for filter params.
3. **Path matching**: Uses `path-to-regexp` v8. Route patterns like `/events/related/:id` and `/events/:id` work as expected. Static segments (`/featured`, `/related`) are matched before parameterized (`/:id`) if defined first.
4. **`res.redirect()`**: Default status changed to 303 in Express 5. Not heavily used in API routes.
