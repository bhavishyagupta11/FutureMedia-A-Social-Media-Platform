# FutureMedia Production Deployment Guide

## Overview
This guide provides step-by-step instructions for deploying FutureMedia to production environments (Docker containers, Vercel/Netlify for frontend, Node.js/PM2 for backend, and MongoDB Atlas for database).

---

## 1. Prerequisites & Environment Variables

### Backend (`server/.env`)
```env
PORT=8080
NODE_ENV=production
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/futuremedia?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here
CLIENT_URL=https://app.futuremedia.com
```

### Frontend (`social/.env`)
```env
REACT_APP_API_BASE_URL=https://api.futuremedia.com
```

---

## 2. PM2 & Process Management (Backend)

```bash
# Install PM2 globally
npm install -g pm2

# Start backend cluster mode
cd server
pm2 start src/index.js --name "futuremedia-api" -i max

# Verify status
pm2 status
```

---

## 3. Production Static Serving (Frontend)

```bash
# Build React application
cd social
npm run build

# Serve static build using Nginx or serve
npm install -g serve
serve -s build -l 3000
```

---

## 4. Health Checks & Verification

- **API Health Endpoint**: `GET https://api.futuremedia.com/health` (returns `{ status: "ok" }`).
- **Frontend SPA Routing**: Ensure Nginx or host is configured for fallback routing (`try_files $uri /index.html`).
