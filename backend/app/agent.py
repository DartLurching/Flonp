"""
LangChain agent for LNP formulation optimization.

This module handles:
- LLM initialization and configuration
- Prompt construction with domain knowledge
- Output parsing with retry logic
- Error handling for API failures
"""

from dotenv import load_dotenv
load_dotenv()

from langchain_anthropic import ChatAnthropic
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.exceptions import OutputParserException
from anthropic import APITimeoutError, APIError

from app.models import FormulationRequest, FormulationResponse


# LLM Configuration

llm = ChatAnthropic(
    model="claude-3-5-haiku-20241022",
    temperature=0.1,
    max_tokens=1024,
)


# Output Parser

parser = PydanticOutputParser(pydantic_object=FormulationResponse)


# System Prompt

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


# User Message Template

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


# Prompt Template

prompt = ChatPromptTemplate.from_messages([
    ("system", SYSTEM_PROMPT),
    ("human", USER_MESSAGE_TEMPLATE),
])

# Inject format instructions from parser
prompt = prompt.partial(format_instructions=parser.get_format_instructions())


# Retry Prompt for Fixing Invalid Output

FIX_PROMPT = """The previous response was not valid JSON or didn't match the schema.

Error: {error}

Previous response:
{completion}

Please generate a corrected response that matches the required schema exactly.

{format_instructions}

IMPORTANT: Return ONLY the valid JSON object. No markdown code blocks, no additional text."""

fix_prompt = ChatPromptTemplate.from_template(FIX_PROMPT)


# Main Function

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
            return result
        except OutputParserException as parse_error:
            # Retry with fixing prompt
            fix_messages = fix_prompt.format_messages(
                error=str(parse_error),
                completion=response.content,
                format_instructions=parser.get_format_instructions()
            )
            retry_response = await llm.ainvoke(fix_messages)
            result = parser.parse(retry_response.content)
            return result
        
    except APITimeoutError as e:
        raise TimeoutError("AI service timeout") from e
    except APIError as e:
        raise RuntimeError(f"AI service error: {e}") from e
    except OutputParserException as e:
        raise RuntimeError("Failed to generate valid formulation") from e
