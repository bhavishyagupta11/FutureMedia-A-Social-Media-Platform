# Future Media - A Social Media Platform

> A full-stack social media web application with real-time messaging, image hosting, and a dark glassmorphism UI — built with React, Node.js/Express, MongoDB, and Socket.IO.

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-010101?logo=socket.io&logoColor=white)](https://socket.io/)
[![Express](https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-Media_Storage-3448C5)](https://cloudinary.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture & Workflow](#architecture--workflow)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Security](#security)
- [Performance & Optimization](#performance--optimization)
- [Challenges & Learnings](#challenges--learnings)
- [Deployment](#deployment)
- [Screenshots / Demo](#screenshots--demo)
- [Future Improvements](#future-improvements)
- [Contributing](#contributing)
- [License](#license)
- [Author](#author)

---

## Overview

Future Media - A Social Media Platform (FSM) is a production-oriented social networking platform that solves the common need for a self-hostable, full-stack social application with real-time capabilities. Users can register, publish image posts, interact with content through likes and comments, build a social graph via follows, and communicate privately through a live chat system — all within a polished dark-themed interface.

The project demonstrates a complete, end-to-end implementation of a social platform using the MERN stack, including stateless JWT authentication, cloud media management via Cloudinary, WebSocket-based real-time messaging, and a resilient server that gracefully degrades when the primary database is unavailable.

**Primary use cases:**
- Social content sharing (image posts with captions)
- Building and navigating a follower/following social graph
- Real-time one-to-one private messaging
- User discovery via search and suggestions

---

## Features

### Authentication
- User registration with unique username and email validation
- Login using username **or** email (case-insensitive regex match)
- Stateless JWT tokens with a 30-day expiry
- All API routes (except `/register` and `/login`) protected by JWT middleware
- Session state persisted in `localStorage`; cleared cleanly on logout with custom `session:cleared` browser events

### User Profiles
- Rich profile fields: display name, bio, website, and profile picture
- Profile picture upload directly to Cloudinary via multipart form
- Follow and unfollow users with duplicate-action guards (e.g., cannot follow twice)
- Self-follow prevention enforced on the server
- User search by username or display name (case-insensitive, capped at 10 results)
- Suggested users — excludes users already followed and the current user (up to 6 suggestions)
- Followers and following lists populated with full user objects

### Posts & Feed
- Create image posts (JPG, JPEG, PNG, WebP, MP4) with optional captions
- Images uploaded directly to Cloudinary and stored by URL in MongoDB
- Personalized feed: shows own posts plus posts from all followed users, sorted newest-first
- Like / unlike a post (toggle, no duplicates via `$push` / `$pull`)
- Add comments; each comment stored as an embedded subdocument on the post
- Like / unlike individual comments (toggle)
- Delete own posts (ownership verified server-side)
- Delete own comments

### Real-Time Messaging
- One-to-one chat: `accessChat` creates a new room or returns an existing one (matched by exact two-participant set)
- Persistent message history stored in MongoDB and fetched sorted by `createdAt` ascending
- `latestMessage` reference on each Chat document updated on every new message
- Socket.IO events for typing indicators (`typing` / `stop typing`)
- New messages routed to the recipient's personal Socket.IO room (keyed to MongoDB `_id`), not broadcast globally

### UI & UX
- Dark glassmorphism design: `rgba` layered backgrounds, `backdrop-filter: blur`, CSS custom properties for consistent theming
- Animated radial-gradient background with floating blur orbs
- Active navigation link highlighting via `react-router-dom`'s `useLocation`
- Toast notifications (`react-toastify`) for user-facing feedback
- Fully responsive layout with mobile-first media query at 768px
- Custom scrollbar styling
- Pages: Login, Sign Up, Home Feed, Profile, Edit Profile, Chat, Settings

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | 19 | UI framework (SPA) |
| React Router DOM | 7 | Client-side routing |
| Socket.IO Client | 4.x | Real-time WebSocket communication |
| Material UI (MUI) | 7 | UI component library |
| React Toastify | 11 | Toast notification system |
| Iconscout Unicons | 2.x | Icon set |
| Vanilla CSS | — | Custom dark theme, glassmorphism, responsive layout |

### Backend

| Technology | Version | Purpose |
|---|---|---|
| Node.js | 18+ | JavaScript runtime |
| Express | 5 | HTTP server and REST API framework |
| Mongoose | 9 | MongoDB ODM |
| Socket.IO | 4 | WebSocket server for real-time events |
| JSON Web Token | 9 | Stateless authentication tokens |
| Multer | 2 | Multipart file handling |
| multer-storage-cloudinary | 4 | Cloudinary storage engine for Multer |
| Cloudinary SDK | 1.x | Cloud media storage and delivery |
| `mongodb-memory-server` | 11 | In-memory MongoDB fallback for dev |
| dotenv | — | Environment variable management |
| nodemon | — | Dev server auto-restart |

### Database

| Store | Purpose |
|---|---|
| MongoDB Atlas | Primary data store (users, posts, chats, messages) |
| Cloudinary | Binary media assets (post images, profile pictures) |

### State Management

The frontend uses **no external state management library**. Component-level state (`useState`, `useEffect`) is combined with `localStorage`-backed session utilities (`session.js`) and a custom `apiFetch` wrapper (`api.js`) that automatically attaches the JWT `Authorization` header to every request.

---

## Architecture & Workflow

```
┌────────────────────────────────────────────────────────────────┐
│                          Browser (SPA)                         │
│  React 19 + React Router DOM 7 + Socket.IO-client              │
│  session.js (localStorage)  │  apiFetch (Bearer token)         │
└──────────────┬───────────────────────────────┬─────────────────┘
               │ REST (HTTP/JSON)               │ WebSocket (ws://)
┌──────────────▼───────────────────────────────▼─────────────────┐
│                     Express 5 Server (Node.js)                  │
│                                                                  │
│  ┌──────────────────────┐   ┌────────────────────────────────┐  │
│  │   REST API Layer     │   │     Socket.IO Server Layer     │  │
│  │  /api/auth           │   │  connection → setup → room     │  │
│  │  /api/users          │   │  join chat, new message        │  │
│  │  /api/posts          │   │  typing, stop typing           │  │
│  │  /api/chat           │   │  message received              │  │
│  └──────────┬───────────┘   └────────────────────────────────┘  │
│             │                                                     │
│  JWT Middleware (auth.js)  │  Multer + Cloudinary Storage        │
└─────────────┬───────────────────────────────────────────────────┘
              │ Mongoose ODM
┌─────────────▼──────────────┐       ┌────────────────────────────┐
│       MongoDB Atlas         │       │         Cloudinary          │
│  Collections:               │       │  Folder: fsm_posts          │
│  • users                    │       │  Formats: jpg, png,         │
│  • posts (+ comments)       │       │           webp, mp4         │
│  • chats                    │       └────────────────────────────┘
│  • messages                 │
└─────────────────────────────┘
```

### Request Flow: Creating a Post

1. Client sends `POST /api/posts` as `multipart/form-data` with an `image` file and optional `caption`.
2. `auth` middleware verifies the JWT and attaches `req.user`.
3. `multer-storage-cloudinary` streams the file to Cloudinary under the `fsm_posts` folder and attaches the resulting CDN URL to `req.file.path`.
4. `postController.createPost` saves a new `Post` document with the Cloudinary URL.
5. The saved post is returned fully populated (author info + comment author info) and rendered in the feed.

### Request Flow: Real-Time Chat

1. Client sends `POST /api/chat/access` with `{ userId }` to create or retrieve a chat room.
2. Client sends `POST /api/chat/message` to persist the message in MongoDB. The Chat document's `latestMessage` reference is updated atomically.
3. Client emits `new message` via Socket.IO with the full populated message object.
4. Server iterates `chat.participants`, and for each participant that is not the sender, emits `message received` into their personal room (each user's room is keyed to their MongoDB `_id`).
5. The recipient's client receives the event and appends the message to the conversation view.

### Database Connection Resilience

On startup, the server attempts to connect to MongoDB Atlas. If the connection fails (e.g., wrong credentials or no network in development), it automatically falls back to `mongodb-memory-server` — an in-memory MongoDB instance — so the application continues to run without crashing. A lazy-connect middleware on all `/api` routes also handles the case where the DB connection drops after startup.

---

## Project Structure

```
Future Media - A Social Media Platform/
│
├── server/                          # Express REST API + Socket.IO server
│   ├── config/
│   │   └── cloudinary.js            # Cloudinary SDK config + Multer storage engine
│   ├── controllers/
│   │   ├── authController.js        # register, login — JWT generation
│   │   ├── userController.js        # getUser, getAllUsers, updateProfile,
│   │   │                            # searchUsers, getSuggestedUsers,
│   │   │                            # followUser, unfollowUser
│   │   ├── postController.js        # createPost, getFeed, getUserPosts,
│   │   │                            # likePost, commentPost, likeComment,
│   │   │                            # deletePost, deleteComment
│   │   └── chatController.js        # accessChat, fetchChats, sendMessage,
│   │                                # getMessages
│   ├── middleware/
│   │   └── auth.js                  # JWT Bearer token verification
│   ├── models/
│   │   ├── userModel.js             # User schema (username, email, password,
│   │   │                            # displayName, bio, website,
│   │   │                            # profilePicture, followers, following)
│   │   ├── postModels.js            # Post schema with embedded Comment subdocuments
│   │   ├── chatModel.js             # Chat schema (participants[], latestMessage ref)
│   │   └── messageModel.js          # Message schema (sender, content, chat ref)
│   ├── routes/
│   │   ├── authRoutes.js            # POST /register, /login
│   │   ├── userRoutes.js            # User CRUD + follow/unfollow + search
│   │   ├── postRoutes.js            # Post CRUD + likes + comments
│   │   └── chatRoutes.js            # Chat access + message send/fetch
│   ├── utils/
│   │   ├── password.js              # scrypt-based password hashing + timing-safe comparison
│   │   └── userMapper.js            # Utility to map Mongoose docs to public-safe objects
│   ├── .env.example                 # Environment variable template
│   ├── server.js                    # App entry: Express, Socket.IO, MongoDB bootstrap
│   └── package.json
│
└── social/                          # React SPA
    └── src/
        ├── components/
        │   ├── FollowersCard/        # Sidebar suggested users + followers
        │   ├── InfoCard/             # User bio/website display card
        │   ├── LogoSearch/           # Brand logo + search bar
        │   ├── Post/                 # Single post card (likes, comments)
        │   ├── PostShare/            # New post creation form (image + caption)
        │   ├── Posts/                # Feed renderer — list of Post cards
        │   ├── ProfileCard/          # Profile header card (avatar, stats)
        │   ├── ProfileModal/         # Edit profile modal (display name, bio, etc.)
        │   ├── RightSide/            # Right sidebar (trends, share modal toggle)
        │   ├── ShareModal/           # Media sharing/upload modal
        │   └── TrendCard/            # Trending topics display
        ├── pages/
        │   ├── Auth/                 # Login, Sign Up pages + Home feed layout
        │   ├── Profile/              # Profile view page + EditProfile page
        │   ├── Chat/                 # Real-time chat page
        │   └── Settings/             # Account settings page
        ├── utils/
        │   ├── api.js                # Central apiFetch wrapper (auto-attaches JWT)
        │   └── session.js            # localStorage session helpers
        │                             # (persist, read, clear user session)
        ├── App.js                    # BrowserRouter + top navigation bar + route definitions
        ├── App.css                   # Global dark theme, glassmorphism, responsive layout
        └── index.js                  # React 19 root render
```

---

## Getting Started

### Prerequisites

- **Node.js** v18 or higher and **npm** v9 or higher
- A **MongoDB Atlas** cluster (free tier is sufficient) or a local MongoDB instance
- A **Cloudinary** account for cloud image storage

### 1. Clone the Repository

```bash
git clone https://github.com/bhavishyagupta11/FutureMedia-Social-Platform.git
cd "FutureMedia Social Platform"
```

### 2. Configure Environment Variables

```bash
cd server
cp .env.example .env
# Edit .env with your credentials (see Environment Variables section below)
```

### 3. Install Dependencies & Run the Backend

```bash
# From the /server directory
npm install
npm run dev        # Development: nodemon auto-restart on http://localhost:8080
# OR
npm start          # Production: plain node
```

### 4. Install Dependencies & Run the Frontend

```bash
# Open a new terminal, from the /social directory
cd social
npm install
npm start          # Starts Create React App dev server on http://localhost:3000
```

### 5. Build for Production (Frontend)

```bash
cd social
npm run build      # Outputs optimized static files to /social/build
```

---

## Environment Variables

Create a `.env` file in the `/server` directory based on `.env.example`:

```env
# Server
PORT=8080

# MongoDB Atlas connection string
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority

# JWT signing secret — use a long, random string in production
JWT_SECRET=replace-with-a-long-random-secret

# Comma-separated list of allowed CORS origins
CLIENT_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Cloudinary credentials (found in your Cloudinary dashboard)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

**Frontend** — create a `.env` file in `/social` if you need to override the default API base URL:

```env
REACT_APP_API_BASE_URL=http://localhost:8080
```

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | HTTP server port (defaults to `8080`) |
| `MONGO_URI` | Yes | MongoDB Atlas or local connection string |
| `JWT_SECRET` | Yes | Secret for signing JWT tokens (30-day expiry) |
| `CLIENT_ORIGINS` | Yes | Allowed CORS origins (comma-separated) |
| `CLOUDINARY_CLOUD_NAME` | Yes | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary API secret |
| `REACT_APP_API_BASE_URL` | No | Frontend API base URL (defaults to `http://localhost:8080`) |

---

## API Reference

All endpoints under `/api` require an `Authorization: Bearer <token>` header unless marked as public.

### Auth — `/api/auth`

| Method | Endpoint | Auth | Body | Description |
|---|---|---|---|---|
| `POST` | `/register` | Public | `{ username, email, password }` | Register a new user; returns user object + JWT |
| `POST` | `/login` | Public | `{ username, password }` | Login with username or email; returns user object + JWT |

### Users — `/api/users`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/` | ✅ | Get all users (passwords excluded) |
| `GET` | `/search?q=<query>` | ✅ | Search users by username or display name (max 10) |
| `GET` | `/suggestions` | ✅ | Get up to 6 users not yet followed by the current user |
| `GET` | `/:id` | ✅ | Get a user by ID; followers and following are populated |
| `PUT` | `/:id/profile` | ✅ | Update display name, bio, website; optionally upload profile picture (multipart) |
| `POST` | `/follow/:id` | ✅ | Follow a user; errors if already following or self-follow |
| `POST` | `/unfollow/:id` | ✅ | Unfollow a user; errors if not following or self-unfollow |

### Posts — `/api/posts`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/` | ✅ | Create a post (multipart: `image` field required, `caption` optional) |
| `GET` | `/feed` | ✅ | Get feed: own posts + followed users' posts, newest first |
| `GET` | `/user/:id` | ✅ | Get all posts by a specific user, newest first |
| `POST` | `/like/:id` | ✅ | Toggle like on a post (`liked: true/false` in response) |
| `POST` | `/comment/:id` | ✅ | Add a comment (`{ text }`) to a post |
| `POST` | `/like-comment/:postId/:commentId` | ✅ | Toggle like on a specific comment |
| `DELETE` | `/comment/:postId/:commentId` | ✅ | Delete a comment (no ownership check — apply server-side if needed) |
| `DELETE` | `/:id` | ✅ | Delete a post (ownership verified: only the author can delete) |

### Chat — `/api/chat`

| Method | Endpoint | Auth | Body / Params | Description |
|---|---|---|---|---|
| `POST` | `/access` | ✅ | `{ userId }` | Access or create a 1-on-1 chat room |
| `GET` | `/` | ✅ | — | Get all chats for the current user, sorted by latest activity |
| `POST` | `/message` | ✅ | `{ chatId, content }` | Send a message; updates `latestMessage` on the chat |
| `GET` | `/messages/:chatId` | ✅ | — | Fetch all messages in a chat, sorted oldest-first |

### Socket.IO Events

**Client → Server:**

| Event | Payload | Description |
|---|---|---|
| `setup` | `{ _id }` | Join the user's personal room (keyed to their MongoDB `_id`) |
| `join chat` | `chatId` (string) | Join a specific chat room |
| `new message` | Populated message object | Broadcast a new message to all participants |
| `typing` | `chatId` (string) | Notify others that the user is typing |
| `stop typing` | `chatId` (string) | Notify others that the user stopped typing |

**Server → Client:**

| Event | Payload | Description |
|---|---|---|
| `connected` | — | Confirms the user's personal room was joined |
| `message received` | Populated message object | Delivers a new message to the recipient |
| `typing` | — | A participant has started typing |
| `stop typing` | — | A participant stopped typing |

---

## Security

| Practice | Implementation |
|---|---|
| Password hashing | Node.js `crypto.scryptSync` with a random 16-byte salt, 64-byte derived key, and `N=16384` work factor. No third-party dependency for hashing. |
| Timing-safe comparison | `crypto.timingSafeEqual` used during password verification to prevent timing attacks |
| JWT authentication | Tokens signed with `HS256`, 30-day expiry; verified on every protected route via `auth.js` middleware |
| Token transport | JWT sent only via `Authorization: Bearer` header — not stored in cookies, avoiding CSRF exposure |
| CORS | Strict origin whitelist via `CLIENT_ORIGINS` env variable; dynamic origin validation with a callback pattern |
| Input validation | Required-field checks at the controller level before any database operation |
| Ownership enforcement | Post deletion verifies `post.userId === req.user.id` before allowing the operation |
| Sensitive field exclusion | Passwords and `__v` fields are explicitly excluded from all user query projections (`.select("-password -__v")`) |
| Media type restriction | Cloudinary storage configured to accept only `jpg`, `jpeg`, `png`, `webp`, and `mp4` |

---

## Performance & Optimization

| Area | Implementation |
|---|---|
| Query population | Mongoose `.populate()` is scoped to only the fields needed (`username displayName profilePicture`) rather than fetching entire documents |
| Feed query | `Post.find({ userId: { $in: ids } })` fetches all relevant posts in a single indexed query instead of N+1 queries |
| Chats sorted by activity | `Chat.find().sort({ updatedAt: -1 })` uses Mongoose's `timestamps` field to always surface the most recent conversations first |
| `latestMessage` reference | Stored as a `ref` on the Chat document so the chat list can display a preview without querying the Messages collection separately |
| Lazy DB connection | A middleware on the `/api` prefix re-initiates the MongoDB connection if it drops at runtime, and returns a `503` only if reconnection fails — preventing hard crashes |
| Single DB connect promise | A module-level `mongoConnectPromise` prevents multiple concurrent connection attempts racing each other on startup |
| File streaming | `multer-storage-cloudinary` streams uploads directly from the request to Cloudinary without buffering the entire file to disk |
| Responsive CSS | Layout shifts handled at 768px breakpoint; `backdrop-filter: blur` offloaded to the GPU for smooth glassmorphism without JS |
| Session reads | JWT and user profile data are read from `localStorage` synchronously to avoid async waterfalls on page load |

---

## Challenges & Learnings

**1. Database resilience without crashing the server**
The server needed to stay operational even when `MONGO_URI` is misconfigured or Atlas is unreachable in development. The solution was a singleton connection promise guarded by `mongoose.connection.readyState`, with an automatic fallback to `mongodb-memory-server`. This pattern eliminated the "Database Unavailable" startup error that broke early development cycles.

**2. Stateless password hashing without bcrypt**
To avoid a native binary dependency (`bcrypt`), password hashing was implemented using Node's built-in `crypto.scryptSync`. This required implementing the salt generation, key derivation, serialization format (`scrypt$sha512$<salt>$<hash>`), and timing-safe verification manually — providing a deeper understanding of cryptographic primitives.

**3. Socket.IO message routing**
Broadcasting `new message` to a room required ensuring the recipient's Socket.IO room was already joined before any message arrived. This was solved by having each client emit `setup` immediately on connection, joining a personal room keyed to their MongoDB `_id`, so targeted delivery works regardless of which server instance handles the socket.

**4. Cloudinary upload error isolation**
Upload errors from `multer-storage-cloudinary` needed to be caught inline within the route definition (not in a global error handler) so that specific Cloudinary error messages could be returned to the client. This was handled via a callback wrapper inside the route middleware chain.

**5. Session state across React re-renders**
Without a global state store, the session (user ID, token, profile fields) is persisted in `localStorage` and read synchronously via `session.js`. Custom browser events (`session:updated`, `session:cleared`) allow components listening to those events to reactively update when session data changes, avoiding prop drilling or context boilerplate.

---

## Deployment

### Backend (Render / Railway / any Node host)

1. Set all environment variables from `.env.example` in the host's environment settings.
2. Set the start command to `node server.js`.
3. Set `CLIENT_ORIGINS` to your production frontend URL.
4. MongoDB Atlas must whitelist the host's outbound IP (or use `0.0.0.0/0` for development).

### Frontend (Vercel / Netlify / any static host)

1. Set `REACT_APP_API_BASE_URL` to your deployed backend URL (e.g., `https://your-api.onrender.com`).
2. Run `npm run build` and deploy the `/social/build` directory.
3. For Vercel: connect the GitHub repo and set the root directory to `social`.
4. Configure the host to redirect all routes to `index.html` for client-side routing to work correctly.

### Database

- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) free tier (M0) is sufficient for development and small deployments.
- Enable IP whitelisting for your backend host's static IP.

---

## Screenshots / Demo

> _Screenshots and a live demo link will be added here._

| View | Preview |
|---|---|
| Home Feed | _Coming soon_ |
| Profile Page | _Coming soon_ |
| Real-Time Chat | _Coming soon_ |
| Login / Sign Up | _Coming soon_ |

---

## Future Improvements

| Feature | Notes |
|---|---|
| Refresh tokens | Replace the 30-day JWT with short-lived access tokens and refresh token rotation |
| Comment ownership check | Currently any authenticated user can delete any comment — add a server-side ownership guard |
| Pagination | Feed and post queries return all documents; cursor-based or offset pagination is needed at scale |
| Image compression | Pre-process uploads client-side (e.g., `browser-image-compression`) before sending to Cloudinary |
| Group chat | The `participants` array on the Chat model already supports more than two users; the UI and send logic need updating |
| Notifications | Persist and deliver in-app notifications for likes, comments, and follows via Socket.IO |
| Account deletion | Add a route and UI flow for users to delete their account and associated data |
| Rate limiting | Add `express-rate-limit` to auth and post creation endpoints to prevent abuse |
| Tests | Add Jest unit tests for controllers and Supertest integration tests for API routes |

---

## Contributing

Contributions are welcome. Please follow the steps below:

1. Fork the repository.
2. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Make your changes. Keep commits focused and use clear commit messages.
4. Ensure the backend starts cleanly (`npm run dev`) and the frontend compiles without errors.
5. Open a pull request against `main` with a clear description of what was changed and why.

Please open an issue first for significant changes or new features before starting work.

---

## License

This project is licensed under the [MIT License](LICENSE).

---

## Author

**Bhavishya Gupta**

- GitHub: [@bhavishyagupta11](https://github.com/bhavishyagupta11)
- Project Repository: [FutureMedia-Social-Platform](https://github.com/bhavishyagupta11/FutureMedia-Social-Platform)
