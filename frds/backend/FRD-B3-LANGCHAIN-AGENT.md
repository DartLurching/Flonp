# FRD-B3: LangChain Agent

## Phase Overview

| Attribute | Value |
|-----------|-------|
| **Phase** | B3 |
| **Name** | LangChain Agent |
| **Description** | Create Claude integration with parsers and system prompt |
| **Depends On** | FRD-B1, FRD-B2 |
| **Blocking For** | FRD-B4, FRD-B6 |

---

## Objective

Implement the LangChain agent that calls Claude 3.5 Haiku to generate formulation recommendations. This module handles prompt construction, LLM communication, output parsing, and retry logic.

---

## Source Documentation

- `docs/src/content/docs/architecture/agent-architecture.mdx` — LangChain setup, parsers, retry logic
- `docs/src/content/docs/getting-started/domain-context.mdx` — Scientific knowledge for system prompt

---

## Tasks

### Task 1: Implement `app/agent.py`

**File:** `backend/app/agent.py`

**Complete Implementation:**

```python
"""
LangChain agent for LNP formulation optimization.

This module handles:
- LLM initialization and configuration
- Prompt construction with domain knowledge
- Output parsing with retry logic
- Error handling for API failures
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
# Output Parsers
# =============================================================================

parser = PydanticOutputParser(pydantic_object=FormulationResponse)
fixing_parser = OutputFixingParser.from_llm(parser=parser, llm=llm)


# =============================================================================
# System Prompt
# =============================================================================

SYSTEM_PROMPT = """You are an expert in lipid nanoparticle (LNP) formulation for microfluidic synthesis. Your role is to generate optimized flow parameters and predict particle characteristics based on input formulation parameters.

## DOMAIN KNOWLEDGE

### What are LNPs?
Lipid Nanoparticles are microscopic spherical structures (50-200nm) composed of lipid molecules that encapsulate and deliver therapeutic payloads like mRNA into human cells. They are the delivery vehicle behind COVID-19 mRNA vaccines.

### Key Components
- **Ionizable Lipid** (e.g., SM-102): Becomes positively charged at low pH to bind RNA, neutral at physiological pH
- **Structural Lipid** (e.g., DSPC): Provides particle integrity
- **Cholesterol**: Increases membrane rigidity
- **PEGylated Lipid**: Creates stealth coating to prevent immune clearance

### Microfluidic Synthesis
Two streams meet in a chip:
1. **Organic phase**: Lipids dissolved in ethanol
2. **Aqueous phase**: RNA in acidic buffer

When they mix:
- Ethanol dilution triggers lipid self-assembly
- Ionizable lipids (positive at low pH) bind RNA (negative)
- Particles form in milliseconds

### Critical Relationships

**Flow Rate Ratio (FRR)** - Aqueous:Organic ratio
- 1:1 → High ethanol, larger particles
- 3:1 → Standard, good balance (RECOMMENDED)
- 5:1 → Lower ethanol, smaller particles but lower yield

**Total Flow Rate (TFR)**
- < 5 mL/min → Slow mixing, larger particles, high variability
- 8-15 mL/min → Optimal, small uniform particles (RECOMMENDED)
- > 20 mL/min → Very fast, excellent uniformity but high pressure

**N/P Ratio**
- < 4 → Insufficient lipid, poor encapsulation
- 4-6 → Optimal for most formulations
- > 10 → Excess lipid, may increase cytotoxicity

**Buffer pH**
- pH 4.0 (Citrate) → Best for ionizable lipids like SM-102
- pH 5.0 (Acetate) → Alternative for some formulations
- pH 7.4 (PBS) → Typically post-synthesis, not for mixing

**Target Particle Characteristics**
- Size: 60-100 nm for vaccines, 80-120 nm for gene therapy
- PDI: < 0.2 is good quality, < 0.1 is excellent
- Encapsulation: > 90% is excellent, > 80% is acceptable

## TASK INSTRUCTIONS

1. Analyze the input parameters (lipid composition, concentrations, buffer, N/P ratio)
2. Apply the domain knowledge above to determine optimal flow parameters
3. Predict the resulting particle characteristics
4. Provide post-processing instructions appropriate for the formulation
5. Explain your scientific reasoning

## OUTPUT CONSTRAINTS

- flow_rate_ratio: Between 1.0 and 10.0 (recommend 2.5-4.0 for most cases)
- total_flow_rate: Between 1.0 and 30.0 mL/min (recommend 10-15 for quality)
- particle_predicted_size: Between 30.0 and 300.0 nm (target 60-100 for vaccines)
- pdi: Between 0.01 and 0.50 (target < 0.2)
- encapsulation_efficiency: Between 50.0 and 100.0% (target > 85%)
- post_process: 50-500 characters of dialysis/buffer exchange instructions
- reasoning: 100-1000 characters explaining your parameter choices

## OUTPUT FORMAT

{format_instructions}

IMPORTANT: Return ONLY the JSON object. No markdown, no explanation outside the JSON.
"""


# =============================================================================
# User Message Template
# =============================================================================

USER_MESSAGE_TEMPLATE = """Generate optimized flow parameters for this LNP formulation:

ORGANIC PHASE:
- Lipid Composition: {lipid_composition}
- Lipid Concentration: {lipid_concentration} mM
- Solvent: {solvent_type}

AQUEOUS PHASE:
- Payload Type: {payload_type}
- Payload Concentration: {payload_concentration} mg/mL
- Buffer: {buffer_type}

PROCESS TARGET:
- N/P Ratio: {target_np_ratio}

Return optimized flow parameters, predicted characteristics, post-processing instructions, and scientific reasoning."""


# =============================================================================
# Prompt Template
# =============================================================================

prompt = ChatPromptTemplate.from_messages([
    ("system", SYSTEM_PROMPT),
    ("human", USER_MESSAGE_TEMPLATE),
])

# Inject format instructions from parser
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
        TimeoutError: If LLM does not respond within timeout (60s)
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

## Component Reference

### LLM Configuration

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| `model` | `claude-3-5-haiku-20241022` | Fast, cost-effective, sufficient reasoning |
| `temperature` | `0.1` | Low variance for consistent outputs |
| `max_tokens` | `1024` | Sufficient for response + reasoning |
| `timeout` | `60.0` | Prevent indefinite hanging |

### Retry Logic Flow

```
LLM returns response
       │
       ▼
PydanticOutputParser.parse(response)
       │
       ├─── Success ──────▶ Return result
       │
       ▼
OutputParserException raised
       │
       ▼
OutputFixingParser.parse(response)
       │
       ├─── Success ──────▶ Return result
       │
       ▼
OutputParserException raised again
       │
       ▼
Raise RuntimeError ───────▶ HTTP 500
```

### Error Mapping

| Exception | Raised Error | HTTP Status |
|-----------|--------------|-------------|
| `APITimeoutError` | `TimeoutError("AI service timeout")` | 504 |
| `APIError` | `RuntimeError("AI service error: ...")` | 500 |
| `OutputParserException` (after retry) | `RuntimeError("Failed to generate valid formulation")` | 500 |

---

## Verification

### Verification 1: Import agent module

```bash
cd backend
uv run python -c "from app.agent import generate_formulation, llm, parser; print('Agent imported successfully')"
```

**Expected Output:**
```
Agent imported successfully
```

### Verification 2: Verify LLM configuration

```bash
cd backend
uv run python -c "
from app.agent import llm
print('Model:', llm.model)
print('Temperature:', llm.temperature)
print('Max tokens:', llm.max_tokens)
"
```

**Expected Output:**
```
Model: claude-3-5-haiku-20241022
Temperature: 0.1
Max tokens: 1024
```

### Verification 3: Verify parser generates format instructions

```bash
cd backend
uv run python -c "
from app.agent import parser
instructions = parser.get_format_instructions()
print('Format instructions length:', len(instructions))
print('Contains flow_rate_ratio:', 'flow_rate_ratio' in instructions)
"
```

**Expected Output:**
```
Format instructions length: <number greater than 0>
Contains flow_rate_ratio: True
```

### Verification 4: Verify prompt template has all placeholders

```bash
cd backend
uv run python -c "
from app.agent import USER_MESSAGE_TEMPLATE
fields = ['lipid_composition', 'lipid_concentration', 'solvent_type', 
          'payload_type', 'payload_concentration', 'buffer_type', 'target_np_ratio']
for field in fields:
    assert '{' + field + '}' in USER_MESSAGE_TEMPLATE, f'Missing: {field}'
print('All 7 placeholders present in template')
"
```

**Expected Output:**
```
All 7 placeholders present in template
```

---

## Acceptance Criteria

- [ ] `app/agent.py` contains complete implementation (replaces stub)
- [ ] LLM configured with correct model, temperature, max_tokens, timeout
- [ ] System prompt contains domain knowledge from domain-context.mdx
- [ ] User message template includes all 7 input fields
- [ ] PydanticOutputParser configured for FormulationResponse
- [ ] OutputFixingParser wraps the primary parser
- [ ] `generate_formulation()` is async and returns FormulationResponse
- [ ] Error handling maps to TimeoutError and RuntimeError
- [ ] All 4 verification commands pass

---

## Next Phase

Once all acceptance criteria pass, proceed to **FRD-B4: FastAPI Application**.
