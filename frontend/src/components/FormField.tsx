import type { ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  label: string;
  unit?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

export function FormField({ label, unit, error, children, className }: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between">
        <Label className="text-sm font-medium text-label">{label}</Label>
        {unit && (
          <span className="text-xs font-mono text-muted-foreground">{unit}</span>
        )}
      </div>
      {children}
      {error && (
        <p className="text-xs text-destructive font-medium animate-slide-in">{error}</p>
      )}
    </div>
  );
}
