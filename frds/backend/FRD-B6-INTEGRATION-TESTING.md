# FRD-B6: Integration Testing

## Phase Overview

| Attribute | Value |
|-----------|-------|
| **Phase** | B6 |
| **Name** | Integration Testing |
| **Description** | Test with curl to verify everything works end-to-end |
| **Depends On** | FRD-B1, FRD-B2, FRD-B3, FRD-B4, FRD-B5 |
| **Blocking For** | None (Final Phase) |

---

## Objective

Execute comprehensive curl tests to verify the complete backend is working correctly. This phase confirms that all previous phases integrate properly and the API contract is fulfilled.

---

## Source Documentation

- `docs/src/content/docs/reference/api-specification.mdx` — Expected request/response formats
- `docs/src/content/docs/reference/error-handling.mdx` — Expected error responses

---

## Prerequisites

Before running tests:
1. All previous FRDs (B1-B5) must be complete
2. `.env` file must contain valid `ANTHROPIC_API_KEY`
3. Server must be running on `http://localhost:8000`

### Start the Server

In one terminal:
```bash
cd backend
uv run uvicorn app.main:app --reload --port 8000
```

Expected output:
```
FLONP API starting...
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

---

## Tests

Run all tests in a **separate terminal** while the server is running.

### Test 1: Health Check (GET /health)

**Purpose:** Verify server is running and responding.

```bash
curl -s http://localhost:8000/health | jq .
```

**Expected Response (200 OK):**
```json
{
  "status": "healthy",
  "version": "1.0.0"
}
```

**Pass Criteria:**
- [ ] Status code is 200
- [ ] Response contains `"status": "healthy"`
- [ ] Response contains `"version": "1.0.0"`

---

### Test 2: Valid Optimization Request (POST /optimize)

**Purpose:** Verify the happy path with valid inputs.

```bash
curl -s -X POST http://localhost:8000/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "lipid_composition": "SM-102",
    "lipid_concentration": 12.5,
    "solvent_type": "Ethanol 99%",
    "payload_type": "mRNA",
    "payload_concentration": 0.1,
    "buffer_type": "Citrate pH 4.0",
    "target_np_ratio": 6
  }' | jq .
```

**Expected Response (200 OK):**
```json
{
  "flow_rate_ratio": <number between 1.0-10.0>,
  "total_flow_rate": <number between 1.0-30.0>,
  "particle_predicted_size": <number between 30.0-300.0>,
  "pdi": <number between 0.01-0.50>,
  "encapsulation_efficiency": <number between 50.0-100.0>,
  "post_process": "<string 50-500 chars>",
  "reasoning": "<string 100-1000 chars>"
}
```

**Pass Criteria:**
- [ ] Status code is 200
- [ ] Response contains all 7 fields
- [ ] `flow_rate_ratio` is between 1.0 and 10.0
- [ ] `total_flow_rate` is between 1.0 and 30.0
- [ ] `particle_predicted_size` is between 30.0 and 300.0
- [ ] `pdi` is between 0.01 and 0.50
- [ ] `encapsulation_efficiency` is between 50.0 and 100.0
- [ ] `post_process` is a non-empty string
- [ ] `reasoning` is a non-empty string

---

### Test 3: Empty Payload Type (Edge Case)

**Purpose:** Verify payload_concentration=0.0 works with Empty payload.

```bash
curl -s -X POST http://localhost:8000/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "lipid_composition": "DOTAP/Chol",
    "lipid_concentration": 25.0,
    "solvent_type": "Ethanol 99%",
    "payload_type": "Empty",
    "payload_concentration": 0.0,
    "buffer_type": "PBS pH 7.4",
    "target_np_ratio": 10
  }' | jq .
```

**Expected Response (200 OK):**
- Response should contain all 7 fields
- No error about payload_concentration being 0.0

**Pass Criteria:**
- [ ] Status code is 200
- [ ] Response contains all 7 fields

---

### Test 4: Invalid Lipid Concentration (422 Error)

**Purpose:** Verify out-of-range values are rejected.

```bash
curl -s -X POST http://localhost:8000/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "lipid_composition": "SM-102",
    "lipid_concentration": 999,
    "solvent_type": "Ethanol 99%",
    "payload_type": "mRNA",
    "payload_concentration": 0.1,
    "buffer_type": "Citrate pH 4.0",
    "target_np_ratio": 6
  }' | jq .
```

**Expected Response (422 Unprocessable Entity):**
```json
{
  "detail": [
    {
      "type": "less_than_equal",
      "loc": ["body", "lipid_concentration"],
      "msg": "Input should be less than or equal to 50",
      "input": 999,
      ...
    }
  ]
}
```

**Pass Criteria:**
- [ ] Status code is 422
- [ ] Error references `lipid_concentration` field

---

### Test 5: Invalid Enum Value (422 Error)

**Purpose:** Verify invalid enum values are rejected.

```bash
curl -s -X POST http://localhost:8000/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "lipid_composition": "INVALID_LIPID",
    "lipid_concentration": 12.5,
    "solvent_type": "Ethanol 99%",
    "payload_type": "mRNA",
    "payload_concentration": 0.1,
    "buffer_type": "Citrate pH 4.0",
    "target_np_ratio": 6
  }' | jq .
```

**Expected Response (422 Unprocessable Entity):**
```json
{
  "detail": [
    {
      "type": "literal_error",
      "loc": ["body", "lipid_composition"],
      "msg": "Input should be 'SM-102', 'DOTAP/Chol' or 'Custom'",
      ...
    }
  ]
}
```

**Pass Criteria:**
- [ ] Status code is 422
- [ ] Error references `lipid_composition` field

---

### Test 6: Missing Required Field (422 Error)

**Purpose:** Verify missing fields are rejected.

```bash
curl -s -X POST http://localhost:8000/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "lipid_composition": "SM-102",
    "lipid_concentration": 12.5
  }' | jq .
```

**Expected Response (422 Unprocessable Entity):**
```json
{
  "detail": [
    {
      "type": "missing",
      "loc": ["body", "solvent_type"],
      "msg": "Field required",
      ...
    },
    ...
  ]
}
```

**Pass Criteria:**
- [ ] Status code is 422
- [ ] Error indicates missing required fields

---

### Test 7: Invalid JSON (400/422 Error)

**Purpose:** Verify malformed JSON is rejected.

```bash
curl -s -X POST http://localhost:8000/optimize \
  -H "Content-Type: application/json" \
  -d 'not valid json' | jq .
```

**Expected Response (422 Unprocessable Entity):**
```json
{
  "detail": [
    {
      "type": "json_invalid",
      "loc": ["body", 0],
      "msg": "JSON decode error",
      ...
    }
  ]
}
```

**Pass Criteria:**
- [ ] Status code is 400 or 422
- [ ] Error indicates JSON parsing failure

---

### Test 8: OpenAPI Documentation

**Purpose:** Verify API documentation is accessible.

```bash
curl -s http://localhost:8000/openapi.json | jq '.info'
```

**Expected Response:**
```json
{
  "title": "FLONP API",
  "description": "AI-powered LNP formulation optimizer",
  "version": "1.0.0"
}
```

**Pass Criteria:**
- [ ] Status code is 200
- [ ] OpenAPI spec contains correct title and version

---

### Test 9: CORS Headers

**Purpose:** Verify CORS is configured correctly.

```bash
curl -s -I -X OPTIONS http://localhost:8000/optimize \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  | grep -i "access-control"
```

**Expected Headers:**
```
access-control-allow-origin: http://localhost:5173
access-control-allow-methods: GET, POST, OPTIONS
access-control-allow-headers: content-type
access-control-max-age: 3600
```

**Pass Criteria:**
- [ ] `access-control-allow-origin` includes `http://localhost:5173`
- [ ] `access-control-allow-methods` includes `POST`

---

## Test Summary Checklist

| Test | Description | Status |
|------|-------------|--------|
| Test 1 | Health check returns 200 | [ ] Pass |
| Test 2 | Valid request returns FormulationResponse | [ ] Pass |
| Test 3 | Empty payload type works | [ ] Pass |
| Test 4 | Invalid concentration returns 422 | [ ] Pass |
| Test 5 | Invalid enum returns 422 | [ ] Pass |
| Test 6 | Missing field returns 422 | [ ] Pass |
| Test 7 | Invalid JSON returns 400/422 | [ ] Pass |
| Test 8 | OpenAPI docs accessible | [ ] Pass |
| Test 9 | CORS headers present | [ ] Pass |

---

## Acceptance Criteria

- [ ] Server starts without errors
- [ ] All 9 tests pass
- [ ] Response times for /optimize are under 10 seconds
- [ ] No errors in server logs during tests

---

## Backend Complete! 🎉

When all tests pass, the backend is ready for:
1. Frontend integration
2. Deployment to Railway

### Next Steps

1. Commit all backend code to git
2. Begin Frontend FRDs
3. Deploy to Railway (see deployment-guide.mdx)

---

## Troubleshooting

### Server won't start

| Issue | Solution |
|-------|----------|
| `ModuleNotFoundError` | Run `uv pip install -r requirements.txt` |
| `ANTHROPIC_API_KEY not set` | Check `.env` file exists with valid key |
| Port 8000 in use | Kill existing process or use different port |

### Tests fail

| Issue | Solution |
|-------|----------|
| Connection refused | Ensure server is running |
| 500 error | Check server logs, verify API key |
| Timeout | Check Anthropic API status |
| CORS error | Verify `ALLOWED_ORIGINS` in `.env` |

### API Key Issues

| Issue | Solution |
|-------|----------|
| Invalid API key | Verify key at console.anthropic.com |
| Rate limited | Wait 1 minute, retry |
| Key expired | Generate new key |
