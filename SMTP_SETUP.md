# FutureMedia SMTP & Email Provider Configuration

## Overview
FutureMedia supports multiple SMTP providers configurable entirely via environment variables in `server/.env`.

---

## Supported Provider Configurations

### 1. Local Mailpit / MailHog (Local Development)
Mailpit catches emails locally on port 2525 without sending real emails over the internet.

```env
SMTP_HOST=127.0.0.1
SMTP_PORT=2525
FROM_EMAIL=noreply@futuremedia.local
FROM_NAME=FutureMedia Dev
```
Run Mailpit via Docker:
```bash
docker run -d -p 8025:8025 -p 2525:1025 axllent/mailpit
```

### 2. Ethereal Email (Free Fake SMTP for Testing)
```env
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=your_ethereal_username
SMTP_PASS=your_ethereal_password
FROM_EMAIL=noreply@ethereal.email
```

### 3. SendGrid SMTP
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.your_sendgrid_api_key
FROM_EMAIL=verified_sender@yourdomain.com
```

### 4. Gmail SMTP Relay
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_gmail_address@gmail.com
SMTP_PASS=your_app_password
FROM_EMAIL=your_gmail_address@gmail.com
```

### 5. AWS SES (Simple Email Service)
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your_ses_smtp_username
SMTP_PASS=your_ses_smtp_password
FROM_EMAIL=noreply@yourdomain.com
```

---

## Development Console Fallback
When `NODE_ENV=development` or `NODE_ENV=test`, if no SMTP server is reachable, `EmailService` automatically outputs the verification URL in a formatted terminal block:

```
=================================================
FutureMedia Development Email Verification
User:            user@example.com
Verification URL: http://localhost:3000/verify/<token>
Expires:         24 Hours
=================================================
```
