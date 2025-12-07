import type { FormulationResult } from '@/types/formulation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Beaker, Activity, Droplets, FlaskConical, Info } from 'lucide-react';

interface ResultsCardProps {
  result: FormulationResult;
}

interface ResultItemProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  highlight?: boolean;
}

function ResultItem({ label, value, unit, icon, highlight }: ResultItemProps) {
  return (
    <div className={`flex items-center gap-3 p-4 rounded-lg transition-all duration-200 ${
      highlight ? 'bg-accent/50 border border-accent-foreground/10' : 'bg-muted/50'
    }`}>
      <div className="flex-shrink-0 w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center text-primary">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
        <p className="text-lg font-semibold font-mono text-value truncate">
          {typeof value === 'number' ? value.toFixed(2) : value}
          {unit && (
            <span className="text-sm font-normal text-muted-foreground ml-1">
              {unit}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

/**
 * ResultsCard displays AI-generated formulation recommendations
 * 
 * Display sections from docs-source/FRONTEND_ARCHITECTURE.md:
 * - Flow Parameters: flowRateRatio (formatted as "X:1"), totalFlowRate (mL/min)
 * - Predicted Characteristics: particlePredictedSize (nm), pdi, encapsulationEfficiency (%)
 * - Post-Processing Instructions: postProcess
 * - Scientific Reasoning: reasoning
 */
export function ResultsCard({ result }: ResultsCardProps) {
  return (
    <Card className="shadow-elevated animate-fade-in overflow-hidden">
      <CardHeader className="gradient-header text-primary-foreground pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <FlaskConical className="w-5 h-5" />
          Optimization Results
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Primary Results Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Flow Rate Ratio - formatted as "X:1" per docs */}
          <ResultItem
            label="Flow Rate Ratio"
            value={`${result.flowRateRatio}:1`}
            icon={<Droplets className="w-4 h-4" />}
            highlight
          />
          {/* Total Flow Rate - unit: mL/min per docs */}
          <ResultItem
            label="Total Flow Rate"
            value={result.totalFlowRate}
            unit="mL/min"
            icon={<Activity className="w-4 h-4" />}
            highlight
          />
          {/* Particle Size - unit: nm per docs */}
          <ResultItem
            label="Predicted Size"
            value={result.particlePredictedSize}
            unit="nm"
            icon={<Beaker className="w-4 h-4" />}
          />
          {/* PDI - no unit, index value per docs */}
          <ResultItem
            label="PDI"
            value={result.pdi}
            icon={<Activity className="w-4 h-4" />}
          />
        </div>

        {/* Encapsulation Efficiency - unit: % per docs */}
        <div className="p-4 rounded-lg bg-accent/30 border border-accent-foreground/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              Encapsulation Efficiency
            </span>
            <span className="text-2xl font-bold font-mono text-primary">
              {result.encapsulationEfficiency.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div 
              className="h-full gradient-header rounded-full transition-all duration-700 ease-out"
              style={{ width: `${Math.min(result.encapsulationEfficiency, 100)}%` }}
            />
          </div>
        </div>

        {/* Post-Process Recommendation */}
        <div className="p-4 rounded-lg bg-surface-sunken border border-border">
          <h4 className="text-sm font-semibold text-foreground mb-2">
            Post-Process Recommendation
          </h4>
          <p className="text-sm text-muted-foreground font-mono">
            {result.postProcess}
          </p>
        </div>

        {/* AI Reasoning */}
        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="flex items-start gap-2 mb-2">
            <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <h4 className="text-sm font-semibold text-foreground">
              Scientific Reasoning
            </h4>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed pl-6">
            {result.reasoning}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
