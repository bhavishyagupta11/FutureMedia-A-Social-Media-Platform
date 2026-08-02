# Production Deployment Checklist

Use this checklist before releasing new builds to **Vercel** (Frontend) and **Render** (Backend).

## 1. Backend Environment Variables (Render Dashboard)

- [x] `NODE_ENV` = `production`
- [x] `PORT` = `8080` (or leave default for Render)
- [x] `MONGO_URI` = `mongodb+server://<user>:<pass>@<cluster>.mongodb.net/futuremedia`
- [x] `JWT_SECRET` = `<high-entropy-secret-key>`
- [x] `JWT_EXPIRE` = `30d`
- [x] `CLIENT_ORIGINS` = `https://futuremedia-one.vercel.app,https://futuremedia.vercel.app`
- [x] `SMTP_HOST` = `smtp.resend.com`
- [x] `SMTP_PORT` = `465` (or `2525`)
- [x] `SMTP_USER` = `resend`
- [x] `SMTP_PASS` = `re_<resend_api_key>`
- [x] `FROM_EMAIL` = `noreply@futuremedia.bullishpath.in`
- [x] `FROM_NAME` = `FutureMedia`
- [x] `EMAIL_MODE` = `resend`

---

## 2. Frontend Environment Variables (Vercel Dashboard)

- [x] `REACT_APP_API_BASE_URL` = `https://futuremedia-backend.onrender.com`
- [x] `REACT_APP_SOCKET_URL` = `https://futuremedia-backend.onrender.com`

---

## 3. Reverse Proxy & Security Audit

- [x] `app.set("trust proxy", 1)` enabled in `server/src/app.js`.
- [x] No `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` warnings or errors.
- [x] Rate limiting configured with `standardHeaders: true` and `legacyHeaders: false`.
- [x] CORS options normalize trailing slashes on origins.
- [x] Preflight `OPTIONS` requests respond with HTTP status `204`.

---

## 4. Auth & Database Pipeline Audit

- [x] Signup writes user to MongoDB with `isEmailVerified: false`.
- [x] Verification email token hashed with SHA-256 in MongoDB.
- [x] Unverified user login attempt yields `HTTP 403 EMAIL_NOT_VERIFIED`.
- [x] Verification email contains production link (`https://futuremedia-one.vercel.app/verify/<token>`).
- [x] Verified login succeeds and issues JWT token.

---

## 5. Realtime Socket.IO Audit

- [x] Socket server initialized with `cors: { origin: env.CLIENT_ORIGINS, credentials: true }`.
- [x] Chat component connects using `REACT_APP_SOCKET_URL || REACT_APP_API_BASE_URL`.
- [x] WebSockets upgrade supported across Render and Vercel.
