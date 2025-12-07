# FLONP — Agent Architecture

## Overview

This document describes how FLONP integrates with Claude 3.5 Haiku via LangChain to generate formulation recommendations. The agent receives validated user inputs, constructs a prompt, calls the LLM, parses the structured response, and handles failures gracefully.

---

## Architecture Diagram
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              AGENT FLOW                                     │
└─────────────────────────────────────────────────────────────────────────────┘

    FormulationRequest (validated by Pydantic)
                │
                ▼
    ┌───────────────────────┐
    │   PROMPT CONSTRUCTION │
    │   ─────────────────── │
    │   • System prompt     │
    │   • User parameters   │
    │   • Output format     │
    └───────────┬───────────┘
                │
                ▼
    ┌───────────────────────┐
    │   LLM CALL            │
    │   ─────────────────── │
    │   ChatAnthropic       │
    │   claude-3-5-haiku    │
    └───────────┬───────────┘
                │
                ▼
    ┌───────────────────────┐
    │   OUTPUT PARSING      │
    │   ─────────────────── │
    │   PydanticOutputParser│
    │         │             │
    │         ▼             │
    │   Parse successful?   │
    │     │           │     │
    │    Yes          No    │
    │     │           │     │
    │     │    OutputFixingParser
    │     │           │     │
    │     │      Retry once │
    │     │           │     │
    │     ▼           ▼     │
    └───────────┬───────────┘
                │
                ▼
    FormulationResponse (or Error)
```

---

## Components

### 1. ChatAnthropic (LLM Client)

The LangChain wrapper for Anthropic's API.
```python
from langchain_anthropic import ChatAnthropic

llm = ChatAnthropic(
    model="claude-3-5-haiku-20241022",
    temperature=0.1,
    max_tokens=1024,
    timeout=60.0,
)
```

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| `model` | `claude-3-5-haiku-20241022` | Fast, cost-effective, sufficient reasoning |
| `temperature` | `0.1` | Low variance for consistent, reproducible outputs |
| `max_tokens` | `1024` | Sufficient for response + reasoning |
| `timeout` | `60.0` | Prevent indefinite hanging |

### 2. ChatPromptTemplate (Prompt Construction)

Constructs the full prompt from system instructions and user input.
```python
from langchain_core.prompts import ChatPromptTemplate

prompt = ChatPromptTemplate.from_messages([
    ("system", SYSTEM_PROMPT),
    ("human", "{user_input}"),
])
```

### 3. PydanticOutputParser (Structured Output)

Forces the LLM to return JSON matching the `FormulationResponse` schema.
```python
from langchain_core.output_parsers import PydanticOutputParser
from app.models import FormulationResponse

parser = PydanticOutputParser(pydantic_object=FormulationResponse)
```

The parser provides format instructions that are injected into the prompt, telling Claude exactly what JSON structure to return.

### 4. OutputFixingParser (Retry Logic)

Wraps the primary parser and attempts to fix malformed outputs.
```python
from langchain.output_parsers import OutputFixingParser

fixing_parser = OutputFixingParser.from_llm(
    parser=parser,
    llm=llm,
)
```

When the primary parser fails, `OutputFixingParser`:
1. Takes the malformed output
2. Sends it back to the LLM with instructions to fix it
3. Attempts to parse the corrected output
4. Raises an exception if it still fails

---

## Prompt Structure

The prompt consists of two parts:

### System Prompt

Contains domain knowledge, instructions, and output format requirements.
```python
# app/agent.py

SYSTEM_PROMPT = """
[DOMAIN CONTEXT]
# TODO: Add LNP formulation domain knowledge
# - What LNPs are and how microfluidic synthesis works
# - Relationship between inputs and outputs
# - Physical constraints and valid ranges

[TASK INSTRUCTIONS]
# TODO: Add specific instructions for the task
# - How to analyze the input parameters
# - What logic to apply for recommendations
# - How to generate scientific reasoning

[OUTPUT FORMAT]
{format_instructions}

[CONSTRAINTS]
# TODO: Add output constraints
# - Valid ranges for each output field
# - Quality targets (PDI < 0.2, size 60-100nm for vaccines)
# - Post-processing requirements based on lipid type
"""
```

### User Message

Contains the formatted input parameters from the request.
```python
USER_MESSAGE_TEMPLATE = """
Please generate optimized flow parameters for the following LNP formulation:

Organic Phase:
- Lipid Composition: {lipid_composition}
- Lipid Concentration: {lipid_concentration} mM
- Solvent: {solvent_type}

Aqueous Phase:
- Payload Type: {payload_type}
- Payload Concentration: {payload_concentration} mg/mL
- Buffer: {buffer_type}

Process Target:
- N/P Ratio: {target_np_ratio}
"""
```

---

## Chain Construction

The complete chain connects all components:
```python
# app/agent.py

from langchain_anthropic import ChatAnthropic
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from langchain.output_parsers import OutputFixingParser

from app.models import FormulationRequest, FormulationResponse


# Initialize LLM
llm = ChatAnthropic(
    model="claude-3-5-haiku-20241022",
    temperature=0.1,
    max_tokens=1024,
    timeout=60.0,
)

# Initialize parser
parser = PydanticOutputParser(pydantic_object=FormulationResponse)

# Initialize fixing parser for retry logic
fixing_parser = OutputFixingParser.from_llm(parser=parser, llm=llm)

# Build prompt template
SYSTEM_PROMPT = """
... (system prompt content) ...

{format_instructions}
"""

prompt = ChatPromptTemplate.from_messages([
    ("system", SYSTEM_PROMPT),
    ("human", USER_MESSAGE_TEMPLATE),
])

# Inject format instructions into prompt
prompt = prompt.partial(format_instructions=parser.get_format_instructions())
```

---

## Main Function

The entry point called by the FastAPI endpoint:
```python
# app/agent.py

from langchain_core.exceptions import OutputParserException
from anthropic import APITimeoutError, APIError

from app.models import FormulationRequest, FormulationResponse


async def generate_formulation(request: FormulationRequest) -> FormulationResponse:
    """
    Generate optimized LNP formulation parameters using Claude.
    
    Args:
        request: Validated formulation input parameters
        
    Returns:
        FormulationResponse with optimized parameters and reasoning
        
    Raises:
        TimeoutError: If LLM does not respond within timeout
        RuntimeError: If LLM fails to generate valid response after retry
    """
    # Format the prompt with user inputs
    messages = prompt.format_messages(
        lipid_composition=request.lipid_composition,
        lipid_concentration=request.lipid_concentration,
        solvent_type=request.solvent_type,
        payload_type=request.payload_type,
        payload_concentration=request.payload_concentration,
        buffer_type=request.buffer_type,
        target_np_ratio=request.target_np_ratio,
    )
    
    try:
        # Call LLM
        response = await llm.ainvoke(messages)
        
        # Parse response
        try:
            result = parser.parse(response.content)
        except OutputParserException:
            # Retry with fixing parser
            result = fixing_parser.parse(response.content)
        
        return result
        
    except APITimeoutError as e:
        raise TimeoutError("AI service timeout") from e
    except APIError as e:
        raise RuntimeError(f"AI service error: {e}") from e
    except OutputParserException as e:
        raise RuntimeError("Failed to generate valid formulation") from e
```

---

## Error Handling

### Error Types and Responses

| Error | Cause | HTTP Status | User Message |
|-------|-------|-------------|--------------|
| `TimeoutError` | Anthropic API did not respond in 60s | 504 | "AI service timeout. Please try again." |
| `RuntimeError` (AI error) | Anthropic API returned an error | 500 | "Failed to generate formulation recommendation. Please try again." |
| `RuntimeError` (Parse error) | LLM output could not be parsed after retry | 500 | "Failed to generate formulation recommendation. Please try again." |

### FastAPI Integration
```python
# app/main.py

from fastapi import FastAPI, HTTPException
from app.agent import generate_formulation
from app.models import FormulationRequest, FormulationResponse

app = FastAPI()


@app.post("/optimize", response_model=FormulationResponse)
async def optimize(request: FormulationRequest) -> FormulationResponse:
    """Generate optimized LNP formulation parameters."""
    try:
        return await generate_formulation(request)
    except TimeoutError:
        raise HTTPException(
            status_code=504,
            detail="AI service timeout. Please try again."
        )
    except RuntimeError as e:
        raise HTTPException(
            status_code=500,
            detail="Failed to generate formulation recommendation. Please try again."
        )
```

---

## Retry Logic Flow
```
┌─────────────────────────────────────────────────────────────────┐
│                        RETRY FLOW                               │
└─────────────────────────────────────────────────────────────────┘

1. LLM returns response
          │
          ▼
2. PydanticOutputParser.parse(response)
          │
          ├─── Success ──────────────────────────▶ Return result
          │
          ▼
3. OutputParserException raised
          │
          ▼
4. OutputFixingParser.parse(response)
          │
          │    Internally:
          │    a. Send malformed output + fix instructions to LLM
          │    b. LLM returns corrected JSON
          │    c. Parse corrected output
          │
          ├─── Success ──────────────────────────▶ Return result
          │
          ▼
5. OutputParserException raised again
          │
          ▼
6. Raise RuntimeError ──────────────────────────▶ HTTP 500
```

### Why Only One Retry?

| Approach | Pros | Cons |
|----------|------|------|
| No retry | Faster failure | High failure rate with LLM formatting |
| One retry (chosen) | Recovers most formatting errors | Adds ~2s latency on failure |
| Multiple retries | Higher success rate | Compounds latency, hides systemic issues |

One retry catches the majority of formatting errors (usually minor JSON syntax issues) without masking deeper problems like prompt misunderstanding.

---

## Output Format Instructions

The `PydanticOutputParser` generates format instructions automatically from the schema:
```
The output should be formatted as a JSON instance that conforms to the JSON schema below.

{
  "flow_rate_ratio": <float between 1.0 and 10.0>,
  "total_flow_rate": <float between 1.0 and 30.0>,
  "particle_predicted_size": <float between 30.0 and 300.0>,
  "pdi": <float between 0.01 and 0.50>,
  "encapsulation_efficiency": <float between 50.0 and 100.0>,
  "post_process": <string>,
  "reasoning": <string>
}
```

These instructions are injected into the system prompt via `{format_instructions}`.

---

## Complete Agent File
```python
# app/agent.py

"""
LangChain agent for LNP formulation optimization.

This module handles:
- LLM initialization and configuration
- Prompt construction
- Output parsing with retry logic
- Error handling
"""

from langchain_anthropic import ChatAnthropic
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.exceptions import OutputParserException
from langchain.output_parsers import OutputFixingParser
from anthropic import APITimeoutError, APIError

from app.models import FormulationRequest, FormulationResponse


# =============================================================================
# LLM Configuration
# =============================================================================

llm = ChatAnthropic(
    model="claude-3-5-haiku-20241022",
    temperature=0.1,
    max_tokens=1024,
    timeout=60.0,
)


# =============================================================================
# Output Parser
# =============================================================================

parser = PydanticOutputParser(pydantic_object=FormulationResponse)
fixing_parser = OutputFixingParser.from_llm(parser=parser, llm=llm)


# =============================================================================
# Prompts
# =============================================================================

SYSTEM_PROMPT = """
[DOMAIN CONTEXT]
# TODO: Add LNP formulation domain knowledge

[TASK INSTRUCTIONS]
# TODO: Add specific instructions for the task

[OUTPUT FORMAT]
{format_instructions}

[CONSTRAINTS]
# TODO: Add output constraints
"""

USER_MESSAGE_TEMPLATE = """
Please generate optimized flow parameters for the following LNP formulation:

Organic Phase:
- Lipid Composition: {lipid_composition}
- Lipid Concentration: {lipid_concentration} mM
- Solvent: {solvent_type}

Aqueous Phase:
- Payload Type: {payload_type}
- Payload Concentration: {payload_concentration} mg/mL
- Buffer: {buffer_type}

Process Target:
- N/P Ratio: {target_np_ratio}
"""

prompt = ChatPromptTemplate.from_messages([
    ("system", SYSTEM_PROMPT),
    ("human", USER_MESSAGE_TEMPLATE),
])

# Inject format instructions
prompt = prompt.partial(format_instructions=parser.get_format_instructions())


# =============================================================================
# Main Function
# =============================================================================

async def generate_formulation(request: FormulationRequest) -> FormulationResponse:
    """
    Generate optimized LNP formulation parameters using Claude.
    
    Args:
        request: Validated formulation input parameters
        
    Returns:
        FormulationResponse with optimized parameters and reasoning
        
    Raises:
        TimeoutError: If LLM does not respond within timeout
        RuntimeError: If LLM fails to generate valid response after retry
    """
    messages = prompt.format_messages(
        lipid_composition=request.lipid_composition,
        lipid_concentration=request.lipid_concentration,
        solvent_type=request.solvent_type,
        payload_type=request.payload_type,
        payload_concentration=request.payload_concentration,
        buffer_type=request.buffer_type,
        target_np_ratio=request.target_np_ratio,
    )
    
    try:
        response = await llm.ainvoke(messages)
        
        try:
            result = parser.parse(response.content)
        except OutputParserException:
            result = fixing_parser.parse(response.content)
        
        return result
        
    except APITimeoutError as e:
        raise TimeoutError("AI service timeout") from e
    except APIError as e:
        raise RuntimeError(f"AI service error: {e}") from e
    except OutputParserException as e:
        raise RuntimeError("Failed to generate valid formulation") from e
```

---

## Testing the Agent

### Manual Testing via Python
```python
# test_agent.py (not for production, just verification)

import asyncio
from app.models import FormulationRequest
from app.agent import generate_formulation

async def test():
    request = FormulationRequest(
        lipid_composition="SM-102",
        lipid_concentration=12.5,
        solvent_type="Ethanol 99%",
        payload_type="mRNA",
        payload_concentration=0.1,
        buffer_type="Citrate pH 4.0",
        target_np_ratio=6,
    )
    
    result = await generate_formulation(request)
    print(result.model_dump_json(indent=2))

if __name__ == "__main__":
    asyncio.run(test())
```

Run with:
```bash
cd backend
uv run python test_agent.py
```

### Expected Output
```json
{
  "flow_rate_ratio": 3.0,
  "total_flow_rate": 12.0,
  "particle_predicted_size": 75.5,
  "pdi": 0.12,
  "encapsulation_efficiency": 94.5,
  "post_process": "Dialyze against PBS pH 7.4 for 2 hours...",
  "reasoning": "SM-102 with Citrate pH 4.0 buffer enables..."
}
```

---

## Configuration via Environment

The agent uses one environment variable:

| Variable | Description | Required |
|----------|-------------|----------|
| `ANTHROPIC_API_KEY` | API key for Claude | Yes |

LangChain automatically reads `ANTHROPIC_API_KEY` from the environment.
