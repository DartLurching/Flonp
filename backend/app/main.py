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


# Application Lifespan

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup/shutdown."""
    # Startup
    print("FLONP API starting...")
    yield
    # Shutdown
    print("FLONP API shutting down...")


# FastAPI Application

app = FastAPI(
    title="FLONP API",
    description="AI-powered LNP formulation optimizer",
    version="1.0.0",
    lifespan=lifespan,
)


# CORS Middleware

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


# Error Response Model

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


# Exception Handlers

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


# Endpoints

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


# Development Entry Point

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
