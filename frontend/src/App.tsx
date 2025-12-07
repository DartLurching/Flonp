import { useState } from 'react';
import { Header } from '@/components/Header';
import { FormulationForm } from '@/components/FormulationForm';
import { ResultsCard } from '@/components/ResultsCard';
import { EmptyState } from '@/components/EmptyState';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { optimizeFormulation, ApiRequestError } from '@/lib/api';
import type { FormulationSchemaType } from '@/lib/schemas';
import type { FormulationResult } from '@/types/formulation';

/**
 * Root component - orchestrates application state and layout
 * State management from docs-source/FRONTEND_ARCHITECTURE.md
 */
function App() {
  // State from docs-source/FRONTEND_ARCHITECTURE.md → State Management
  const [result, setResult] = useState<FormulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Handle form submission
   * Behavior from docs-source/FRONTEND_ARCHITECTURE.md → App.tsx → Behavior
   */
  const handleSubmit = async (data: FormulationSchemaType) => {
    // Clear previous result/error when new submission starts
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await optimizeFormulation(data);
      setResult(response);
    } catch (err) {
      // Catch API errors and set appropriate error message
      if (err instanceof ApiRequestError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-surface molecular-pattern">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-10 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            LNP Formulation Optimizer
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            AI-powered flow parameter recommendations for lipid nanoparticle synthesis. 
            Configure your formulation and receive optimized microfluidic settings.
          </p>
        </div>

        {/* Error Display - shown when error state is not null */}
        {error && (
          <div className="max-w-6xl mx-auto mb-6">
            <ErrorDisplay message={error} onDismiss={() => setError(null)} />
          </div>
        )}

        {/* Form with Results slot */}
        <FormulationForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
        >
          {result ? (
            <ResultsCard result={result} />
          ) : (
            <EmptyState />
          )}
        </FormulationForm>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© 2024 FLONP. For research use only.</p>
            <p className="font-mono text-xs">v1.0.0-beta</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
