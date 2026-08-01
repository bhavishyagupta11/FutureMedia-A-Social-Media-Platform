# FutureMedia Local Development Guide: Email Verification

## Quickstart for Developers

### 1. Register a New User
Navigate to `http://localhost:3000/signup` and register a new account.

### 2. Retrieve Verification Link
In `development` or `test` mode, when SMTP is disabled/unreachable, inspect the Node backend terminal output (`server/`). You will see a formatted verification banner:

```
=================================================
FutureMedia Development Email Verification
User:            dev_user@example.com
Verification URL: http://localhost:3000/verify/a2d1af0f33fa6ad2221a9cde...
Expires:         24 Hours
=================================================
```

### 3. Complete Verification
Click or paste the `Verification URL` into your browser. You will see the **Account Verified!** UI screen with a success animation.

### 4. Log In
Click **Continue to Login** and log in with your account credentials.

---

## Testing Verification Error States

1. **Unverified Login Block**: Attempt to log in immediately after registration without visiting the verification link. The login form will display an inline **Email Verification Required** banner with a **Resend Verification Link** button.
2. **Expired Token State**: Navigating to `/verify/<token>` after 24 hours displays the **Link Expired** UI screen with a direct resend input form.
3. **Invalid Token State**: Navigating to `/verify/invalid_token` displays the **Invalid Verification Link** screen.
4. **Already Verified State**: Navigating back to an already consumed verification link displays the **Already Verified** UI screen.
