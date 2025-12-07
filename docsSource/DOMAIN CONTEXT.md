# FLONP — Domain Context

## Introduction

This document provides the scientific and technical foundation required to understand the FLONP platform. It is intended for developers, AI agents, and technical stakeholders who need to comprehend the domain logic behind the application's functionality without requiring a background in nanotechnology or pharmaceutical sciences.

The platform operates in the intersection of **nanomedicine**, **microfluidics**, and **pharmaceutical manufacturing**. Understanding these domains is essential for implementing accurate validation rules, meaningful error messages, and contextually appropriate AI interactions.

---

## The Science: Lipid Nanoparticles (LNPs)

### What Are LNPs?

Lipid Nanoparticles are microscopic spherical structures composed of lipid molecules that can encapsulate and deliver therapeutic payloads—most notably messenger RNA (mRNA)—into human cells. They gained global recognition as the delivery vehicle for COVID-19 mRNA vaccines (Pfizer-BioNTech and Moderna), but their applications extend to gene therapy, cancer treatment, and rare disease therapeutics.

Think of an LNP as a tiny protective bubble. The outer shell is made of lipids (fat-like molecules) that are biocompatible with human cells. Inside this shell, the therapeutic payload (such as mRNA) is protected from degradation and delivered safely to target cells.

### Why Size Matters

The size of an LNP directly affects its therapeutic efficacy:

| Size Range | Characteristics |
|------------|-----------------|
| < 50 nm | Often too small, may be cleared rapidly by kidneys |
| 50–100 nm | **Optimal range** for most therapeutic applications |
| 100–200 nm | Acceptable but may have reduced cellular uptake |
| > 200 nm | Risk of splenic filtration and reduced circulation time |

For vaccine applications, the target is typically **60–100 nm** with high uniformity (low polydispersity).

### Key Components of an LNP

A typical LNP formulation contains four types of lipids:

1. **Ionizable Lipid** (e.g., SM-102): The workhorse. At low pH, it becomes positively charged and binds to negatively charged RNA. At physiological pH (7.4), it becomes neutral, allowing the particle to circulate without triggering immune responses.

2. **Structural Lipid** (e.g., DSPC): Provides structural integrity to the particle.

3. **Cholesterol**: Increases membrane rigidity and helps with cellular uptake.

4. **PEGylated Lipid** (e.g., DMG-PEG2000): Creates a "stealth" coating that prevents rapid clearance by the immune system.

---

## The Technology: Microfluidic Synthesis

### Traditional vs. Microfluidic Approaches

Historically, LNPs were produced using bulk mixing methods—essentially combining lipid and aqueous solutions in a flask and mixing vigorously. This approach is simple but produces inconsistent results with high batch-to-batch variability.

**Microfluidic synthesis** revolutionized this process by enabling precise control over mixing conditions at the microscale. In a microfluidic chip, fluids are forced through channels narrower than a human hair, where they mix in milliseconds under highly controlled conditions.

### How Microfluidic LNP Synthesis Works

The process involves two input streams that meet in the chip:

```
    ORGANIC PHASE                    AQUEOUS PHASE
    (Lipids in Ethanol)              (RNA in Buffer)
           │                               │
           │                               │
           ▼                               ▼
    ┌──────────────────────────────────────────┐
    │                                          │
    │         MICROFLUIDIC CHIP                │
    │                                          │
    │    ═══════╗         ╔═══════             │
    │           ║         ║                    │
    │           ║         ║                    │
    │           ╚════╦════╝                    │
    │                ║                         │
    │                ║ ← Mixing Zone           │
    │                ║                         │
    │                ▼                         │
    └──────────────────────────────────────────┘
                     │
                     ▼
              LNP SUSPENSION
         (Nanoparticles in Buffer)
```

When the organic phase (lipids dissolved in ethanol) meets the aqueous phase (RNA in buffer), several things happen simultaneously:

1. **Polarity Shift**: The sudden dilution of ethanol triggers lipid self-assembly
2. **Electrostatic Complexation**: Ionizable lipids (positively charged at low pH) bind to RNA (negatively charged)
3. **Nanoparticle Formation**: Lipids spontaneously form spherical structures encapsulating the RNA

The entire process occurs in **milliseconds**, and the mixing conditions (flow rates, ratios) determine the final particle characteristics.

---

## Critical Process Variables

### Input Variables (User-Controlled)

#### A. Organic Phase Parameters

**Lipid Composition (`lipid_composition`)**

The specific lipid mixture determines the particle's physicochemical properties and biological behavior.

| Option | Description | Typical Use Case |
|--------|-------------|------------------|
| SM-102 | Moderna's ionizable lipid formulation | mRNA vaccines, proven clinical safety |
| DOTAP/Cholesterol | Cationic lipid mixture | Research applications, siRNA delivery |
| Custom Ionizable Mix | User-defined composition | Experimental formulations |

**Lipid Concentration (`lipid_conc`)**

Measured in millimolar (mM). Affects:
- Solution viscosity
- Self-assembly kinetics
- Final particle concentration

Typical range: **10–50 mM**. Higher concentrations may increase particle size due to aggregation.

**Solvent (`solvent_type`)**

Fixed as **Ethanol 99%** for microfluidic LNP synthesis. Ethanol is chosen because:
- Lipids are soluble in it
- It's miscible with water (enables mixing)
- It evaporates easily during post-processing
- It has established safety profiles

#### B. Aqueous Phase Parameters

**Payload Type (`payload_type`)**

The therapeutic molecule being encapsulated:

| Type | Size | Characteristics |
|------|------|-----------------|
| mRNA | 1,000–10,000 nt | Large, requires gentle handling |
| siRNA | 20–25 nt | Small, easier to encapsulate |
| pDNA | Variable | Circular, very large |
| Empty | N/A | Control experiments, no payload |

The payload type affects optimal mixing conditions—larger molecules generally require gentler mixing to prevent degradation.

**RNA Concentration (`payload_conc`)**

Measured in mg/mL. Determines:
- Final therapeutic dose
- N/P ratio calculations
- Encapsulation efficiency

Typical range: **0.05–1.0 mg/mL**

**Aqueous Buffer (`buffer_ph`)**

The buffer maintains pH during mixing and affects ionizable lipid behavior:

| Buffer | pH | Purpose |
|--------|-----|---------|
| Citrate Buffer | 4.0 | **Most common for LNP synthesis** — ionizes lipids for RNA binding |
| Acetate Buffer | 5.0 | Alternative acidic buffer |
| PBS | 7.4 | Physiological pH — typically used post-synthesis |

**Critical insight**: Low pH (4.0–5.0) is essential during mixing because ionizable lipids must be positively charged to bind negatively charged RNA. After synthesis, particles are dialyzed into neutral buffer (PBS) where lipids become neutral.

#### C. Process Target Parameters

**N/P Ratio (`target_np_ratio`)**

The **Nitrogen-to-Phosphate ratio** is perhaps the most critical formulation parameter. It represents the charge balance between:
- **N (Nitrogen)**: Positive charges from ionizable lipid amines
- **P (Phosphate)**: Negative charges from RNA backbone phosphates

| N/P Ratio | Interpretation |
|-----------|----------------|
| < 4 | Insufficient lipid — poor encapsulation |
| 4–6 | **Optimal range** for most formulations |
| 6–10 | Common working range |
| > 10 | Excess lipid — may increase toxicity |

**Analogy**: If you're making a sandwich, the N/P ratio is like the bread-to-filling ratio. Too little bread (low N/P) and the filling falls out. Too much bread (high N/P) and you waste ingredients and change the taste.

---

### Output Variables (AI-Predicted)

#### Flow Rate Ratio (FRR)

The volumetric ratio of aqueous phase to organic phase, expressed as **Aqueous:Organic** (e.g., 3:1 means 3 parts water for every 1 part ethanol).

| FRR | Effect on Particles |
|-----|---------------------|
| 1:1 | High ethanol content — larger, less uniform particles |
| 3:1 | **Standard ratio** — good balance of size and uniformity |
| 5:1 | Lower ethanol — smaller particles but potentially lower yield |

**Scientific basis**: Higher aqueous ratios create a faster polarity shift, triggering more rapid lipid precipitation and smaller particle formation.

#### Total Flow Rate (TFR)

The combined volumetric flow of both phases through the chip, measured in **mL/min**.

| TFR | Effect |
|-----|--------|
| < 5 mL/min | Slow mixing — larger particles, higher variability |
| 8–15 mL/min | **Optimal range** — fast mixing, small uniform particles |
| > 20 mL/min | Very fast — excellent uniformity but high pressure concerns |

**Scientific basis**: Faster flow = faster mixing = less time for particle growth = smaller particles.

#### Predicted Particle Size

Expected hydrodynamic diameter in **nanometers (nm)**.

Target ranges by application:
- Vaccines: 60–100 nm
- Gene therapy: 80–120 nm
- siRNA delivery: 50–80 nm

#### Polydispersity Index (PDI)

A dimensionless measure of size distribution uniformity.

| PDI Value | Interpretation |
|-----------|----------------|
| < 0.1 | Excellent — highly monodisperse |
| 0.1–0.2 | **Good** — acceptable for most applications |
| 0.2–0.3 | Moderate — may need optimization |
| > 0.3 | Poor — significant size heterogeneity |

#### Encapsulation Efficiency (EE%)

Percentage of input RNA successfully loaded into particles.

| EE% | Interpretation |
|-----|----------------|
| > 95% | Excellent |
| 85–95% | Good |
| 70–85% | Acceptable |
| < 70% | Poor — significant material loss |

#### Post-Processing Instructions

After microfluidic synthesis, particles are in an ethanol-containing acidic buffer. Post-processing typically involves:

1. **Dialysis**: Removing ethanol by diffusion through a membrane
2. **Buffer Exchange**: Replacing acidic buffer with physiological PBS
3. **Concentration**: Reducing volume if needed
4. **Sterile Filtration**: Removing any aggregates

---

## Validation Rules for Implementation

Based on the domain knowledge above and API contract, the following validation rules should be implemented:

### Input Validation (Zod/Pydantic)

```typescript
// Frontend (Zod schema)
const formulationSchema = z.object({
  lipid_composition: z.enum(['SM-102', 'DOTAP/Chol', 'Custom']),
  lipid_concentration: z.number().min(10.0).max(50.0),
  solvent_type: z.literal('Ethanol 99%'),
  payload_type: z.enum(['mRNA', 'siRNA', 'pDNA', 'Empty']),
  payload_concentration: z.number().min(0.05).max(1.0),
  buffer_type: z.enum(['Citrate pH 4.0', 'Acetate pH 5.0', 'PBS pH 7.4']),
  target_np_ratio: z.number().int().min(4).max(20)
});
```

```python
# Backend (Pydantic model)
class FormulationRequest(BaseModel):
    lipid_composition: Literal['SM-102', 'DOTAP/Chol', 'Custom']
    lipid_concentration: float = Field(ge=10.0, le=50.0)
    solvent_type: str = 'Ethanol 99%'
    payload_type: Literal['mRNA', 'siRNA', 'pDNA', 'Empty']
    payload_concentration: float = Field(ge=0.05, le=1.0)
    buffer_type: Literal['Citrate pH 4.0', 'Acetate pH 5.0', 'PBS pH 7.4']
    target_np_ratio: int = Field(ge=4, le=20)
```

### Domain-Specific Warnings (UI Feedback)

```
lipid_concentration:
  - warning_if: > 30 → "High concentration may increase aggregation risk"

target_np_ratio:
  - optimal_range: 4-10
  - warning_if: > 15 → "High N/P may increase cytotoxicity"

buffer_type:
  - if lipid_composition == "SM-102": recommend "Citrate pH 4.0"
  - display_tip: "Acidic pH required for ionizable lipid activation"
```

### Output Validation (AI Response)

```python
class FormulationResponse(BaseModel):
    flow_rate_ratio: float = Field(ge=1.0, le=10.0)               # e.g., 3.0 → "3:1"
    total_flow_rate: float = Field(ge=1.0, le=30.0)               # mL/min
    particle_predicted_size: float = Field(ge=30.0, le=300.0)     # nm
    pdi: float = Field(ge=0.01, le=0.50)                          # index
    encapsulation_efficiency: float = Field(ge=50.0, le=100.0)    # %
    post_process: str
    reasoning: str
```

---

## Glossary for Developers

| Term | Plain English |
|------|---------------|
| Aqueous | Water-based |
| Buffer | Solution that maintains stable pH |
| Dialysis | Filtering out small molecules through a membrane |
| Encapsulation | Trapping something inside a container |
| Ionizable | Can become charged depending on pH |
| Lipid | Fat-like molecule |
| Monodisperse | All particles are the same size |
| Nanoparticle | Particle between 1-1000 nanometers |
| Nucleotide (nt) | Building block of RNA/DNA |
| Payload | The therapeutic cargo (RNA) |
| Polarity | How "water-loving" vs "fat-loving" a substance is |
| Self-assembly | Molecules spontaneously organizing into structures |
| Viscosity | Thickness/resistance to flow |

---

## References for Further Reading

1. Lipid Nanoparticles for mRNA Delivery — Nature Reviews Drug Discovery
2. Microfluidic Synthesis of Nanoparticles — Lab on a Chip Journal
3. mRNA Vaccine Development — NEJM Review Articles
4. Precision NanoSystems (now Cytiva) — Technical Application Notes
