import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FormSectionProps {
  title: string;
  description?: string;
  icon: ReactNode;
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function FormSection({ 
  title, 
  description, 
  icon, 
  children, 
  className,
  delay = 0 
}: FormSectionProps) {
  return (
    <div 
      className={cn(
        "form-section bg-card rounded-lg shadow-card p-6 animate-fade-in",
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start gap-3 mb-5">
        <div className="shrink-0 w-10 h-10 rounded-lg gradient-header flex items-center justify-center text-primary-foreground">
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      </div>
      <div className="space-y-4 pl-[52px]">
        {children}
      </div>
    </div>
  );
}
