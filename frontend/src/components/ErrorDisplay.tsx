import { AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ErrorDisplayProps {
  message: string;
  onDismiss: () => void;
  className?: string;
}

export function ErrorDisplay({ message, onDismiss, className }: ErrorDisplayProps) {
  return (
    <div 
      className={cn(
        "p-4 rounded-lg bg-destructive/10 border border-destructive/20 animate-slide-in",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-destructive font-medium">{message}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDismiss}
          className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
