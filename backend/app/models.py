"""
Pydantic models for FLONP API request/response validation.

These models define the contract between frontend and backend,
and are used by LangChain's PydanticOutputParser.
"""

from typing import Literal
from pydantic import BaseModel, Field


# Type Aliases (Constrained Values)

LipidComposition = Literal["SM-102", "DOTAP/Chol", "Custom"]
PayloadType = Literal["mRNA", "siRNA", "pDNA", "Empty"]
BufferType = Literal["Citrate pH 4.0", "Acetate pH 5.0", "PBS pH 7.4"]
SolventType = Literal["Ethanol 99%"]


# Request Model

class FormulationRequest(BaseModel):
    """
    Input parameters for LNP formulation optimization.
    
    All fields are required. Constraints are based on physical
    limits of microfluidic synthesis.
    """
    
    # Organic Phase
    lipid_composition: LipidComposition = Field(
        ...,
        description="Lipid formulation type"
    )
    lipid_concentration: float = Field(
        ...,
        ge=10.0,
        le=50.0,
        description="Lipid concentration in millimolar (mM)"
    )
    solvent_type: SolventType = Field(
        ...,
        description="Organic solvent (fixed as Ethanol 99%)"
    )
    
    # Aqueous Phase
    payload_type: PayloadType = Field(
        ...,
        description="Type of nucleic acid payload"
    )
    payload_concentration: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Payload concentration in mg/mL (0.0 allowed for Empty payload)"
    )
    buffer_type: BufferType = Field(
        ...,
        description="Aqueous phase buffer"
    )
    
    # Process Target
    target_np_ratio: int = Field(
        ...,
        ge=4,
        le=20,
        description="Target nitrogen-to-phosphate ratio"
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "lipid_composition": "SM-102",
                    "lipid_concentration": 12.5,
                    "solvent_type": "Ethanol 99%",
                    "payload_type": "mRNA",
                    "payload_concentration": 0.1,
                    "buffer_type": "Citrate pH 4.0",
                    "target_np_ratio": 6
                }
            ]
        }
    }


# Response Model

class FormulationResponse(BaseModel):
    """
    AI-generated optimization recommendations.
    
    This model is used by LangChain's PydanticOutputParser to
    enforce structured output from Claude.
    """
    
    # Flow Parameters
    flow_rate_ratio: float = Field(
        ...,
        ge=1.0,
        le=10.0,
        description="Aqueous-to-organic flow ratio (e.g., 3.0 means 3:1)"
    )
    total_flow_rate: float = Field(
        ...,
        ge=1.0,
        le=30.0,
        description="Combined volumetric flow rate in mL/min"
    )
    
    # Predicted Characteristics
    particle_predicted_size: float = Field(
        ...,
        ge=30.0,
        le=300.0,
        description="Expected hydrodynamic diameter in nanometers"
    )
    pdi: float = Field(
        ...,
        ge=0.01,
        le=0.50,
        description="Polydispersity index (uniformity measure)"
    )
    encapsulation_efficiency: float = Field(
        ...,
        ge=50.0,
        le=100.0,
        description="Predicted RNA loading efficiency as percentage"
    )
    
    # Instructions and Reasoning
    post_process: str = Field(
        ...,
        min_length=50,
        max_length=500,
        description="Dialysis and buffer exchange instructions"
    )
    reasoning: str = Field(
        ...,
        min_length=100,
        max_length=1000,
        description="Scientific justification for recommended parameters"
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "flow_rate_ratio": 3.0,
                    "total_flow_rate": 12.0,
                    "particle_predicted_size": 80.0,
                    "pdi": 0.15,
                    "encapsulation_efficiency": 92.0,
                    "post_process": "Dialyze against PBS pH 7.4 for 2 hours to remove ethanol and exchange buffer. Use 100 kDa MWCO dialysis cassette. Final pH should be 7.4.",
                    "reasoning": "For SM-102 at pH 4.0 with mRNA, a 3:1 FRR provides optimal ionization for electrostatic complexation. The 12 mL/min TFR ensures rapid mixing (millisecond timescale) which produces uniform 80nm particles."
                }
            ]
        }
    }
