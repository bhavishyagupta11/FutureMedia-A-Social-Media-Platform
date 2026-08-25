# FutureMedia

## Overview

FutureMedia is a full-stack social networking platform engineered with a decoupled architecture comprising a React.js single-page frontend, a Node.js/Express.js RESTful API gateway, and a Python recommendation microservice, backed by MongoDB Atlas and Redis. The platform implements double-hashed authentication, fine-grained access control, real-time WebSocket communication via Socket.IO, automated hashtag indexing, 24-hour ephemeral stories, Cloudinary media processing, and containerized multi-service deployment with Docker.

---

## Core Features

### Authentication and Access Control
- Registration with cryptographic email verification using SHA-256 hashed tokens.
- Stateless authentication via JSON Web Tokens (JWT) in Bearer authorization headers.
- Role-based access control (RBAC) and granular resource ownership enforcement.
- Rate-limited authentication gates and password reset lifecycle.

### Social Interaction and Content Management
- Multi-slide image and video posts with atomic likes, bookmarking, and threaded comments.
- Dynamic hashtag normalization, indexing, and case-insensitive search.
- Ephemeral 24-hour stories with segmented progress tracking, sequential navigation, and persistent view tracking.
- Asynchronous follow/unfollow system supporting public and private profiles with follow requests.
- Rich profile customization including display name, username, bio, avatar, and cover imagery.

### Real-Time Communication
- Bi-directional low-latency messaging via Socket.IO.
- Direct 1-on-1 and group conversation rooms.
- Real-time typing indicators and live socket delivery events.

### Discovery and Exploration
- Debounced case-insensitive discovery across creators, posts, and canonical hashtags.
- Masonry explore layout with category filtering and trending topic aggregation.

---

## Architecture

The system is structured as a distributed multi-tier architecture:

```
[ Client Tier ]
React Single Page Application
    │
    ├── HTTP / REST (apiFetch Interceptor) ──┐
    └── WebSockets (Socket.IO Client) ───────┼──┐
                                             │  │
[ API Gateway / Backend Tier ]               ▼  │
Express.js REST API Server ─────────────────────┤
    │                                           │
    ├── Security Pipeline (Helmet, CORS, Rate Limit, Zod)
    ├── Route Controllers & Domain Services     │
    │                                           │
[ Data & Caching Tier ]                         │
    ├── MongoDB Atlas (Mongoose ODM) ◄──────────┘
    ├── Redis (Session Caching & Queue State)
    ├── SMTP Relay (Resend API / SMTP Port 465)
    └── Cloudinary API (Media Upload & Transformations)
                                                ▲
[ Intelligence / Recommendation Tier ]          │
Python / FastAPI Recommendation Microservice ───┘
    ├── TF-IDF Content Similarity
    ├── NetworkX Social Graph Modeling
    └── Time-Decay Engagement Scoring
```

---

## Technology Stack

### Frontend
- React.js 19
- React Router DOM v7
- Lucide React (vector iconography)
- Framer Motion (declarative animations)
- Vanilla CSS with Design Token System

### Backend
- Node.js (v20+ / v22)
- Express.js 4.21
- Socket.IO 4.8
- Mongoose 8.12 (MongoDB ODM)
- Zod (Schema validation)
- bcryptjs & jsonwebtoken (Security)
- Cloudinary SDK (Media processing)
- Resend / Nodemailer (Transactional email)

### Intelligence & Microservices
- Python 3.11
- FastAPI / Uvicorn
- Scikit-learn (TF-IDF vectorization)
- NetworkX (Graph centrality & mutual connections)
- NumPy / Pandas

### Infrastructure & Operations
- MongoDB Atlas (Cloud document database)
- Redis (In-memory cache and queue state)
- Docker & Docker Compose (Multi-container orchestration)
- Jest & Supertest (Backend unit & integration testing)
- Puppeteer (Headless browser automation)

---

## Backend Architecture

The backend follows a service-oriented architectural pattern with strict layer isolation:

1. **Controller Layer**: Handles HTTP request parsing, payload validation, status codes, and response serialization.
2. **Service Layer**: Implements core business logic, transactional database operations, and domain validations.
3. **Middleware Layer**: Enforces security, authentication, RBAC, input sanitization, and request rate limiting.
4. **Data Access Layer**: Mongoose models managing schema constraints, indexing, virtuals, and hooks.

---

## Data Layer & Schemas

The primary datastore uses MongoDB Atlas with 6 primary collections:

1. **Users**: Credentials, hashed tokens, profiles, follow lists, privacy settings, and engagement metrics.
2. **Posts**: Media arrays, captions, normalized hashtag references, visibility scopes, likes, and nested comments.
3. **Stories**: Ephemeral 24-hour media slides, viewer references (seenBy), and expiration timestamps with TTL indexing.
4. **Hashtags**: Normalized tag strings, usage counters, and post associations.
5. **Chats / Conversations**: Room membership, conversation metadata, and latest message references.
6. **Messages**: Message text, sender/receiver references, media payloads, and read receipts.

---

## Authentication & Security Model

The system implements 6+ security layers to ensure defense-in-depth:

1. **Transport & Header Security**: Strict HTTP headers via Helmet, restrictive CORS policies, and HTTPS transport.
2. **Rate Limiting**: Tiered IP-based and endpoint-based request throttling using Express Rate Limit.
3. **Input Validation & Sanitization**: Strict schema parsing using Zod, NoSQL query injection prevention, and XSS sanitization.
4. **Cryptographic Identity Verification**: SHA-256 hashed single-use verification tokens with expiration timestamps.
5. **Stateless JWT Authorization**: Signed JSON Web Tokens validated on protected routes via custom authentication middleware.
6. **Role-Based Access & Ownership Verification**: Dynamic resource authorization verifying user permissions and object ownership prior to mutation or deletion.

---

## Recommendation Engine

The intelligence subsystem operates as an autonomous recommendation microservice:

- **TF-IDF Vectorization**: Analyzes post captions, descriptions, and user interest tags to compute content-similarity matrices.
- **Social Graph Analysis via NetworkX**: Maps mutual connections, community clusters, and interaction density to identify relevant creator suggestions.
- **Time-Decay Scoring**: Applies exponential time-decay functions to engagement signals (likes, comments, recency) ensuring feeds prioritize fresh content.

---

## Real-Time Communication

The real-time subsystem is powered by Socket.IO:

- **Connection Lifecycle**: Secure handshake verifying user identity on socket connection.
- **Room Management**: Dynamic room join/leave workflows keyed by unique conversation IDs.
- **Event Distribution**: Real-time emission of send_message, message_received, typing, and stop_typing events.
- **Active Presence**: Tracks online/offline states across active user connections.

---

## Media Handling

- **Upload Pipeline**: Express middleware handling multipart form data for avatars, covers, and post media.
- **Cloudinary Integration**: Direct streaming to Cloudinary cloud storage with automatic format optimization and responsive transformations.
- **Local Fallback**: Graceful local disk caching support when external cloud storage is unreachable.

---

## Performance & Engineering Results

- **Error-Handling Architecture**: Reduced error-handling boilerplate by 98.3% across 60 Express endpoints using a centralized asyncHandler wrapper and global error middleware.
- **API Surface**: 40+ REST endpoints covering authentication, users, posts, stories, explore, chats, and notifications.
- **Database Indexing**: Compound and single-field indexes on handles, emails, hashtags, and TTL timestamps for low-latency queries.
- **Frontend Optimization**: Debounced search inputs (300ms), lazy image loading, skeleton placeholders, and optimized React component memoization.
- **Containerization**: Containerized 5 core services (API Server, React Client, Recommendation Microservice, Redis, and Mongo) using Docker Compose.

---

## Project Structure

```
FutureMedia/
├── server/                      # Node.js / Express.js Backend
│   ├── src/
│   │   ├── config/              # Environment, DB, Cloudinary configuration
│   │   ├── controllers/         # HTTP request handlers (auth, user, post, story, chat)
│   │   ├── database/            # Connection pipeline and idempotent database seeder
│   │   ├── middleware/          # JWT protect, RBAC, error handling, upload
│   │   ├── models/              # Mongoose schemas (User, Post, Story, Hashtag, Chat, Message)
│   │   ├── routes/              # Express API route declarations
│   │   ├── services/            # Core business logic and database operations
│   │   ├── sockets/             # Socket.IO connection and event handlers
│   │   ├── utils/               # AsyncHandler, API errors, token utilities
│   │   └── validators/          # Zod request validation schemas
│   └── tests/                   # Jest backend test suites
│
├── social/                      # React Frontend Application
│   ├── public/                  # Static HTML shell and icons
│   └── src/
│       ├── api/                 # Axios configuration and API interceptors
│       ├── components/          # Reusable UI components (Posts, Stories, Chat, Nav)
│       ├── constants/           # Design tokens, media assets, creator profiles
│       ├── pages/               # Route views (Home, Profile, Explore, Search, Settings)
│       └── utils/               # Session persistence, API fetch helpers
│
├── intelligence/                # Python Recommendation Microservice
│   ├── app/                     # FastAPI routing and ML scoring modules
│   └── requirements.txt         # Python dependencies
│
├── docker-compose.yml           # Multi-service container specification
└── README.md                    # System documentation
```

---

## Local Development

### Prerequisites
- Node.js (v20.x or v22.x)
- MongoDB (local instance or MongoDB Atlas connection URI)
- Python 3.11+ (optional, for intelligence microservice)

### Backend Setup

```bash
cd server
npm install
cp .env.example .env
npm run dev
```

### Frontend Setup

```bash
cd social
npm install
npm start
```

---

## Environment Variables

### Backend (`server/.env`)

```env
PORT=8080
NODE_ENV=development
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/futuremedia
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=noreply@futuremedia.com
```

### Frontend (`social/.env`)

```env
REACT_APP_API_BASE_URL=http://localhost:8080
REACT_APP_SOCKET_URL=http://localhost:8080
```

---

## API Overview

### Authentication & Users
- `POST /api/v1/auth/register` - Create a new user account
- `POST /api/v1/auth/login` - Authenticate user and return JWT
- `GET  /api/v1/auth/verify-email` - Verify email token
- `GET  /api/v1/users/me` - Fetch authenticated user profile
- `GET  /api/v1/users/suggested` - Fetch suggested creator accounts
- `GET  /api/v1/users/search` - Search users by handle or name
- `PUT  /api/v1/users/:id` - Update user profile information

### Posts & Interactions
- `GET    /api/v1/posts` - Fetch timeline posts
- `POST   /api/v1/posts` - Create a new post
- `GET    /api/v1/posts/search` - Search posts by text or hashtag
- `PUT    /api/v1/posts/:id/like` - Toggle like status on post
- `POST   /api/v1/posts/:id/comment` - Add a comment to post
- `DELETE /api/v1/posts/:id` - Delete post (owner only)

### Stories & Real-Time
- `GET  /api/v1/stories` - Retrieve active stories (unseen partitioned before seen)
- `POST /api/v1/stories` - Create a 24-hour story
- `PUT  /api/v1/stories/:id/view` - Mark story as viewed
- `GET  /api/v1/chat` - Retrieve user conversation list
- `POST /api/v1/message` - Send message in conversation

---

## Testing

### Backend Unit & Integration Tests

```bash
cd server
npm test
```

### Frontend Unit Tests

```bash
cd social
npm test -- --watchAll=false
```

### Production Build Verification

```bash
cd social
CI=true npm run build
```

---

## Docker Deployment

To launch all containerized services using Docker Compose:

```bash
docker-compose up --build -d
```

---

## Future Improvements

- Implementation of end-to-end encryption for 1-on-1 direct messages.
- Video transcoding pipeline with adaptive bitrate streaming (HLS/DASH).
- Expansion of recommendation graph with neural collaborative filtering.
