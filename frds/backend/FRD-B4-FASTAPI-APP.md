# FRD-B4: FastAPI Application

## Phase Overview

| Attribute | Value |
|-----------|-------|
| **Phase** | B4 |
| **Name** | FastAPI Application |
| **Description** | Create endpoints, CORS middleware, and error handling |
| **Depends On** | FRD-B1, FRD-B2, FRD-B3 |
| **Blocking For** | FRD-B6 |

---

## Objective

Implement the FastAPI application with the `/optimize` endpoint, `/health` endpoint, CORS middleware, and standardized error handling. This is the HTTP layer that ties together models and agent.

---

## Source Documentation

- `docs/src/content/docs/reference/api-specification.mdx` — Endpoint definitions, request/response formats
- `docs/src/content/docs/reference/error-handling.mdx` — Error types, status codes, response format
- `docs/src/content/docs/architecture/system-architecture.mdx` — CORS configuration

---

## Tasks

### Task 1: Implement `app/main.py`

**File:** `backend/app/main.py`

**Complete Implementation:**

```python
"""
FastAPI application entry point for FLONP.

This module provides:
- POST /optimize endpoint for formulation recommendations
- GET /health endpoint for service monitoring
- CORS middleware for cross-origin requests
- Standardized error handling
"""

import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from app.models import FormulationRequest, FormulationResponse
from app.agent import generate_formulation


# Load environment variables
load_dotenv()


# =============================================================================
# Application Lifespan
# =============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup/shutdown."""
    # Startup
    print("FLONP API starting...")
    yield
    # Shutdown
    print("FLONP API shutting down...")


# =============================================================================
# FastAPI Application
# =============================================================================

app = FastAPI(
    title="FLONP API",
    description="AI-powered LNP formulation optimizer",
    version="1.0.0",
    lifespan=lifespan,
)


# =============================================================================
# CORS Middleware
# =============================================================================

# Read allowed origins from environment, default to localhost for development
allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173")
allowed_origins = [origin.strip() for origin in allowed_origins_str.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
    max_age=3600,
)


# =============================================================================
# Error Response Model
# =============================================================================

def create_error_response(
    error_code: str,
    message: str,
    details: dict | None = None
) -> dict:
    """Create standardized error response."""
    return {
        "error": error_code,
        "message": message,
        "details": details or {}
    }


# =============================================================================
# Exception Handlers
# =============================================================================

@app.exception_handler(ValidationError)
async def validation_exception_handler(request: Request, exc: ValidationError):
    """Handle Pydantic validation errors."""
    errors = exc.errors()
    if errors:
        first_error = errors[0]
        field = first_error["loc"][0] if first_error["loc"] else "unknown"
        return JSONResponse(
            status_code=422,
            content=create_error_response(
                error_code="VALIDATION_ERROR",
                message="Validation failed for one or more fields",
                details={
                    "field": str(field),
                    "constraint": first_error.get("msg", "Invalid value"),
                    "value": first_error.get("input")
                }
            )
        )
    return JSONResponse(
        status_code=422,
        content=create_error_response(
            error_code="VALIDATION_ERROR",
            message="Validation failed"
        )
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions with standardized format."""
    error_codes = {
        400: "INVALID_REQUEST",
        404: "NOT_FOUND",
        422: "VALIDATION_ERROR",
        500: "AI_PROCESSING_ERROR",
        504: "AI_TIMEOUT"
    }
    return JSONResponse(
        status_code=exc.status_code,
        content=create_error_response(
            error_code=error_codes.get(exc.status_code, "ERROR"),
            message=exc.detail
        )
    )


# =============================================================================
# Endpoints
# =============================================================================

@app.get("/health")
async def health_check():
    """
    Health check endpoint for monitoring and deployment verification.
    
    Returns:
        Health status and API version
    """
    return {
        "status": "healthy",
        "version": "1.0.0"
    }


@app.post("/optimize", response_model=FormulationResponse)
async def optimize(request: FormulationRequest) -> FormulationResponse:
    """
    Generate optimized LNP formulation parameters.
    
    Takes formulation inputs (lipid composition, concentrations, buffer, N/P ratio)
    and returns AI-generated optimization recommendations.
    
    Args:
        request: FormulationRequest with all input parameters
        
    Returns:
        FormulationResponse with optimized parameters and reasoning
        
    Raises:
        HTTPException 422: If request validation fails
        HTTPException 500: If AI processing fails
        HTTPException 504: If AI request times out
    """
    try:
        result = await generate_formulation(request)
        return result
    except TimeoutError:
        raise HTTPException(
            status_code=504,
            detail="AI processing timed out. Please try again."
        )
    except RuntimeError as e:
        raise HTTPException(
            status_code=500,
            detail="Failed to generate formulation recommendation. Please try again."
        )
    except Exception as e:
        # Catch any unexpected errors
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred. Please try again."
        )


# =============================================================================
# Development Entry Point
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
```

---

## Endpoint Reference

### GET /health

| Attribute | Value |
|-----------|-------|
| **Method** | GET |
| **Path** | `/health` |
| **Authentication** | None |

**Response (200 OK):**
```json
{
  "status": "healthy",
  "version": "1.0.0"
}
```

### POST /optimize

| Attribute | Value |
|-----------|-------|
| **Method** | POST |
| **Path** | `/optimize` |
| **Content-Type** | `application/json` |

**Error Responses:**

| Status | Error Code | Condition |
|--------|------------|-----------|
| 422 | `VALIDATION_ERROR` | Field validation failed |
| 500 | `AI_PROCESSING_ERROR` | LLM failed after retry |
| 504 | `AI_TIMEOUT` | LLM request exceeded timeout |

---

## Verification

### Verification 1: Import main module

```bash
cd backend
uv run python -c "from app.main import app; print('Main module imported successfully')"
```

**Expected Output:**
```
Main module imported successfully
```

### Verification 2: Verify FastAPI app configuration

```bash
cd backend
uv run python -c "
from app.main import app
print('Title:', app.title)
print('Version:', app.version)
print('Routes:', [r.path for r in app.routes if hasattr(r, 'path')])
"
```

**Expected Output:**
```
Title: FLONP API
Version: 1.0.0
Routes: ['/health', '/optimize', '/openapi.json', '/docs', '/docs/oauth2-redirect', '/redoc']
```

### Verification 3: Verify CORS middleware is configured

```bash
cd backend
uv run python -c "
from app.main import app, allowed_origins
print('CORS origins:', allowed_origins)
print('Middleware count:', len(app.user_middleware))
"
```

**Expected Output:**
```
CORS origins: ['http://localhost:5173']
Middleware count: 1
```

### Verification 4: Start server (manual check)

```bash
cd backend
uv run uvicorn app.main:app --port 8000 &
sleep 3
curl -s http://localhost:8000/health
kill %1
```

**Expected Output:**
```
FLONP API starting...
{"status":"healthy","version":"1.0.0"}
```

**Note:** If running interactively, start server in one terminal and test in another.

---

## Acceptance Criteria

- [ ] `app/main.py` contains complete implementation (replaces stub)
- [ ] FastAPI app configured with title, description, version
- [ ] CORS middleware reads `ALLOWED_ORIGINS` from environment
- [ ] GET `/health` endpoint exists and returns correct response
- [ ] POST `/optimize` endpoint exists and calls `generate_formulation`
- [ ] Error handlers return standardized JSON format
- [ ] 500 errors use `AI_PROCESSING_ERROR` code
- [ ] 504 errors use `AI_TIMEOUT` code
- [ ] All 4 verification commands pass

---

## Next Phase

Once all acceptance criteria pass, proceed to **FRD-B5: Environment Configuration**.
