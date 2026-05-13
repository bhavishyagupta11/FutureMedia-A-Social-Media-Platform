# FutureMedia Social Platform

A full-stack social media web application built with React and Node.js/Express, featuring real-time messaging via Socket.IO, image hosting on Cloudinary, and a dark-themed glassmorphism UI.

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-010101?logo=socket.io&logoColor=white)](https://socket.io/)
[![Express](https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-Media_Storage-3448C5?logo=cloudinary&logoColor=white)](https://cloudinary.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Running the Backend](#running-the-backend)
  - [Running the Frontend](#running-the-frontend)
- [API Reference](#api-reference)
- [Architecture](#architecture)
- [Author](#author)
- [License](#license)

---

## Overview

FutureMedia (FSM) is a production-ready social networking platform that enables users to sign up, post images, interact with content, follow other users, and message each other in real time. The backend exposes a RESTful API secured with JWT and integrates Socket.IO for bidirectional, event-driven communication. The frontend is a single-page React application with a dark glassmorphism design, toast notifications, and full client-side routing.

Key design decisions:
- **Resilient database connection** — falls back to `mongodb-memory-server` when MongoDB Atlas is unreachable, so the app never hard-crashes in development.
- **Cloudinary-first media** — all uploaded images (posts and profile pictures) are stored on Cloudinary via `multer-storage-cloudinary`, keeping the server stateless.
- **Socket.IO rooms** — each authenticated user joins a personal room keyed to their MongoDB `_id`, enabling targeted real-time message delivery without broadcasting to all clients.

---

## Features

### Authentication
- Register and login with hashed credentials
- Stateless JWT-based authentication (Bearer token)
- Protected routes enforced by Express middleware on every API call

### User Profiles
- Editable display name, bio, website, and profile picture
- Follow / unfollow other users
- Follower and following counts with full lists
- User search and suggested users discovery

### Posts & Feed
- Create image posts with optional captions (uploaded to Cloudinary)
- Personalized feed showing posts from followed users
- Like and unlike posts
- Comment on posts; like individual comments
- Delete own posts and comments

### Real-Time Messaging
- One-to-one chat with persistent message history in MongoDB
- Socket.IO events: `setup`, `join chat`, `new message`, `typing`, `stop typing`
- Messages are routed to the correct recipient's personal room

### UI & UX
- Dark glassmorphism design with animated blur layers
- Toast notifications via `react-toastify`
- Responsive layout with a persistent top navigation bar
- Pages: Home feed, Profile, Edit Profile, Chat, Settings
- Active nav link highlighting and session-aware logout

---

## Tech Stack

### Frontend (`/social`)

| Technology | Purpose |
|---|---|
| React 19 | UI framework |
| React Router DOM 7 | Client-side routing |
| Socket.IO Client 4 | Real-time messaging |
| MUI (Material UI) 7 | UI component library |
| React Toastify 11 | Toast notifications |
| Iconscout Unicons | Icon set |
| Vanilla CSS | Custom dark theme & glassmorphism |

### Backend (`/server`)

| Technology | Purpose |
|---|---|
| Node.js + Express 5 | HTTP server & REST API |
| MongoDB + Mongoose 9 | Primary database & ODM |
| Socket.IO 4 | Real-time WebSocket server |
| JSON Web Token | Stateless authentication |
| Cloudinary + Multer | Image upload & cloud storage |
| `mongodb-memory-server` | In-memory DB fallback for dev |
| dotenv | Environment variable management |
| nodemon | Development auto-restart |

---

## Project Structure

```
FutureMedia Social Platform/
├── server/                        # Express REST API + Socket.IO server
│   ├── config/
│   │   └── cloudinary.js          # Cloudinary + Multer configuration
│   ├── controllers/
│   │   ├── authController.js      # Register, login
│   │   ├── userController.js      # Profile, follow, search, suggestions
│   │   ├── postController.js      # CRUD posts, likes, comments
│   │   └── chatController.js      # Chat access, messages
│   ├── middleware/
│   │   └── auth.js                # JWT verification middleware
│   ├── models/
│   │   ├── userModel.js           # User schema (username, bio, followers…)
│   │   ├── postModels.js          # Post + embedded Comment schema
│   │   ├── chatModel.js           # Chat room schema
│   │   └── messageModel.js        # Message schema
│   ├── routes/
│   │   ├── authRoutes.js          # POST /api/auth/register|login
│   │   ├── userRoutes.js          # GET|PUT /api/users/…
│   │   ├── postRoutes.js          # GET|POST|DELETE /api/posts/…
│   │   └── chatRoutes.js          # GET|POST /api/chat/…
│   ├── .env.example               # Environment variable template
│   ├── server.js                  # App entry — Express + Socket.IO bootstrap
│   └── package.json
│
└── social/                        # React SPA
    └── src/
        ├── components/
        │   ├── FollowersCard/     # Sidebar follower suggestions
        │   ├── InfoCard/          # User bio display card
        │   ├── LogoSearch/        # Top search bar component
        │   ├── Post/              # Single post card
        │   ├── PostShare/         # New post creation form
        │   ├── Posts/             # Post list / feed renderer
        │   ├── ProfileCard/       # Profile summary card
        │   ├── ProfileModal/      # Edit profile modal
        │   ├── RightSide/         # Right sidebar (trends, suggestions)
        │   ├── ShareModal/        # Media sharing modal
        │   └── TrendCard/         # Trending topics card
        ├── pages/
        │   ├── Auth/              # Login & Sign Up pages + Home feed
        │   ├── Profile/           # Profile view & Edit Profile
        │   ├── Chat/              # Real-time chat page
        │   └── Settings/          # Account settings page
        ├── utils/
        │   └── session.js         # Session helpers (get/clear user ID)
        ├── App.js                 # Router setup + top navigation bar
        └── App.css                # Global dark theme & glassmorphism styles
```

---

## Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher
- A **MongoDB Atlas** cluster URI (or the app will fall back to an in-memory database)
- A **Cloudinary** account for image uploads

### Environment Variables

Copy the example file and fill in your credentials:

```bash
cd server
cp .env.example .env
```

| Variable | Description |
|---|---|
| `PORT` | Port the server listens on (default: `8080`) |
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `CLIENT_ORIGINS` | Comma-separated allowed CORS origins |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Your Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Your Cloudinary API secret |

**Example `.env`:**

```env
PORT=8080
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
JWT_SECRET=replace-with-a-long-random-secret
CLIENT_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Running the Backend

```bash
cd server
npm install
npm run dev        # starts with nodemon on http://localhost:8080
```

For production:

```bash
npm start          # starts with node
```

### Running the Frontend

```bash
cd social
npm install
npm start          # starts on http://localhost:3000
```

The React app proxies API calls to `http://localhost:8080` by default.

---

## API Reference

All routes under `/api` require a valid `Authorization: Bearer <token>` header except for the auth endpoints.

### Auth — `/api/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/register` | ❌ | Register a new user |
| `POST` | `/login` | ❌ | Authenticate and receive a JWT |

### Users — `/api/users`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/` | ✅ | Get all users |
| `GET` | `/search?q=` | ✅ | Search users by username |
| `GET` | `/suggestions` | ✅ | Get suggested users to follow |
| `GET` | `/:id` | ✅ | Get a user by ID |
| `PUT` | `/:id/profile` | ✅ | Update profile (multipart — supports `profilePicture` image) |
| `POST` | `/follow/:id` | ✅ | Follow a user |
| `POST` | `/unfollow/:id` | ✅ | Unfollow a user |

### Posts — `/api/posts`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/` | ✅ | Create a post (multipart — requires `image` field) |
| `GET` | `/feed` | ✅ | Get personalized feed (posts from followed users) |
| `GET` | `/user/:id` | ✅ | Get all posts by a specific user |
| `POST` | `/like/:id` | ✅ | Like or unlike a post |
| `POST` | `/comment/:id` | ✅ | Add a comment to a post |
| `POST` | `/like-comment/:postId/:commentId` | ✅ | Like or unlike a comment |
| `DELETE` | `/comment/:postId/:commentId` | ✅ | Delete a comment |
| `DELETE` | `/:id` | ✅ | Delete a post |

### Chat — `/api/chat`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/access` | ✅ | Access or create a one-to-one chat |
| `GET` | `/` | ✅ | Fetch all chats for the current user |
| `POST` | `/message` | ✅ | Send a message |
| `GET` | `/messages/:chatId` | ✅ | Get message history for a chat |

### Socket.IO Events

| Event (client → server) | Payload | Description |
|---|---|---|
| `setup` | `{ _id }` | Join the user's personal room |
| `join chat` | `chatId` | Join a specific chat room |
| `new message` | message object | Broadcast message to recipients |
| `typing` | `chatId` | Notify recipients that user is typing |
| `stop typing` | `chatId` | Notify recipients that user stopped typing |

| Event (server → client) | Description |
|---|---|
| `connected` | Confirms the user's personal room is joined |
| `message received` | Delivers a new incoming message |
| `typing` | Indicates a participant is typing |
| `stop typing` | Indicates a participant stopped typing |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        Client                           │
│   React 19 SPA  │  React Router DOM  │  Socket.IO-client│
└────────────────────────────┬────────────────────────────┘
                             │ HTTP (REST) + WebSocket
┌────────────────────────────▼────────────────────────────┐
│                        Server                           │
│   Express 5 REST API       │   Socket.IO 4 WS Server    │
│   JWT Auth Middleware       │   User Room Management     │
│   Multer + Cloudinary       │   Real-time Events         │
└───────────┬─────────────────────────────────────────────┘
            │ Mongoose ODM
┌───────────▼────────────┐       ┌───────────────────────┐
│    MongoDB Atlas       │       │      Cloudinary        │
│  Users / Posts /       │       │  Profile Pictures /    │
│  Chats / Messages      │       │  Post Images           │
└────────────────────────┘       └───────────────────────┘
```

**Data flow for a new post:**
1. Client sends `POST /api/posts` as `multipart/form-data` with the `image` file and optional `caption`.
2. `multer-storage-cloudinary` streams the file directly to Cloudinary and attaches the resulting URL to `req.file`.
3. `postController.createPost` saves the post document with the Cloudinary URL to MongoDB.
4. The client re-fetches the feed and renders the new post card.

**Data flow for a chat message:**
1. Client sends `POST /api/chat/message` to persist the message in MongoDB.
2. Client emits `new message` via Socket.IO with the full message object.
3. Server reads `chat.participants`, and for each participant that isn't the sender, emits `message received` into their personal room.
4. Recipient's client receives the event and appends the message to the conversation.

---

## Author

**Bhavishya Gupta**
- GitHub: [@bhavishyagupta11](https://github.com/bhavishyagupta11)

---

## License

This project is licensed under the [MIT License](LICENSE).
