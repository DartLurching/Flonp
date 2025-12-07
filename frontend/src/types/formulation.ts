// CONSTANTS — Single source of truth for dropdown options
// Values from /docs-source/API_SPECIFICATION.md


export const LIPID_COMPOSITIONS = ['SM-102', 'DOTAP/Chol', 'Custom'] as const;
export const PAYLOAD_TYPES = ['mRNA', 'siRNA', 'pDNA', 'Empty'] as const;
export const BUFFER_TYPES = ['Citrate pH 4.0', 'Acetate pH 5.0', 'PBS pH 7.4'] as const;
export const SOLVENT_TYPE = 'Ethanol 99%' as const;

// DERIVED TYPES

export type LipidComposition = typeof LIPID_COMPOSITIONS[number];
export type PayloadType = typeof PAYLOAD_TYPES[number];
export type BufferType = typeof BUFFER_TYPES[number];

// REQUEST INTERFACE (Frontend → Backend)
// Field names in camelCase for frontend

export interface FormulationInput {
  lipidComposition: LipidComposition;
  lipidConcentration: number;
  solventType: typeof SOLVENT_TYPE;
  payloadType: PayloadType;
  payloadConcentration: number;
  bufferType: BufferType;
  targetNpRatio: number;
}

// RESPONSE INTERFACE (Backend → Frontend)
// Field names in camelCase for frontend

export interface FormulationResult {
  flowRateRatio: number;
  totalFlowRate: number;
  particlePredictedSize: number;
  pdi: number;
  encapsulationEfficiency: number;
  postProcess: string;
  reasoning: string;
}

// ERROR INTERFACE
// From /docs-source/ERROR_HANDLING.md

export interface ApiError {
  error: string;
  message: string;
  details?: {
    field?: string;
    constraint?: string;
    value?: unknown;
  };
}
