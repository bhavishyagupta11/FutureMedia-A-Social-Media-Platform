# FutureMedia Authentication & Email Verification API Reference

## Endpoints Summary

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | No | User registration. Generates verification token. |
| `POST` | `/api/v1/auth/login` | No | User login. Returns 403 if email unverified. |
| `GET` | `/api/v1/auth/verify-email/:token` | No | Validates raw token, marks email verified, deletes token. |
| `POST` | `/api/v1/auth/resend-verification` | No (Rate Limited) | Resends verification email (max 5/hr, 60s cooldown). |

---

## Endpoint Details

### 1. User Registration
`POST /api/v1/auth/register`

#### Request Body
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "Password123!"
}
```

#### Response (201 Created)
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "_id": "6a636c...",
    "username": "johndoe",
    "email": "john@example.com",
    "isEmailVerified": false
  }
}
```

---

### 2. User Login
`POST /api/v1/auth/login`

#### Request Body
```json
{
  "username": "johndoe",
  "password": "Password123!"
}
```

#### Response (403 Forbidden - Email Unverified)
```json
{
  "success": false,
  "code": "EMAIL_NOT_VERIFIED",
  "message": "Please verify your email address to log in.",
  "canResend": true,
  "nextAction": "RESEND_VERIFICATION"
}
```

#### Response (200 OK - Successful Login)
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "_id": "6a636c...",
    "username": "johndoe",
    "email": "john@example.com",
    "token": "eyJhbGciOiJIUzI1Ni..."
  }
}
```

---

### 3. Verify Email Endpoint
`GET /api/v1/auth/verify-email/:token`

#### Response Codes
- `200 OK` + `code: "EMAIL_VERIFIED_SUCCESS"`: Verification successful.
- `200 OK` + `code: "ALREADY_VERIFIED"`: Account is already verified.
- `400 Bad Request` + `code: "TOKEN_EXPIRED"`: Token expired (>24 hours). Includes `canResend: true`.
- `400 Bad Request` + `code: "TOKEN_INVALID"`: Token is invalid, malformed, or already consumed.

---

### 4. Resend Verification Link
`POST /api/v1/auth/resend-verification`

#### Request Body
```json
{
  "email": "john@example.com"
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "code": "RESEND_SUCCESS",
  "message": "If an account exists with that email, a verification link has been sent."
}
```

#### Response (429 Too Many Requests - Cooldown Active)
```json
{
  "success": false,
  "code": "RESEND_TOO_SOON",
  "message": "Please wait 60 seconds before requesting another verification email."
}
```
