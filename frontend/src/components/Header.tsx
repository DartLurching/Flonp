import { Atom } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg gradient-header flex items-center justify-center">
            <Atom className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">FLONP</h1>
            <p className="text-xs text-muted-foreground">Flow-Optimized Nanoparticle Protocol</p>
          </div>
        </div>
      </div>
    </header>
  );
}
