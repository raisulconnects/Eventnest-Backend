# EventNest — Tech Event & Meetup Board (Backend)

A RESTful API built with Express 5, TypeScript, and MongoDB/Mongoose for the EventNest event platform. Handles authentication, event management, reviews, reservations, and contact form submissions.

## Overview

This backend powers the EventNest frontend client. It provides a versioned REST API (`/api/v1`) with JWT-based authentication, role-based access control (user/admin), Zod request validation, and a centralized error handler. The database is seeded with realistic demo data including users, events, reviews, and reservations.

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| Node.js | 18+ | Runtime |
| Express | 5 | Web framework |
| TypeScript | 7 | Type safety (strict mode) |
| MongoDB Atlas | — | Cloud database |
| Mongoose | 9 | ODM / schema modeling |
| JSON Web Tokens | 9 | Authentication tokens |
| bcryptjs | 3 | Password hashing |
| Zod | 4 | Request body validation |
| tsx | 4 | TypeScript dev server with watch mode |

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm, yarn, or pnpm
- A MongoDB Atlas cluster (or local MongoDB instance)

### Installation

```bash
git clone <repository-url>
cd eventnest-backend
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/eventnest
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
```

| Variable | Description |
|---|---|
| `PORT` | Server listen port |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `JWT_EXPIRES_IN` | Token expiry duration (e.g. `7d`) |
| `CLIENT_URL` | Allowed CORS origin (frontend URL) |

### Running Locally

```bash
# Development (hot reload via tsx watch)
npm run dev

# Production build + start
npm run build
npm start
```

The server starts at `http://localhost:5000`.

### Seeding the Database

```bash
npx tsx src/utils/seed.ts
```

This clears all existing data and creates:

- 2 users (demo + admin)
- 12 events across all categories
- 7 reviews
- 3 reservations

**Seeded Credentials:**

| Role | Email | Password |
|---|---|---|
| User | `demo@eventnest.com` | `demo123456` |
| Admin | `admin@eventnest.com` | `admin123456` |

## Project Structure

```
src/
├── app.ts                          # Express app setup + route mounting
├── server.ts                       # Entry point (DB connect + listen)
├── config/
│   └── db.ts                       # MongoDB connection
├── controllers/
│   ├── authController.ts           # Register, login, get me
│   ├── eventController.ts          # CRUD, featured, related, search
│   ├── reviewController.ts         # Fetch, create, delete reviews
│   ├── reservationController.ts    # Reserve, cancel, status, attendees
│   ├── contactController.ts        # Submit + admin list/delete
│   └── userController.ts           # User events, admin user list
├── middleware/
│   ├── authMiddleware.ts           # JWT verification + req.user
│   ├── roleMiddleware.ts           # requireRole(), requireOwnerOrAdmin()
│   ├── validateMiddleware.ts       # Zod schema validation
│   └── errorMiddleware.ts          # Global error handler
├── models/
│   ├── User.ts
│   ├── Event.ts
│   ├── Review.ts
│   ├── Reservation.ts
│   └── ContactSubmission.ts
├── routes/
│   ├── authRoutes.ts
│   ├── eventRoutes.ts
│   ├── reviewRoutes.ts
│   ├── userRoutes.ts
│   ├── reservationRoutes.ts
│   └── contactRoutes.ts
├── types/
│   └── express.d.ts                # Express Request type augmentation
├── utils/
│   ├── jwt.ts                      # Token signing/verification
│   ├── apiFeatures.ts              # Filter, sort, pagination utilities
│   └── seed.ts                     # Database seeding script
└── validations/
    ├── authValidation.ts
    ├── eventValidation.ts
    ├── reviewValidation.ts
    ├── reservationValidation.ts
    └── contactValidation.ts
```

## API Reference

**Base URL:** `http://localhost:5000/api/v1`

All responses follow the format:

```json
{
  "success": true,
  "message": "Description",
  "data": { ... }
}
```

### Auth Routes (`/auth`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Create new user account |
| POST | `/auth/login` | Public | Login and receive JWT |
| GET | `/auth/me` | User | Get current user profile |

### Event Routes (`/events`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/events` | Public | List events (filterable, sortable, paginated) |
| GET | `/events/featured` | Public | Get 4 featured upcoming events |
| GET | `/events/related/:id` | Public | Get related events (same category) |
| GET | `/events/:id` | Public | Get single event by ID |
| POST | `/events` | User | Create a new event |
| PUT | `/events/:id` | Owner/Admin | Update an event |
| DELETE | `/events/:id` | Owner/Admin | Delete an event |

#### Query Parameters for `GET /events`

| Param | Type | Description |
|---|---|---|
| `search` | string | Search in title, shortDescription, fullDescription |
| `category` | string | Filter by category |
| `location` | string | Filter by location |
| `minPrice` | number | Minimum price |
| `maxPrice` | number | Maximum price |
| `startDate` | string | Events on or after this date |
| `endDate` | string | Events on or before this date |
| `sort` | string | Sort field: `date`, `price`, `ratingAverage` |
| `order` | string | Sort order: `asc` or `desc` |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 8, max: 50) |

### Review Routes (`/reviews`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/reviews/event/:eventId` | Public | Get all reviews for an event |
| POST | `/reviews/event/:eventId` | User | Add a review (one per user per event) |
| DELETE | `/reviews/:id` | Owner/Admin | Delete a review |

### Reservation Routes (`/reservations`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/reservations/event/:eventId` | User | Reserve spot(s) at an event |
| DELETE | `/reservations/event/:eventId` | User | Cancel reservation |
| GET | `/reservations/event/:eventId/status` | User | Check if current user has reserved |
| GET | `/reservations/event/:eventId/attendees` | Public | Get attendee count and capacity |
| GET | `/reservations/mine` | User | Get current user's reservations |

### Contact Routes (`/contacts`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/contacts` | Public | Submit contact form |
| GET | `/contacts` | Admin | List all submissions |
| DELETE | `/contacts/:id` | Admin | Delete a submission |

### User Routes (`/users`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/users/events` | User | Get events created by logged-in user |
| GET | `/users/all` | Admin | Get all users |

### Health Check

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/health` | Public | Returns `{ success: true, message: "EventNest API is running" }` |

## Data Models

### User

| Field | Type | Notes |
|---|---|---|
| name | String | Required, min 2 chars |
| email | String | Required, unique, lowercase |
| password | String | Required, min 8 chars, hashed with bcrypt (salt: 10), excluded from queries by default |
| role | String | `"user"` or `"admin"`, default: `"user"` |
| avatar | String | Default: `""` |

### Event

| Field | Type | Notes |
|---|---|---|
| title | String | Required, 5-100 chars |
| shortDescription | String | Required, max 150 chars |
| fullDescription | String | Required |
| date | Date | Required |
| location | String | Required |
| price | Number | Required, min 0, default 0 |
| category | String | Enum: DevOps, AI/ML, Web Development, Mobile, Cloud, Security, Other |
| images | [String] | Default: `[]` |
| organizer | ObjectId | Ref: User, required |
| capacity | Number | Default: 100 |
| attendeeCount | Number | Default: 0 |
| ratingAverage | Number | Default: 0, min 0, max 5 |
| reviews | [ObjectId] | Ref: Review |

### Review

| Field | Type | Notes |
|---|---|---|
| event | ObjectId | Ref: Event, required |
| user | ObjectId | Ref: Event, required |
| rating | Number | Required, 1-5 |
| comment | String | Required, max 500 chars |

Unique index on `{ event, user }` — one review per user per event.

### Reservation

| Field | Type | Notes |
|---|---|---|
| event | ObjectId | Ref: Event, required |
| user | ObjectId | Ref: User, required |
| status | String | `"confirmed"` or `"cancelled"`, default: `"confirmed"` |
| attendees | Number | Required, 1-10, default 1 |

Unique index on `{ event, user }`.

### ContactSubmission

| Field | Type | Notes |
|---|---|---|
| name | String | Required, max 100 chars |
| email | String | Required |
| subject | String | Required, max 200 chars |
| message | String | Required, max 2000 chars |

## Middleware

| Middleware | File | Purpose |
|---|---|---|
| `protect` | `authMiddleware.ts` | Verifies JWT from `Authorization: Bearer <token>` header, attaches `req.user` |
| `requireRole()` | `roleMiddleware.ts` | Checks `req.user.role` against allowed roles |
| `requireOwnerOrAdmin()` | `roleMiddleware.ts` | Allows access if user is admin or resource owner |
| `validate()` | `validateMiddleware.ts` | Validates `req.body` against a Zod schema, replaces body with parsed result |
| `errorHandler` | `errorMiddleware.ts` | Catches ZodError (422), ValidationError (400), CastError (400), JWT errors (401), duplicate key (409) |

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with hot reload (tsx watch) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run start` | Run compiled production build |
| `npx tsx src/utils/seed.ts` | Seed database with demo data |
