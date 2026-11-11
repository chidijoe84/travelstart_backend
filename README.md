# Travel Start Backend

Node.js + Express + MySQL (MariaDB) API for the Travel Start / Residency Hotel
booking frontend. Plain `mysql2` with parameterized queries (no ORM).

The React app in the repository root talks to this API at
`http://localhost:5000/api/v1` (configurable via `REACT_APP_API_BASE_URL`).

## Requirements

- Node.js 18+ (developed on 20.x)
- MySQL 8 or MariaDB 10.4+

## Setup

```bash
cd backend
npm install
```

1. Copy the environment template and adjust if needed:

   ```bash
   copy .env.example .env      # Windows
   cp .env.example .env        # macOS/Linux
   ```

2. Create the database objects and load the seed data:

   ```bash
   npm run db:import     # runs schema.sql, seed.sql then states_lgas_wards.sql
   npm run db:check      # prints table row counts
   ```

3. Create the bootstrap admin account (uses `ADMIN_EMAIL` / `ADMIN_PASSWORD`):

   ```bash
   npm run db:admin
   ```

4. Start the server:

   ```bash
   npm run dev           # nodemon, auto-reload
   npm start             # plain node
   ```

Health check: <http://localhost:5000/api/v1/health>

## Environment variables (`backend/.env`)

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `5000` | HTTP port |
| `NODE_ENV` | `development` | Logging/error verbosity |
| `DB_HOST` | `localhost` | MySQL host |
| `DB_PORT` | `3306` | MySQL port |
| `DB_USER` | `root` | MySQL user |
| `DB_PASSWORD` | *(empty)* | MySQL password |
| `DB_NAME` | `travelstart` | Database name |
| `CORS_ORIGINS` | `http://localhost:3000,http://127.0.0.1:3000` | Comma-separated allowed origins; include `https://travelstartagency.com,https://www.travelstartagency.com` in production |
| `JWT_SECRET` | *(set me)* | Admin token signing key |
| `JWT_EXPIRES_IN` | `1d` | Admin token lifetime |
| `ADMIN_NAME` | `Travel Start Admin` | Bootstrap admin display name |
| `ADMIN_EMAIL` | `admin@travelstart.com` | Bootstrap admin login |
| `ADMIN_PASSWORD` | `Admin@1234` | Bootstrap admin password |
| `CLOUDINARY_CLOUD_NAME` | *(set me)* | Cloudinary cloud name (hotel, room, and property listing images) |
| `CLOUDINARY_API_KEY` | *(set me)* | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | *(set me)* | Cloudinary API secret |
| `SMTP_HOST` | *(optional)* | SMTP server host for booking/listing emails |
| `SMTP_PORT` | `587` | SMTP server port |
| `SMTP_SECURE` | `false` | Set to `true` for implicit TLS (usually port 465) |
| `SMTP_USER` | *(optional)* | SMTP login, usually `bookings@travelstartagency.com` |
| `SMTP_PASS` | *(optional)* | SMTP password or app password |
| `MAIL_FROM` | `"Travel Start Hotels" <bookings@travelstartagency.com>` | Sender name and address |
| `BOOKINGS_EMAIL` | `bookings@travelstartagency.com` | Official inbox that receives a copy of every notification |

> Email notifications are sent after a reservation or property listing is
> saved. If the SMTP variables are not set, the records are still saved and
> the email step is skipped with a server warning.

For the official Travel Start mailbox, the SMTP settings are typically:

```env
SMTP_HOST=mail.travelstartagency.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=bookings@travelstartagency.com
SMTP_PASS=your-mailbox-password
MAIL_FROM="Travel Start Hotels <bookings@travelstartagency.com>"
BOOKINGS_EMAIL=bookings@travelstartagency.com
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start with nodemon |
| `npm start` | Start with node |
| `npm run db:import` | Import `schema.sql` + `seed.sql` + `states_lgas_wards.sql` |
| `npm run db:check` | Verify connection and show row counts |
| `npm run db:admin` | Create/update the bootstrap admin |
| `npm run test:smoke` | Boot the app and exercise every endpoint |

## API

All routes are prefixed with `/api/v1`. Public routes are consumed by the
React frontend; `/admin/*` routes require an `Authorization: Bearer <jwt>`
header obtained from `POST /admin/auth/login`.

### Public (frontend-facing)

| Method | Path | Description |
| --- | --- | --- |
| GET | `/health` | Service + database status |
| POST | `/registrations/createUser` | Guest registration |
| POST | `/registrations/accessApp` | Guest login |
| GET | `/registrations/hotels` | List hotels (`sourceType`, `hotelGroupName`, `location`, `genFilter`) |
| GET | `/registrations/states` | List Nigerian states (sorted by name) |
| GET | `/registrations/lgas` | List LGAs (`stateId` optional filter, sorted by name) |
| GET | `/hotels/:hotelId/roomAvailabilitySummary` | Rooms + availability (`startDate`, `endDate`, `sourceType`) |
| GET | `/registrations/getGuestFavoriteHotels/:tipTopGoGuestId` | Guest's favourite hotels |
| POST | `/registrations/addFavoriteHotel` | Like/unlike a hotel (`type`: `like`/`unlike`) |
| POST | `/registrations/createSubscribers` | Newsletter signup |
| POST | `/guests/makeWebReservation` | Create a reservation after payment |

### Admin

| Method | Path |
| --- | --- |
| POST | `/admin/auth/login` |
| GET | `/admin/auth/me` |
| GET | `/admin/hotels`, `/admin/hotels/:hotelId` |
| POST/PUT/DELETE | `/admin/hotels`, `/admin/hotels/:hotelId` |
| GET | `/admin/room-types`, `/admin/room-types/:roomTypeId` |
| POST/PUT/DELETE | `/admin/room-types`, `/admin/room-types/:roomTypeId` |
| GET | `/admin/tax-levies`, `/admin/tax-levies/:levyId` |
| POST/PUT/DELETE | `/admin/tax-levies`, `/admin/tax-levies/:levyId` |
| GET | `/admin/reservations`, `/admin/reservations/:reservationId` |
| PATCH | `/admin/reservations/:reservationId/status` |
| DELETE | `/admin/reservations/:reservationId` |
| GET | `/admin/guests`, `/admin/guests/:guestId` |
| GET | `/admin/subscribers` |
| DELETE | `/admin/subscribers/:subscriberId` |
| GET | `/admin/stats` |

## Response-contract notes

These shapes are matched to what the frontend already expects:

- `POST /registrations/createUser` → `{ success, message: "Registrated Successfully", guestDetails }`.
- `POST /registrations/createSubscribers` → `{ success, message: "subscription created successfully" }`.
- `POST /registrations/accessApp` → `{ success, message, guestDetails }`; `guestDetails.active` is the string `"true"`/`"false"`.
- Guest login with an unknown email returns `{ success: false, message: "user does not exist" }`.
- `GET /registrations/hotels` returns a bare JSON array of camelCase hotels, each including `amenities`, `roomTypeImages` and `taxLevies`.
- `POST /guests/makeWebReservation` → `{ message, bookingCode, reservationId }`.

## Project layout

```
backend/
  app.js                 Express app + server bootstrap
  config/db.js           mysql2 connection pool
  controllers/           Route handlers
  middleware/            auth, validation, error handling
  routes/                Express routers
  utils/                 ApiError, asyncHandler, mappers, id generator
  database/              schema.sql, seed.sql, states_lgas_wards.sql
  scripts/               db import/check, admin seed, smoke test
```
"# travelstart_backend" 
