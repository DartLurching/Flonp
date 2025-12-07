# FLONP — Deployment Guide

## Overview

This document describes how to deploy FLONP to production. The frontend is hosted on Netlify, the backend on Railway.

---

## Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                        PRODUCTION                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Frontend (Netlify)              Backend (Railway)             │
│   ──────────────────              ─────────────────             │
│   https://flonp.netlify.app       https://flonp-api.railway.app │
│                                                                 │
│   • Static files on CDN           • Docker container            │
│   • Auto-deploy from Git          • Auto-deploy from Git        │
│   • Free tier                     • Paid tier (no cold starts)  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Frontend Deployment (Netlify)

### Prerequisites

- Netlify account (free tier)
- Repository connected to Netlify

### Configuration

| Setting | Value |
|---------|-------|
| Base directory | `frontend` |
| Build command | `pnpm build` |
| Publish directory | `frontend/dist` |
| Node version | 24 |

### Environment Variables

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://flonp-api.railway.app` (or your Railway URL) |

### Deploy Process

1. Push to `main` branch
2. Netlify detects change in `frontend/` directory
3. Runs `pnpm build`
4. Deploys `dist/` to CDN
5. Site available at configured domain

### Build Settings File

Create `frontend/netlify.toml`:
```toml
[build]
  base = "frontend"
  command = "pnpm build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "24"
```

---

## Backend Deployment (Railway)

### Prerequisites

- Railway account (paid tier recommended for no cold starts)
- Repository connected to Railway

### Railway Project Setup

1. Go to https://railway.app/
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose the FLONP repository
5. Railway auto-detects the Dockerfile in `backend/`

### Configuration

| Setting | Value |
|---------|-------|
| Root directory | `backend` |
| Builder | Dockerfile |
| Region | Choose closest to your users |
| Restart policy | Always |

### Setting Root Directory in Railway

1. Go to Project → Service Settings
2. Under "Source", set Root Directory to `backend`
3. Railway will only watch `backend/` for changes

---

### Docker Configuration

#### Dockerfile

Create `backend/Dockerfile`:
```dockerfile
# Use Python 3.10 slim image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install uv for fast package installation
RUN pip install --no-cache-dir uv

# Copy requirements first (Docker layer caching)
COPY requirements.txt .

# Install Python dependencies
RUN uv pip install --system --no-cache -r requirements.txt

# Copy application code
COPY app/ ./app/

# Expose port (Railway uses PORT env variable)
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

# Start server
# Railway sets PORT automatically, but we default to 8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
```

#### Dockerfile Explanation

| Line | Purpose |
|------|---------|
| `FROM python:3.10-slim` | Minimal Python image, smaller size |
| `PYTHONDONTWRITEBYTECODE=1` | Prevents .pyc files, reduces image size |
| `PYTHONUNBUFFERED=1` | Ensures logs appear in real-time |
| `apt-get install gcc` | Required for some Python packages |
| `COPY requirements.txt` first | Enables Docker layer caching |
| `uv pip install --system` | Installs to system Python (no venv needed in container) |
| `EXPOSE 8000` | Documents the port (Railway overrides via `PORT` env) |
| `HEALTHCHECK` | Railway uses this to verify container health |
| `${PORT:-8000}` | Uses Railway's PORT or defaults to 8000 |

#### .dockerignore

Create `backend/.dockerignore`:
```
# Virtual environment
.venv/
venv/

# Python cache
__pycache__/
*.pyc
*.pyo
*.pyd

# Environment files (secrets should be in Railway)
.env
.env.*

# Git
.git/
.gitignore

# IDE
.vscode/
.idea/

# Testing
tests/
pytest_cache/
.coverage

# Documentation
*.md
docs/

# Other
.DS_Store
Thumbs.db
```

---

### Railway Environment Variables

Set these in Railway dashboard → Service → Variables:

| Variable | Value | Required |
|----------|-------|----------|
| `ANTHROPIC_API_KEY` | `sk-ant-...` | Yes |
| `ALLOWED_ORIGINS` | `https://flonp.netlify.app` | Yes |
| `PORT` | (auto-set by Railway) | No |

#### Setting Environment Variables in Railway

1. Go to Project → Service
2. Click "Variables" tab
3. Click "New Variable"
4. Add each variable and value
5. Railway automatically restarts the service

---

### Railway Deploy Process
```
1. Push to `main` branch
         │
         ▼
2. Railway detects change in `backend/`
         │
         ▼
3. Railway builds Docker image
   • Reads Dockerfile
   • Installs dependencies
   • Creates container image
         │
         ▼
4. Railway deploys container
   • Starts new container
   • Runs health check
   • Routes traffic to new container
         │
         ▼
5. API available at Railway URL
```

### Railway Logs

#### Viewing Logs

1. Go to Project → Service
2. Click "Deployments" tab
3. Select a deployment
4. View build logs and runtime logs

#### Log Types

| Log Type | Content |
|----------|---------|
| Build logs | Dockerfile execution, dependency installation |
| Deploy logs | Container startup, health checks |
| Runtime logs | Application output, request logs, errors |

---

### Railway Service Settings

#### Recommended Settings

| Setting | Value | Location |
|---------|-------|----------|
| Root Directory | `backend` | Service → Settings → Source |
| Watch Paths | `backend/**` | Service → Settings → Source |
| Restart Policy | Always | Service → Settings → Deploy |
| Health Check Path | `/health` | Service → Settings → Deploy |
| Health Check Timeout | 10s | Service → Settings → Deploy |

#### Networking

| Setting | Value |
|---------|-------|
| Public Networking | Enabled |
| Port | 8000 (or `PORT` env variable) |
| Domain | Auto-generated or custom |

---

## Domain Configuration

### Frontend (Netlify)

| Type | Value |
|------|-------|
| Default | `flonp.netlify.app` |
| Custom (optional) | Configure in Netlify dashboard |

### Backend (Railway)

| Type | Value |
|------|-------|
| Default | `flonp-api.up.railway.app` |
| Custom (optional) | Configure in Railway dashboard |

---

## Environment Variables Summary

### Frontend Production

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API URL |

### Backend Production

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude |
| `ALLOWED_ORIGINS` | Frontend URL for CORS |

---

## Pre-Deployment Checklist

### Frontend

- [ ] `VITE_API_URL` points to production backend
- [ ] Build completes without errors (`pnpm build`)
- [ ] No console errors in production build
- [ ] `netlify.toml` exists with correct settings

### Backend

- [ ] `ANTHROPIC_API_KEY` is set in Railway
- [ ] `ALLOWED_ORIGINS` includes production frontend URL
- [ ] `Dockerfile` exists and builds locally
- [ ] `.dockerignore` excludes unnecessary files
- [ ] `/health` endpoint responds

### Integration

- [ ] Frontend can reach backend (no CORS errors)
- [ ] Form submission returns AI response
- [ ] Error states display correctly

---

## Post-Deployment Verification

### Frontend

1. Open production URL
2. Verify page loads without errors
3. Check browser console for errors

### Backend

1. Check Railway deployment logs for errors
2. Test health endpoint:
```bash
   curl https://flonp-api.railway.app/health
```
3. Verify response:
```json
   {"status": "healthy", "version": "1.0.0"}
```

### End-to-End

1. Open frontend in browser
2. Fill form with valid values
3. Submit and verify results display
4. Test error handling (invalid values, etc.)

---

## Rollback

### Frontend (Netlify)

1. Go to Netlify dashboard → Deploys
2. Find previous working deploy
3. Click "Publish deploy"

### Backend (Railway)

1. Go to Railway dashboard → Deployments
2. Find previous working deployment
3. Click "Redeploy"

---

## Monitoring

### Frontend

- Netlify Analytics (optional add-on)
- Browser console for client-side errors

### Backend

- Railway logs (real-time in dashboard)
- Log total request duration for `/optimize` calls
- Monitor Anthropic API usage at console.anthropic.com

---

## Cost Considerations

### Netlify (Free Tier)

| Resource | Limit |
|----------|-------|
| Bandwidth | 100 GB/month |
| Build minutes | 300 minutes/month |
| Sites | Unlimited |

### Railway

| Resource | Cost |
|----------|------|
| Compute | ~$5-10/month for low traffic |
| No cold starts | Included in paid tier |

### Anthropic

| Model | Cost |
|-------|------|
| Claude 3.5 Haiku | ~$0.25/1M input tokens, ~$1.25/1M output tokens |
| Estimated per request | ~$0.001-0.005 |

---

## Troubleshooting

### Frontend Issues

| Issue | Solution |
|-------|----------|
| Build fails | Check Node version, verify `pnpm build` works locally |
| Blank page | Check browser console, verify `VITE_API_URL` is set |
| Old content | Clear Netlify cache and redeploy |

### Backend Issues

| Issue | Solution |
|-------|----------|
| Container won't start | Check Railway build logs, verify Dockerfile syntax |
| Health check fails | Ensure `/health` endpoint exists and responds |
| 500 errors | Check runtime logs for stack trace, verify `ANTHROPIC_API_KEY` |
| CORS errors | Verify `ALLOWED_ORIGINS` matches frontend URL exactly (no trailing slash) |
| Module not found | Check `requirements.txt` includes all dependencies |

### Docker Build Issues

| Issue | Solution |
|-------|----------|
| Build timeout | Optimize Dockerfile, use layer caching |
| Package install fails | Check `requirements.txt` versions, add system dependencies if needed |
| Image too large | Use `.dockerignore`, use slim base image |

### Integration Issues

| Issue | Solution |
|-------|----------|
| "Unable to connect" | Verify backend is running, check URL in frontend env |
| CORS errors | Check `ALLOWED_ORIGINS`, ensure no trailing slash |
| Timeout errors | Check Anthropic API status, verify API key |
