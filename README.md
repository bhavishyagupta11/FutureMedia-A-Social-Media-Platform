# FutureMedia

FutureMedia is a production-grade, full-stack social networking application engineered with a decoupled architecture featuring a React single-page frontend and a RESTful Express.js micro-backend backed by MongoDB Atlas. Designed for scale, privacy, and seamless real-time interactions, FutureMedia implements secure email verification via Resend SMTP, double-hashed stateful session management, WebSocket-driven instant messaging via Socket.IO, granular private-by-default profile controls, and responsive UI layouts.

---

![Build Status](https://img.shields.io/badge/build-passing-brightgreen?style=flat-square)
![React](https://img.shields.io/badge/React-19.2.4-blue?style=flat-square&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-v22.x-green?style=flat-square&logo=node.js)
![Express](https://img.shields.io/badge/Express-4.21.x-lightgrey?style=flat-square&logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20v7.x-green?style=flat-square&logo=mongodb)
![Socket.IO](https://img.shields.io/badge/Socket.IO-v4.8-black?style=flat-square&logo=socket.io)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)
![Version](https://img.shields.io/badge/version-1.0.0-orange?style=flat-square)

---

## Interface Previews

### Homepage & Authentication
![Homepage Preview](https://via.placeholder.com/1200x675/18181B/FFFFFF?text=FutureMedia+Auth+%26+Landing)

### Main Feed
![Feed Preview](https://via.placeholder.com/1200x675/18181B/FFFFFF?text=FutureMedia+Realtime+Feed)

### User Profile
![Profile Preview](https://via.placeholder.com/1200x675/18181B/FFFFFF?text=FutureMedia+Instagram-Style+Profile+Grid)

### Realtime Messaging
![Messaging Preview](https://via.placeholder.com/1200x675/18181B/FFFFFF?text=FutureMedia+Realtime+Chat)

### Discovery & Search
![Search Preview](https://via.placeholder.com/1200x675/18181B/FFFFFF?text=FutureMedia+User+%26+Content+Search)

### Notifications Center
![Notifications Preview](https://via.placeholder.com/1200x675/18181B/FFFFFF?text=FutureMedia+Activity+Notifications)

### User Settings
![Settings Preview](https://via.placeholder.com/1200x675/18181B/FFFFFF?text=FutureMedia+Account+%26+Privacy+Settings)

---

## Table of Contents

- [Features](#features)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Repository Structure](#repository-structure)
- [Installation](#installation)
- [Environment Configuration](#environment-configuration)
- [Running Locally](#running-locally)
- [API Reference](#api-reference)
- [Database Schema Design](#database-schema-design)
- [Authentication Lifecycle](#authentication-lifecycle)
- [Application Execution Flow](#application-execution-flow)
- [Security Model](#security-model)
- [Performance & Optimization](#performance--optimization)
- [Future Roadmap](#future-roadmap)
- [Contributing](#contributing)
- [Engineering Standards](#engineering-standards)
- [License](#license)
- [Author](#author)
- [Support](#support)
- [Acknowledgements](#acknowledgements)

---

## Features

### Authentication & Account Security
- **Registration**: Email and username uniqueness validation with password strength requirements.
- **Email Verification**: Cryptographically secure 32-byte raw verification tokens hashed with SHA-256 before database storage.
- **Login Protection**: Verified email check gate blocking unverified logins with 403 Forbidden status codes.
- **JWT Authorization**: Stateless JSON Web Token authentication using Bearer headers.
- **Password Reset**: Token-based password recovery flow with expiration time validation.

### Social Networking Platform
- **Activity Feed**: Dynamic content aggregation with pagination and mock fallback resilience.
- **Posts Management**: Support for single/multiple image uploads, captions, edits, and deletions.
- **Engagements**: Atomic post likes and multi-threaded comments.
- **Ephemeral Stories**: Story creation and dynamic viewer overlay.
- **Follow System**: Asynchronous follow/unfollow operations supporting public and private profiles.
- **Private Profiles**: Private-by-default accounts requiring explicit follow approval to view content.
- **Search & Discovery**: Case-insensitive user and post search by handle or display name.
- **Bookmarks**: Post saving and collection retrieval.
- **Notifications**: Automated event dispatch for follow requests, likes, comments, and direct messages.

### Realtime Communication
- **Socket.IO Chat**: Low-latency bidirectional messaging between users.
- **Conversations**: Dynamic single-participant and multi-participant chat room initialization by handle or user ID.
- **Typing Indicators**: Active typing events emitted to chat room sockets.
- **Read Receipts**: Automated read status updates for incoming messages.

### Profile Architecture
- **Username Routing**: Clean human-readable profile URLs (`/profile/:username`).
- **Private Preview**: Secured profile view displaying public header statistics while protecting post grids behind private access walls.
- **Profile Customization**: Display name, bio, website link, and avatar management.

---

## System Architecture

```
[ Client Layer ]
React 19 SPA (Port 3000)
    │
    ├─► HTTP / REST (apiFetch Interceptor) ──┐
    └─► WebSockets (Socket.IO Client) ───────┼──┐
                                             │  │
[ Server Layer ]                             ▼  │
Express.js API Server (Port 8080) ──────────────┤
    │                                           │
    ├── Security Middleware (Helmet, CORS, Rate Limit, XSS)
    ├── Route Controllers & Service Layer      │
    │                                           │
[ Data & Infrastructure Layer ]              │
    ├─► MongoDB Atlas (Mongoose ODM) ◄──────────┘
    ├─► SMTP Relay (Resend SMTP Port 465)
    └─► Cloud Storage (Cloudinary API / Local Fallback)
```

### Layer Breakdown

1. **Client Layer**: Built as a React single-page application using React Router v7 for client-side routing, TanStack Query for data fetching/caching, and Framer Motion for UI transitions.
2. **Server Layer**: An Express.js REST application operating on Node.js. It handles authentication, request sanitization, routing, business logic execution in isolated service classes, and central error handling.
3. **Database Layer**: MongoDB Atlas managed via Mongoose schemas with explicit indexing on handles, emails, and timestamp vectors.
4. **Email Dispatch**: Integrated Nodemailer transporter communicating with Resend SMTP over SSL/TLS (Port 465) for transactional messages.
5. **Media Storage**: Cloudinary SDK integration for remote image hosting with automatic local disk storage fallback during off-grid operations.

---

## Technology Stack

| Domain | Technology | Version | Purpose |
|---|---|---|---|
| **Frontend Core** | React | 19.2.4 | Single Page Application framework |
| **Routing** | React Router DOM | 7.13.0 | Client-side routing and parameters |
| **State & Querying** | TanStack React Query | 5.101.0 | Asynchronous state management and caching |
| **Icons & UI** | Lucide React | 1.21.0 | Vector UI iconography |
| **Animations** | Framer Motion | 12.40.0 | Fluid component transitions |
| **HTTP Client** | Axios | 1.18.0 | Configured API interceptor client |
| **Backend Core** | Node.js | v22.x | JavaScript runtime environment |
| **Web Framework** | Express.js | 4.21.x | REST API server framework |
| **Database** | MongoDB Atlas | v7.x | NoSQL document storage |
| **Object Modeling** | Mongoose | 8.12.0 | Schema definition and data mapping |
| **Realtime Engine** | Socket.IO | 4.8.3 | WebSockets communication server |
| **Security** | Helmet / bcryptjs | 8.0.0 | HTTP security headers & password hashing |
| **Validation** | Zod | 3.24.2 | Strict request payload schema validation |
| **Email Service** | Nodemailer / Resend | 6.10.0 | Transactional SMTP email delivery |
| **Media Hosting** | Cloudinary SDK | 1.41.0 | Cloud image storage and transformation |
| **Testing** | Playwright / Jest | 1.61.1 | End-to-end and unit testing frameworks |

---

## Repository Structure

```
FutureMedia Social Platform/
├── server/                        # Express.js REST API Server
│   ├── src/
│   │   ├── config/                # Environment variables and Cloudinary config
│   │   ├── controllers/           # API request handlers
│   │   ├── database/              # MongoDB Atlas connection manager
│   │   ├── middleware/            # Auth, security, role, and error middleware
│   │   ├── models/                # Mongoose database schemas
│   │   ├── routes/                # Express API endpoint definitions
│   │   ├── services/              # Business logic layer
│   │   ├── sockets/               # Socket.IO connection handlers
│   │   ├── utils/                 # Password hashing, response formatters, email templates
│   │   └── validators/            # Zod validation schemas
│   ├── tests/                     # Jest API test suites
│   ├── .env.example               # Backend environment template
│   ├── Dockerfile                 # Server container definition
│   └── package.json
│
├── social/                        # React Frontend Application
│   ├── public/                    # Static assets and HTML entry point
│   ├── src/
│   │   ├── api/                   # Axios client instance and fetch interceptors
│   │   ├── app/                   # App layout and primary route configuration
│   │   ├── components/            # Reusable UI components
│   │   ├── pages/                 # Route pages (Auth, Feed, Profile, Chat, Settings)
│   │   ├── theme/                 # CSS design tokens and global styles
│   │   └── utils/                 # Local storage and session helper utilities
│   ├── tests/                     # Playwright E2E test suites
│   ├── .env.example               # Frontend environment template
│   ├── Dockerfile                 # Client container definition
│   └── package.json
│
├── intelligence/                  # Python Recommendation Engine (Standalone Service)
│   ├── ranking/                   # Scoring and time-decay algorithms
│   ├── similarity/                # Content TF-IDF matrix computation
│   ├── main.py                    # FastAPI application entry point
│   └── requirements.txt
│
├── scripts/                       # DevOps & Shell automation scripts
│   ├── start-dev.ps1              # Concurrent dev environment launcher
│   └── stop-dev.ps1               # Process cleanup automation
│
├── docker-compose.yml             # Container orchestration specification
├── LICENSE                        # MIT License specification
└── README.md                      # Primary repository documentation
```

---

## Installation

### Prerequisites
- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **MongoDB**: Active MongoDB Atlas cluster or local MongoDB instance (v6.0+)

### Setup Instructions

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/bhavishyagupta11/FutureMedia-Social-Platform.git
   cd "FutureMedia Social Platform"
   ```

2. **Install Server Dependencies**:
   ```bash
   cd server
   npm install
   ```

3. **Install Client Dependencies**:
   ```bash
   cd ../social
   npm install
   ```

---

## Environment Configuration

### Backend Environment (`server/.env`)

| Variable | Required | Description | Example / Default |
|---|---|---|---|
| `NODE_ENV` | Yes | Application execution environment | `development` / `production` |
| `PORT` | Yes | HTTP server binding port | `8080` |
| `MONGO_URI` | Yes | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/futuremedia` |
| `JWT_SECRET` | Yes | Cryptographic key for signing JWT tokens | `your_secure_jwt_secret_key_string` |
| `CLIENT_ORIGINS` | Yes | CORS allowed origins (comma-separated) | `http://localhost:3000,https://futuremedia.vercel.app` |
| `EMAIL_MODE` | No | Email delivery mode (`resend` or `smtp`) | `resend` |
| `SMTP_HOST` | Yes | SMTP server hostname | `smtp.resend.com` |
| `SMTP_PORT` | Yes | SMTP server connection port | `465` |
| `SMTP_USER` | Yes | SMTP authentication username | `resend` |
| `SMTP_PASS` | Yes | SMTP authentication password / API key | `re_123456789` |
| `FROM_EMAIL` | Yes | Sender email address for outbound mail | `noreply@futuremedia.bullishpath.in` |
| `FROM_NAME` | Yes | Sender display name | `FutureMedia` |
| `CLOUDINARY_CLOUD_NAME` | No | Cloudinary cloud identifier | `your_cloud_name` |
| `CLOUDINARY_API_KEY` | No | Cloudinary API key | `1234567890` |
| `CLOUDINARY_API_SECRET` | No | Cloudinary API secret | `your_api_secret` |
| `REDIS_URL` | No | Optional Redis cache server URL | `redis://localhost:6379` |

### Frontend Environment (`social/.env`)

| Variable | Required | Description | Example / Default |
|---|---|---|---|
| `REACT_APP_API_BASE_URL` | Yes | Backend REST API base URL | `http://localhost:8080` |
| `REACT_APP_SOCKET_URL` | No | Socket.IO server connection URL | `http://localhost:8080` |

---

## Running Locally

### Development Mode

1. **Start Backend Server**:
   ```bash
   cd server
   npm run dev
   ```
   *Server listens on `http://localhost:8080`*

2. **Start Frontend Application**:
   ```bash
   cd social
   npm start
   ```
   *Client application launches on `http://localhost:3000`*

### Production Build

1. **Build Frontend Assets**:
   ```bash
   cd social
   npm run build
   ```

2. **Start Server in Production Mode**:
   ```bash
   cd server
   npm start
   ```

---

## API Reference

### Authentication Endpoints
- `POST /api/v1/auth/register` — Create user account and trigger verification email.
- `POST /api/v1/auth/login` — Authenticate user and issue JWT token.
- `GET /api/v1/auth/verify-email/:token` — Validate verification token and activate account.
- `POST /api/v1/auth/resend-verification` — Request a new email verification token.
- `POST /api/v1/auth/forgot-password` — Initiate password recovery workflow.
- `POST /api/v1/auth/reset-password` — Update password using valid reset token.

### User & Profile Endpoints
- `GET /api/v1/users/me` — Fetch authenticated user profile.
- `GET /api/v1/users/:id` — Fetch user profile by handle or ID.
- `PUT /api/v1/users/:id/profile` — Update profile display name, bio, website, and avatar.
- `PUT /api/v1/users/:id/settings` — Update privacy controls and notification preferences.
- `GET /api/v1/users/search?query=` — Search users and content by handle or keywords.
- `GET /api/v1/users/suggested` — Retrieve user recommendations based on engagement metrics.
- `POST /api/v1/users/:id/follow` — Send follow request or follow user.
- `POST /api/v1/users/:id/unfollow` — Remove follow connection.
- `POST /api/v1/users/follow-requests/:requesterId/accept` — Accept incoming follow request.
- `POST /api/v1/users/follow-requests/:requesterId/reject` — Reject incoming follow request.

### Post & Content Endpoints
- `GET /api/v1/posts/feed` — Fetch aggregated post feed for current user.
- `GET /api/v1/posts/user/:identifier` — Fetch posts authored by specific handle or user ID.
- `POST /api/v1/posts` — Publish new post with text and media attachments.
- `GET /api/v1/posts/:id` — Retrieve single post document details.
- `PUT /api/v1/posts/:id` — Edit caption of owned post.
- `DELETE /api/v1/posts/:id` — Remove post document and attached media.
- `PUT /api/v1/posts/:id/like` — Toggle like status on post.
- `POST /api/v1/posts/:id/comment` — Add comment to post.
- `DELETE /api/v1/posts/comment/:postId/:commentId` — Remove comment from post.

### Chat & Messaging Endpoints
- `GET /api/v1/chat` — Retrieve all conversation threads for current user.
- `POST /api/v1/chat/access` — Access or initialize conversation thread with user.
- `GET /api/v1/chat/messages/:chatId` — Fetch message history for chat room.
- `POST /api/v1/chat/message` — Send direct message to active conversation.
- `PUT /api/v1/chat/:chatId/read` — Mark conversation messages as read.

### Notifications & Stories
- `GET /api/v1/notifications` — Fetch user activity notifications list.
- `PUT /api/v1/notifications/:id/read` — Mark single notification as read.
- `GET /api/v1/stories` — Retrieve current active stories.
- `POST /api/v1/stories` — Create new story post.

---

## Database Schema Design

### Collection: `users`
```javascript
{
  username: { type: String, required: true, unique: true, trim: true },
  usernameLower: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  password: { type: String, required: true },
  displayName: { type: String, default: "" },
  profilePicture: { type: String, default: "" },
  bio: { type: String, default: "" },
  website: { type: String, default: "" },
  isPrivate: { type: Boolean, default: true },
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String },
  followers: [{ type: Schema.Types.ObjectId, ref: "User", index: true }],
  following: [{ type: Schema.Types.ObjectId, ref: "User", index: true }],
  followRequests: [{ type: Schema.Types.ObjectId, ref: "User" }],
  settings: {
    privacy: { profileVisibility: { type: String, default: "public" } },
    notifications: { push: Boolean, email: Boolean }
  }
}
```

### Collection: `posts`
```javascript
{
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  caption: { type: String, default: "" },
  media: [{
    url: { type: String, required: true },
    type: { type: String, enum: ["image", "video"], default: "image" }
  }],
  likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
  comments: [{
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }]
}
```

### Collection: `chats`
```javascript
{
  chatName: { type: String, default: "sender" },
  isGroupChat: { type: Boolean, default: false },
  participants: [{ type: Schema.Types.ObjectId, ref: "User", index: true }],
  latestMessage: { type: Schema.Types.ObjectId, ref: "Message" }
}
```

### Collection: `messages`
```javascript
{
  sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true },
  chat: { type: Schema.Types.ObjectId, ref: "Chat", required: true, index: true },
  readBy: [{ type: Schema.Types.ObjectId, ref: "User" }]
}
```

---

## Authentication Lifecycle

1. **User Registration**: Client posts credentials to `/api/v1/auth/register`. Backend creates user record with `isEmailVerified: false` and generates a 32-byte crypto token. Token is hashed with SHA-256 before database insertion, while the unhashed token is dispatched via Resend SMTP email link.
2. **Email Verification**: User clicks link leading to `/verify/:token`. Client issues GET `/api/v1/auth/verify-email/:token`. Backend computes SHA-256 hash of parameter, matches record, sets `isEmailVerified: true`, and clears token fields.
3. **User Login**: Client posts credentials to `/api/v1/auth/login`. Server verifies email check gate. If verified, password is compared using `bcrypt.compare`. Upon validation, server issues signed JWT containing user identity payload.
4. **Authorized Requests**: Client attaches JWT in HTTP header: `Authorization: Bearer <token>`. The `protect` middleware decodes token, validates user existence, and populates `req.user`.

---

## Application Execution Flow

```
Register Account ──► Receive Verification Email ──► Click Verification Link
                                                           │
                                                           ▼
Login Screen ◄── Verify Account Gate Status ◄── Account Marked Verified
     │
     ▼
Issue JWT Bearer Token ──► Redirect to Main Home Feed
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
  Browse / Search        Create Post / Story     Realtime Messaging
        │                       │                       │
        ▼                       ▼                       ▼
View Profile Grid       Update Activity Feed    Socket.IO Room Join
```

---

## Security Model

- **Password Encryption**: Hashed using `bcryptjs` with salt rounds before database persistence.
- **SHA-256 Token Hashing**: Email verification and password reset tokens are stored as cryptographic hashes to mitigate database exposure risks.
- **HTTP Security Headers**: Express app utilizes `helmet` to set secure HTTP headers protecting against clickjacking, cross-site scripting (XSS), and MIME-sniffing.
- **Request Sanitization**: Implements `express-mongo-sanitize` to strip MongoDB operator injection vectors (`$`, `.`) and `xss-clean` to sanitize user inputs.
- **Rate Limiting**: Rate limiting applied via `express-rate-limit` on sensitive authentication endpoints.
- **CORS Constraints**: Strict origin matching against whitelist configured in `CLIENT_ORIGINS`.

---

## Performance & Optimization

- **React Lazy Loading**: Route components are dynamically imported using `React.lazy` and `Suspense` code-splitting to minimize initial JS bundle size.
- **Query Optimization**: Secondary Mongoose indexes configured on search handles (`usernameLower`), emails, and relation vectors (`followers`, `following`, `chat`).
- **Media Asset Optimization**: Image assets handled via Cloudinary deliver auto-formatted webp/avif formats with width constraints.
- **CSS Grid Layout**: Profile post grid utilizes native CSS Grid with fixed `aspect-ratio: 1 / 1` rendering, avoiding layout shifts (CLS).

---

## Future Roadmap

- **WebRTC Video Calling**: Peer-to-peer 1-on-1 and group video communication channels.
- **Community Groups**: Public and private topic-focused community channels with admin roles.
- **Integrated Marketplace**: Creator digital products and media item showcase.
- **ML Intelligence Service Integration**: Full deployment of Python recommendation service (`intelligence/`) for personalized interest-graph feed ranking.
- **Mobile Native Application**: React Native cross-platform mobile client for iOS and Android.

---

## Contributing

1. **Fork the Repository**
2. **Create a Feature Branch**:
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit Changes**: Use semantic commit style (`feat: add post bookmarking`, `fix: privacy toggle persistence`).
4. **Push Branch**:
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

---

## Engineering Standards

- **Folder Hierarchy**: Features grouped logically inside `pages/` and `components/`.
- **Code Style**: Functional React components utilizing Hooks and standard ES6+ syntax.
- **Standardized API Responses**: All HTTP JSON responses follow consistent structure:
  ```json
  {
    "success": true,
    "message": "Human readable action summary",
    "data": {},
    "errors": null
  }
  ```

---

## License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for complete details.

---

## Author

**Bhavishya Gupta**
- **GitHub**: [github.com/bhavishyagupta11](https://github.com/bhavishyagupta11)
- **LinkedIn**: [linkedin.com/in/bhavishyagupta](https://linkedin.com/in/bhavishyagupta)
- **Portfolio**: [futuremedia.bullishpath.in](https://futuremedia.bullishpath.in)
- **Email**: [bhavishyagupta001@gmail.com](mailto:bhavishyagupta001@gmail.com)

---

## Support

For bug reports, technical inquiries, or security vulnerabilities, please open an issue in the official GitHub repository issue tracker at [github.com/bhavishyagupta11/FutureMedia-Social-Platform/issues](https://github.com/bhavishyagupta11/FutureMedia-Social-Platform/issues).

---

## Acknowledgements

- [React.js](https://react.dev/)
- [Express.js](https://expressjs.com/)
- [MongoDB Atlas](https://www.mongodb.com/atlas)
- [Socket.IO](https://socket.io/)
- [Resend API](https://resend.com/)
- [Cloudinary](https://cloudinary.com/)
- [Lucide Icons](https://lucide.dev/)
- [Framer Motion](https://www.framer.com/motion/)
