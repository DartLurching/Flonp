# FRD-F3: UI Components

## Phase Overview

| Attribute | Value |
|-----------|-------|
| **Phase** | F3 |
| **Depends On** | F1 |
| **Blocks** | F4, F5 |

---

## Objective

Install shadcn/ui base components and create styled wrapper components matching the Lovable design.

---

## Source Documents

| Document | What to Extract |
|----------|-----------------|
| `/docs-source/FRONTEND_ARCHITECTURE.md` | Component names, file locations |

---

## Tasks

### Task 3.1: Initialize shadcn/ui

```bash
pnpm dlx shadcn@latest init
```

When prompted:
- TypeScript: **Yes**
- Style: **Default**
- Base color: **Slate**
- CSS variables: **Yes**
- React Server Components: **No**

### Task 3.2: Install Required Components

```bash
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add card
pnpm dlx shadcn@latest add input
pnpm dlx shadcn@latest add label
pnpm dlx shadcn@latest add select
```

### Task 3.3: Add Scientific Button Variant

**File: `src/components/ui/button.tsx`**

Find the `buttonVariants` and add this variant to the `variants.variant` object:

```typescript
scientific:
  "bg-primary text-primary-foreground shadow-card hover:bg-primary/90 transition-all duration-200 font-semibold",
```

### Task 3.4: Create FormField Component

**File: `src/components/FormField.tsx`**

```tsx
import { ReactNode } from 'react';
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
```

### Task 3.5: Create FormSection Component

**File: `src/components/FormSection.tsx`**

```tsx
import { ReactNode } from 'react';
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
        <div className="flex-shrink-0 w-10 h-10 rounded-lg gradient-header flex items-center justify-center text-primary-foreground">
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
```

### Task 3.6: Create Header Component

**File: `src/components/Header.tsx`**

```tsx
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
```

### Task 3.7: Create LoadingSpinner Component

**File: `src/components/LoadingSpinner.tsx`**

```tsx
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

export function LoadingSpinner({ className, size = 'md' }: LoadingSpinnerProps) {
  return (
    <Loader2 
      className={cn(
        "animate-spin text-primary",
        sizeClasses[size],
        className
      )} 
    />
  );
}
```

### Task 3.8: Create ErrorDisplay Component

**File: `src/components/ErrorDisplay.tsx`**

```tsx
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
```

### Task 3.9: Create EmptyState Component

**File: `src/components/EmptyState.tsx`**

```tsx
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
```

---

## Verification

Update `src/App.tsx` temporarily:

```tsx
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/FormField';
import { FormSection } from '@/components/FormSection';
import { Header } from '@/components/Header';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { EmptyState } from '@/components/EmptyState';
import { Beaker } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen gradient-surface molecular-pattern">
      <Header />
      
      <main className="container mx-auto px-4 py-8 space-y-6">
        <FormSection
          title="Test Section"
          description="Testing component rendering"
          icon={<Beaker className="w-5 h-5" />}
        >
          <FormField label="Test Field" unit="mM">
            <Input type="number" placeholder="Enter value" />
          </FormField>
          
          <FormField label="With Error" error="This is an error message">
            <Input type="text" />
          </FormField>
        </FormSection>

        <div className="flex gap-4 items-center">
          <Button variant="scientific" size="lg">Scientific Button</Button>
          <LoadingSpinner />
        </div>

        <ErrorDisplay 
          message="Test error message" 
          onDismiss={() => console.log('dismissed')} 
        />

        <EmptyState />
      </main>
    </div>
  );
}

export default App;
```

Run `pnpm dev` and verify:

1. ✅ Header shows with teal gradient icon
2. ✅ FormSection has teal left accent bar
3. ✅ FormField shows label and unit
4. ✅ Error message shows in red with animation
5. ✅ Scientific button has teal background
6. ✅ LoadingSpinner animates
7. ✅ ErrorDisplay has dismiss button
8. ✅ EmptyState shows dashed border

---

## Acceptance Criteria

- [ ] All shadcn/ui components install without errors
- [ ] FormField displays label, unit, error correctly
- [ ] FormSection shows gradient left accent bar
- [ ] Header renders with logo
- [ ] Scientific button variant works
- [ ] No TypeScript errors

---

## Files Created

| File | Purpose |
|------|---------|
| `src/components/ui/button.tsx` | Modified with scientific variant |
| `src/components/ui/card.tsx` | shadcn/ui |
| `src/components/ui/input.tsx` | shadcn/ui |
| `src/components/ui/label.tsx` | shadcn/ui |
| `src/components/ui/select.tsx` | shadcn/ui |
| `src/components/FormField.tsx` | Styled field wrapper |
| `src/components/FormSection.tsx` | Styled section wrapper |
| `src/components/Header.tsx` | App header |
| `src/components/LoadingSpinner.tsx` | Loading indicator |
| `src/components/ErrorDisplay.tsx` | Error display |
| `src/components/EmptyState.tsx` | Empty state placeholder |

---

## Next Phase

Proceed to **FRD-F4: Form Implementation**
