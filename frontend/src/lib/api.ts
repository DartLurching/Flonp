import type { FormulationResult, ApiError } from '@/types/formulation';
import type { FormulationSchemaType } from '@/lib/schemas';

// CONFIGURATION

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Frontend fetch timeout: 30 seconds
const TIMEOUT_MS = 30000;

// CASE CONVERSION UTILITIES
// Frontend uses camelCase, Backend uses snake_case

/**
 * Convert camelCase to snake_case for API request
 */
function toSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key in obj) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    result[snakeKey] = obj[key];
  }
  return result;
}

/**
 * Convert snake_case to camelCase for API response
 */
function toCamelCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = obj[key];
  }
  return result;
}

// ERROR HANDLING

export class ApiRequestError extends Error {
  status: number;
  errorCode?: string;
  details?: ApiError['details'];

  constructor(
    message: string,
    status: number,
    errorCode?: string,
    details?: ApiError['details']
  ) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.errorCode = errorCode;
    this.details = details;
  }
}

/**
 * Parse error response from API
 * Error format from docs-source/API_SPECIFICATION.md → Error Responses
 */
async function handleErrorResponse(response: Response): Promise<never> {
  let errorData: ApiError;
  
  try {
    errorData = await response.json();
  } catch {
    throw new ApiRequestError(
      'Unable to connect to server',
      response.status
    );
  }

  // Use message from API response
  const message = errorData.message || 'An error occurred';
  throw new ApiRequestError(
    message,
    response.status,
    errorData.error,
    errorData.details
  );
}

// API FUNCTIONS

/**
 * Call POST /optimize endpoint
 */
export async function optimizeFormulation(
  input: FormulationSchemaType
): Promise<FormulationResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    // Convert camelCase to snake_case for backend
    const requestBody = toSnakeCase(input as unknown as Record<string, unknown>);

    const response = await fetch(`${API_URL}/optimize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    if (!response.ok) {
      await handleErrorResponse(response);
    }

    const data = await response.json();
    
    // Convert snake_case to camelCase for frontend
    return toCamelCase(data) as unknown as FormulationResult;

  } catch (error) {
    if (error instanceof ApiRequestError) {
      throw error;
    }
    
    if (error instanceof Error) {
      // AbortError = timeout
      if (error.name === 'AbortError') {
        throw new ApiRequestError(
          'Request timed out. Please try again.',
          408
        );
      }
      
      // Network error
      throw new ApiRequestError(
        'Unable to connect to server.',
        0
      );
    }
    
    throw new ApiRequestError('An unexpected error occurred', 500);
    
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Check API health
 */
export async function checkHealth(): Promise<{ status: string; version: string }> {
  const response = await fetch(`${API_URL}/health`);
  
  if (!response.ok) {
    throw new Error('Health check failed');
  }
  
  return response.json();
}
