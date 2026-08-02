# Security Policy

## Reporting Security Issues

FutureMedia takes platform security seriously. If you discover a security vulnerability, please report it privately before making it public.

### How to Report
- **Email**: `security@futuremedia.bullishpath.in`
- **GPG Key / Encrypted Channel**: Available upon request.

Please include:
1. Type of vulnerability and affected endpoint/component.
2. Step-by-step proof-of-concept (PoC) to reproduce the issue.
3. Impact assessment.

---

## Security Practices

- **Authentication**: SHA-256 token hashing, bcrypt/scrypt password derivation.
- **Transport**: HTTPS (TLS 1.3), WSS WebSockets.
- **Protection**: Express `trust proxy` (1), NoSQL query sanitization, XSS protection headers, Rate Limiting on authentication routes.
