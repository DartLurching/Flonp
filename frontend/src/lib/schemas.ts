import { z } from 'zod';
import {
  LIPID_COMPOSITIONS,
  PAYLOAD_TYPES,
  BUFFER_TYPES,
  SOLVENT_TYPE,
} from '@/types/formulation';

// FORMULATION INPUT SCHEMA


export const formulationSchema = z.object({
  lipidComposition: z.enum(LIPID_COMPOSITIONS),

  lipidConcentration: z
    .number({ message: 'Must be a number' })
    .min(10.0, 'Must be at least 10.0 mM')
    .max(50.0, 'Must be at most 50.0 mM'),

  solventType: z.literal(SOLVENT_TYPE),

  payloadType: z.enum(PAYLOAD_TYPES),

  // NOTE: Min is 0.0 (not 0.05) to support control experiments with Empty payload
  payloadConcentration: z
    .number({ message: 'Must be a number' })
    .min(0.0, 'Must be at least 0.0 mg/mL')
    .max(1.0, 'Must be at most 1.0 mg/mL'),

  bufferType: z.enum(BUFFER_TYPES),

  targetNpRatio: z
    .number({ message: 'Must be a number' })
    .int('Must be a whole number')
    .min(4, 'Must be at least 4')
    .max(20, 'Must be at most 20'),
});

// INFERRED TYPE — Use this for React Hook Form

export type FormulationSchemaType = z.infer<typeof formulationSchema>;

// DEFAULT VALUES — For form initialization

export const defaultFormValues: FormulationSchemaType = {
  lipidComposition: 'SM-102',
  lipidConcentration: 12.5,
  solventType: SOLVENT_TYPE,
  payloadType: 'mRNA',
  payloadConcentration: 0.1,
  bufferType: 'Citrate pH 4.0',
  targetNpRatio: 6,
};
