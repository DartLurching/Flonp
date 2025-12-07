# FRD-B1: Project Structure

## Phase Overview

| Attribute | Value |
|-----------|-------|
| **Phase** | B1 |
| **Name** | Project Structure |
| **Description** | Initialize backend project structure: folders, configs, stubs |
| **Depends On** | None |
| **Blocking For** | FRD-B2, FRD-B3, FRD-B4, FRD-B5 |

---

## Objective

Create the backend project directory structure with configuration files, dependency definitions, and empty stub files. After this phase, `uv venv` and `uv pip install` should succeed.

---

## Source Documentation

- `docs/src/content/docs/architecture/tech-stack.mdx` — Versions and dependencies
- `docs/src/content/docs/guides/development-setup.mdx` — Directory structure

---

## Tasks

### Task 1: Create Directory Structure

Create the following structure inside `backend/`:

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── models.py
│   └── agent.py
├── .python-version
├── requirements.txt
└── pyproject.toml
```

### Task 2: Create `app/__init__.py`

**File:** `backend/app/__init__.py`

**Contents:**
```python
"""FLONP Backend Application."""
```

### Task 3: Create `app/main.py` (stub)

**File:** `backend/app/main.py`

**Contents:**
```python
"""FastAPI application entry point."""

# TODO: Implement in FRD-B4
```

### Task 4: Create `app/models.py` (stub)

**File:** `backend/app/models.py`

**Contents:**
```python
"""Pydantic models for request/response validation."""

# TODO: Implement in FRD-B2
```

### Task 5: Create `app/agent.py` (stub)

**File:** `backend/app/agent.py`

**Contents:**
```python
"""LangChain agent for LNP formulation optimization."""

# TODO: Implement in FRD-B3
```

### Task 6: Create `.python-version`

**File:** `backend/.python-version`

**Contents:**
```
3.10
```

### Task 7: Create `requirements.txt`

**File:** `backend/requirements.txt`

**Contents:**
```
fastapi==0.115.6
uvicorn[standard]==0.34.0
pydantic==2.10.4
python-dotenv==1.0.1
langchain==0.3.14
langchain-anthropic==0.3.1
```

### Task 8: Create `pyproject.toml`

**File:** `backend/pyproject.toml`

**Contents:**
```toml
[project]
name = "flonp-backend"
version = "1.0.0"
description = "FLONP - AI-powered LNP formulation optimizer"
readme = "README.md"
requires-python = ">=3.10"

[tool.uv]
dev-dependencies = []
```

---

## Verification

### Verification 1: Check directory structure

```bash
cd backend
find . -type f | grep -E "\.(py|txt|toml)$" | sort
```

**Expected Output:**
```
./app/__init__.py
./app/agent.py
./app/main.py
./app/models.py
./pyproject.toml
./requirements.txt
```

### Verification 2: Check .python-version exists

```bash
cd backend
cat .python-version
```

**Expected Output:**
```
3.10
```

### Verification 3: Create virtual environment

```bash
cd backend
uv venv --python 3.10
```

**Expected:** `.venv` directory created successfully, no errors.

### Verification 4: Install dependencies

```bash
cd backend
uv pip install -r requirements.txt
```

**Expected:** All packages install without errors.

### Verification 5: Verify imports work

```bash
cd backend
uv run python -c "import fastapi; import uvicorn; import pydantic; import langchain; print('All imports successful')"
```

**Expected Output:**
```
All imports successful
```

---

## Acceptance Criteria

- [ ] `backend/` directory exists
- [ ] `backend/app/` directory exists with 4 Python files
- [ ] All stub files contain TODO comments
- [ ] `.python-version` contains `3.10`
- [ ] `requirements.txt` contains all 6 dependencies with exact versions
- [ ] `pyproject.toml` has correct project metadata
- [ ] `uv venv --python 3.10` succeeds
- [ ] `uv pip install -r requirements.txt` succeeds
- [ ] All imports work correctly

---

## Next Phase

Once all acceptance criteria pass, proceed to **FRD-B2: Pydantic Models**.
