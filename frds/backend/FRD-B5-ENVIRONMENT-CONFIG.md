# FRD-B5: Environment Configuration

## Phase Overview

| Attribute | Value |
|-----------|-------|
| **Phase** | B5 |
| **Name** | Environment Configuration |
| **Description** | Create .env.example, .gitignore, and local .env file |
| **Depends On** | FRD-B1 |
| **Blocking For** | FRD-B6 |

---

## Objective

Create environment configuration files that:
1. Document required environment variables (`.env.example`)
2. Prevent sensitive files from being committed (`.gitignore`)
3. Set up local development environment (`.env`)

---

## Source Documentation

- `docs/src/content/docs/guides/development-setup.mdx` — Environment variables
- `docs/src/content/docs/guides/deployment-guide.mdx` — Production configuration

---

## Tasks

### Task 1: Create `.env.example`

**File:** `backend/.env.example`

**Contents:**
```env
# =============================================================================
# FLONP Backend Environment Variables
# =============================================================================
# Copy this file to .env and fill in your values:
#   cp .env.example .env
# =============================================================================

# -----------------------------------------------------------------------------
# Anthropic API (Required)
# -----------------------------------------------------------------------------
# Get your API key at: https://console.anthropic.com/
# Cost: ~$0.25/1M input tokens, ~$1.25/1M output tokens for Claude 3.5 Haiku
ANTHROPIC_API_KEY=

# -----------------------------------------------------------------------------
# CORS Configuration (Required for Frontend)
# -----------------------------------------------------------------------------
# Comma-separated list of allowed origins
# Development: http://localhost:5173
# Production: https://flonp.netlify.app
ALLOWED_ORIGINS=http://localhost:5173
```

### Task 2: Create `.gitignore`

**File:** `backend/.gitignore`

**Contents:**
```gitignore
# =============================================================================
# Python
# =============================================================================
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# =============================================================================
# Virtual Environments
# =============================================================================
.venv/
venv/
ENV/
env/

# =============================================================================
# Environment Variables (SENSITIVE - Never Commit!)
# =============================================================================
.env
.env.local
.env.*.local
!.env.example

# =============================================================================
# IDE and Editors
# =============================================================================
.vscode/
.idea/
*.swp
*.swo
*~
.project
.pydevproject
.settings/

# =============================================================================
# Testing
# =============================================================================
.pytest_cache/
.coverage
htmlcov/
.tox/
.nox/
coverage.xml
*.cover
*.py,cover

# =============================================================================
# OS Generated
# =============================================================================
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# =============================================================================
# Logs
# =============================================================================
*.log
logs/
```

### Task 3: Create local `.env` file

**File:** `backend/.env`

**Instructions:**
1. Copy `.env.example` to `.env`
2. Add your Anthropic API key

```bash
cd backend
cp .env.example .env
```

Then edit `.env` and add your API key:
```env
ANTHROPIC_API_KEY=sk-ant-your-key-here
ALLOWED_ORIGINS=http://localhost:5173
```

**IMPORTANT:** 
- The `.env` file contains secrets and must NEVER be committed to git
- Each developer needs their own Anthropic API key
- Get your key at: https://console.anthropic.com/

---

## Verification

### Verification 1: Check .env.example exists and has required variables

```bash
cd backend
cat .env.example | grep -E "^(ANTHROPIC_API_KEY|ALLOWED_ORIGINS)="
```

**Expected Output:**
```
ANTHROPIC_API_KEY=
ALLOWED_ORIGINS=http://localhost:5173
```

### Verification 2: Check .gitignore excludes .env but not .env.example

```bash
cd backend
grep -E "^\.env$|^\!\.env\.example$" .gitignore
```

**Expected Output:**
```
.env
!.env.example
```

### Verification 3: Verify .env file exists (after manual creation)

```bash
cd backend
test -f .env && echo ".env file exists" || echo ".env file NOT found - create it!"
```

**Expected Output:**
```
.env file exists
```

### Verification 4: Verify environment variables load correctly

```bash
cd backend
uv run python -c "
from dotenv import load_dotenv
import os

load_dotenv()

api_key = os.getenv('ANTHROPIC_API_KEY', '')
origins = os.getenv('ALLOWED_ORIGINS', '')

print('ANTHROPIC_API_KEY set:', len(api_key) > 0 and api_key.startswith('sk-ant-'))
print('ALLOWED_ORIGINS:', origins)
"
```

**Expected Output:**
```
ANTHROPIC_API_KEY set: True
ALLOWED_ORIGINS: http://localhost:5173
```

### Verification 5: Verify .env is ignored by git

```bash
cd backend
# Initialize git if not already done
git init 2>/dev/null || true
git status --porcelain .env 2>/dev/null | grep -q ".env" && echo "WARNING: .env is tracked!" || echo ".env is correctly ignored"
```

**Expected Output:**
```
.env is correctly ignored
```

---

## Acceptance Criteria

- [ ] `.env.example` exists with documented variables
- [ ] `.env.example` contains `ANTHROPIC_API_KEY=` (empty, for user to fill)
- [ ] `.env.example` contains `ALLOWED_ORIGINS=http://localhost:5173`
- [ ] `.gitignore` exists with comprehensive ignore rules
- [ ] `.gitignore` excludes `.env` but includes `.env.example`
- [ ] Local `.env` file created with actual API key
- [ ] Environment variables load correctly with `python-dotenv`
- [ ] `.env` is not tracked by git

---

## Security Reminders

1. **NEVER commit `.env` files** — They contain API keys
2. **NEVER share API keys** — Each developer needs their own
3. **Rotate keys if exposed** — Generate new key at console.anthropic.com
4. **Use environment variables in production** — Don't use `.env` files in Railway

---

## Next Phase

Once all acceptance criteria pass, proceed to **FRD-B6: Integration Testing**.
