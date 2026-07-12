# Security Policy

## Reporting Vulnerabilities

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT** open a public GitHub issue
2. Email: security@example.com (replace with your actual email)
3. Include: description, steps to reproduce, potential impact
4. Allow 48 hours for initial response

## Security Measures

### Authentication & Authorization

- No authentication system (public API by design)
- Consider adding API keys for production use

### Input Validation

- **URLs**: Must start with `http://` or `https://` (Pydantic validator)
- **Colors**: Must be valid 6-digit hex (e.g., `#ff0000`)
- **Size**: Bounded between 100px and 2000px
- **Batch**: Maximum 100 URLs per request

### File Upload Security

- **Size Limit**: 5MB maximum per upload
- **Type Validation**: Content-Type header check + magic byte verification
- **Extension Whitelist**: Only `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.webp`
- **Storage**: UUID filenames prevent overwrites and guessing

### Path Traversal Protection

- All file paths are resolved and validated against allowed directories
- `../` sequences are blocked by checking resolved path starts with expected base

### CORS Configuration

```python
# Configurable via ALLOWED_ORIGINS environment variable
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost,http://localhost:80"
).split(",")
```

### Docker Security

- **Non-Root User**: Backend container runs as `appuser` (UID 1000)
- **No Exposed DB**: PostgreSQL port is not mapped to host
- **No Hardcoded Credentials**: Use `.env` file or environment variables
- **No Dev Mode**: `--reload` flag removed from production

### Database

- Uses SQLAlchemy ORM (parameterized queries, no raw SQL)
- Default credentials should be changed via environment variables
- Database port not exposed to host network

## Known Limitations

1. **No Rate Limiting** — API can be abused for DoS (add `slowapi` for production)
2. **No Authentication** — Public API by design (add API keys for production)
3. **No HTTPS** — Use a reverse proxy (nginx, Caddy) for TLS termination
4. **No Request Logging** — Add structured logging for production monitoring

## Dependency Security

Run these commands regularly:

```bash
# Python
pip-audit

# Node
npm audit
```

## Production Checklist

Before deploying to production:

- [ ] Change default database credentials
- [ ] Set `ALLOWED_ORIGINS` to your domain
- [ ] Enable HTTPS via reverse proxy
- [ ] Add rate limiting (e.g., `slowapi`)
- [ ] Add authentication if needed
- [ ] Set up monitoring and logging
- [ ] Run `pip-audit` and `npm audit`
- [ ] Review Docker images for vulnerabilities
