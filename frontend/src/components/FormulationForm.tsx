import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Beaker, Dna, Target, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { FormSection } from '@/components/FormSection';
import { FormField } from '@/components/FormField';

import { formulationSchema, type FormulationSchemaType, defaultFormValues } from '@/lib/schemas';
import { 
  LIPID_COMPOSITIONS, 
  PAYLOAD_TYPES, 
  BUFFER_TYPES, 
  SOLVENT_TYPE,
} from '@/types/formulation';

interface FormulationFormProps {
  onSubmit: (data: FormulationSchemaType) => Promise<void>;
  isLoading: boolean;
  children?: React.ReactNode;
}

export function FormulationForm({ 
  onSubmit, 
  isLoading, 
  children 
}: FormulationFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormulationSchemaType>({
    resolver: zodResolver(formulationSchema),
    defaultValues: defaultFormValues,
  });

  const handleFormSubmit = async (data: FormulationSchemaType) => {
    await onSubmit(data);
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Form Sections */}
          <div className="space-y-6">
            {/* Section 1: Lipid Formulation */}
            <FormSection
              title="Lipid Formulation"
              description="Configure lipid composition and concentration"
              icon={<Beaker className="w-5 h-5" />}
              delay={0}
            >
              <FormField 
                label="Lipid Composition" 
                error={errors.lipidComposition?.message}
              >
                <Controller
                  name="lipidComposition"
                  control={control}
                  render={({ field }) => (
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select composition" />
                      </SelectTrigger>
                      <SelectContent>
                        {LIPID_COMPOSITIONS.map((composition) => (
                          <SelectItem key={composition} value={composition}>
                            {composition}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>

              <FormField 
                label="Lipid Concentration" 
                unit="mM"
                error={errors.lipidConcentration?.message}
              >
                <Input
                  type="number"
                  step="0.1"
                  placeholder="10.0 - 50.0"
                  {...register('lipidConcentration', { valueAsNumber: true })}
                />
              </FormField>

              <FormField label="Solvent Type">
                <Input
                  value={SOLVENT_TYPE}
                  disabled
                  className="bg-muted text-muted-foreground cursor-not-allowed"
                />
              </FormField>
            </FormSection>

            {/* Section 2: Payload */}
            <FormSection
              title="Payload"
              description="Define payload type and concentration"
              icon={<Dna className="w-5 h-5" />}
              delay={100}
            >
              <FormField 
                label="Payload Type" 
                error={errors.payloadType?.message}
              >
                <Controller
                  name="payloadType"
                  control={control}
                  render={({ field }) => (
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select payload type" />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYLOAD_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>

              <FormField 
                label="Payload Concentration" 
                unit="mg/mL"
                error={errors.payloadConcentration?.message}
              >
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.0 - 1.0"
                  {...register('payloadConcentration', { valueAsNumber: true })}
                />
              </FormField>

              <FormField 
                label="Buffer Type" 
                error={errors.bufferType?.message}
              >
                <Controller
                  name="bufferType"
                  control={control}
                  render={({ field }) => (
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select buffer type" />
                      </SelectTrigger>
                      <SelectContent>
                        {BUFFER_TYPES.map((buffer) => (
                          <SelectItem key={buffer} value={buffer}>
                            {buffer}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>
            </FormSection>

            {/* Section 3: Target Parameters */}
            <FormSection
              title="Target Parameters"
              description="Set optimization targets"
              icon={<Target className="w-5 h-5" />}
              delay={200}
            >
              <FormField 
                label="Target N/P Ratio" 
                error={errors.targetNpRatio?.message}
              >
                <Input
                  type="number"
                  step="1"
                  placeholder="4 - 20"
                  {...register('targetNpRatio', { valueAsNumber: true })}
                />
              </FormField>
            </FormSection>

            {/* Submit Button */}
            <div className="animate-fade-in" style={{ animationDelay: '300ms' }}>
              <Button 
                type="submit" 
                variant="scientific" 
                size="lg"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Optimizing...
                  </>
                ) : (
                  'Calculate Optimal Parameters'
                )}
              </Button>
            </div>
          </div>

          {/* Right Column: Results (passed as children) */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            {children}
          </div>
        </div>
      </form>
    </div>
  );
}
