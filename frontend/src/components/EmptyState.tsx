import { Beaker } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="bg-card rounded-lg shadow-card p-8 text-center animate-fade-in border-2 border-dashed border-border">
      <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
        <Beaker className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-foreground mb-2">Ready to Optimize</h3>
      <p className="text-sm text-muted-foreground max-w-xs mx-auto">
        Configure your formulation parameters and click "Calculate" to receive AI-powered optimization recommendations.
      </p>
    </div>
  );
}
