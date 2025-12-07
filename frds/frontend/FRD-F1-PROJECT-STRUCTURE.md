# FRD-F1: Project Structure + Design System

## Phase Overview

| Attribute | Value |
|-----------|-------|
| **Phase** | F1 |
| **Depends On** | None |
| **Blocks** | F2, F3, F4, F5, F6 |

---

## Objective

Create the Vite + React + TypeScript project with Tailwind CSS and the FLONP design system.

---

## Source Documents to Read First

Before starting, read these documents for exact versions:

| Document | What to Extract |
|----------|-----------------|
| `/docs-source/TECH_STACK.md` | React version, Vite version, Tailwind version, all package versions |
| `/docs-source/DEVELOPMENT_SETUP.md` | Node.js version, pnpm version |

---

## Tasks

### Task 1.1: Initialize Vite Project

Read `/docs-source/TECH_STACK.md` for exact Vite and React versions before running:

```bash
pnpm create vite frontend --template react-ts
cd frontend
```

### Task 1.2: Install Dependencies

Read `/docs-source/TECH_STACK.md` section "Key Frontend Dependencies" for exact versions:

```bash
pnpm install

# Install Tailwind (check docs for version)
pnpm add -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Install form libraries (check docs for versions)
pnpm add react-hook-form @hookform/resolvers zod

# Install icons
pnpm add lucide-react

# Install utilities
pnpm add clsx tailwind-merge
```

### Task 1.3: Configure Tailwind

Create `tailwind.config.js` with the FLONP design tokens:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["IBM Plex Sans", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          "0%": { opacity: "0", transform: "translateX(-10px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out forwards",
        "slide-in": "slide-in 0.2s ease-out forwards",
      },
    },
  },
  plugins: [],
}
```

### Task 1.4: Create Design System CSS

**File: `src/index.css`**

This is the complete FLONP design system from the Lovable prototype:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');

@layer base {
  :root {
    --background: 200 20% 98%;
    --foreground: 200 25% 10%;

    --card: 0 0% 100%;
    --card-foreground: 200 25% 10%;

    --popover: 0 0% 100%;
    --popover-foreground: 200 25% 10%;

    --primary: 175 60% 35%;
    --primary-foreground: 0 0% 100%;

    --secondary: 200 15% 94%;
    --secondary-foreground: 200 25% 15%;

    --muted: 200 15% 92%;
    --muted-foreground: 200 10% 45%;

    --accent: 175 50% 92%;
    --accent-foreground: 175 60% 25%;

    --destructive: 0 72% 51%;
    --destructive-foreground: 0 0% 100%;

    --border: 200 20% 88%;
    --input: 200 20% 88%;
    --ring: 175 60% 35%;

    --radius: 0.625rem;

    /* Custom tokens */
    --surface-elevated: 0 0% 100%;
    --surface-sunken: 200 20% 96%;
    --text-label: 200 15% 35%;
    --text-value: 200 25% 12%;
    --highlight: 175 70% 45%;
    --highlight-glow: 175 60% 35% / 0.15;

    /* Gradients */
    --gradient-header: linear-gradient(135deg, hsl(175 60% 35%), hsl(190 55% 40%));
    --gradient-surface: linear-gradient(180deg, hsl(200 20% 98%), hsl(200 15% 96%));
    --gradient-card: linear-gradient(180deg, hsl(0 0% 100%), hsl(200 20% 99%));

    /* Shadows */
    --shadow-sm: 0 1px 2px hsl(200 25% 10% / 0.04);
    --shadow-md: 0 4px 12px hsl(200 25% 10% / 0.06), 0 1px 3px hsl(200 25% 10% / 0.04);
    --shadow-lg: 0 12px 32px hsl(200 25% 10% / 0.08), 0 4px 12px hsl(200 25% 10% / 0.04);
    --shadow-glow: 0 0 24px hsl(var(--highlight-glow));
  }

  .dark {
    --background: 200 25% 8%;
    --foreground: 200 15% 95%;

    --card: 200 20% 12%;
    --card-foreground: 200 15% 95%;

    --popover: 200 20% 12%;
    --popover-foreground: 200 15% 95%;

    --primary: 175 55% 45%;
    --primary-foreground: 200 25% 8%;

    --secondary: 200 15% 18%;
    --secondary-foreground: 200 15% 90%;

    --muted: 200 15% 18%;
    --muted-foreground: 200 10% 55%;

    --accent: 175 40% 18%;
    --accent-foreground: 175 50% 70%;

    --destructive: 0 62% 50%;
    --destructive-foreground: 0 0% 100%;

    --border: 200 15% 20%;
    --input: 200 15% 20%;
    --ring: 175 55% 45%;

    --surface-elevated: 200 20% 14%;
    --surface-sunken: 200 25% 6%;
    --text-label: 200 10% 60%;
    --text-value: 200 15% 92%;
    --highlight: 175 60% 50%;
    --highlight-glow: 175 55% 45% / 0.2;

    --gradient-header: linear-gradient(135deg, hsl(175 55% 40%), hsl(190 50% 35%));
    --gradient-surface: linear-gradient(180deg, hsl(200 25% 8%), hsl(200 20% 10%));
    --gradient-card: linear-gradient(180deg, hsl(200 20% 12%), hsl(200 20% 11%));

    --shadow-sm: 0 1px 2px hsl(0 0% 0% / 0.2);
    --shadow-md: 0 4px 12px hsl(0 0% 0% / 0.3), 0 1px 3px hsl(0 0% 0% / 0.2);
    --shadow-lg: 0 12px 32px hsl(0 0% 0% / 0.4), 0 4px 12px hsl(0 0% 0% / 0.25);
  }
}

@layer base {
  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground antialiased;
    font-family: 'IBM Plex Sans', system-ui, sans-serif;
  }

  .font-mono {
    font-family: 'IBM Plex Mono', monospace;
  }
}

@layer utilities {
  .shadow-card {
    box-shadow: var(--shadow-md);
  }

  .shadow-elevated {
    box-shadow: var(--shadow-lg);
  }

  .gradient-header {
    background: var(--gradient-header);
  }

  .gradient-surface {
    background: var(--gradient-surface);
  }

  .gradient-card {
    background: var(--gradient-card);
  }

  .text-label {
    color: hsl(var(--text-label));
  }

  .text-value {
    color: hsl(var(--text-value));
  }

  .bg-surface-elevated {
    background-color: hsl(var(--surface-elevated));
  }

  .bg-surface-sunken {
    background-color: hsl(var(--surface-sunken));
  }
}

/* Molecular pattern background */
.molecular-pattern {
  background-image: 
    radial-gradient(circle at 20% 30%, hsl(175 60% 35% / 0.03) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, hsl(190 55% 40% / 0.03) 0%, transparent 50%),
    radial-gradient(circle at 50% 50%, hsl(175 50% 50% / 0.02) 0%, transparent 70%);
}

/* Form section styling */
.form-section {
  @apply relative overflow-hidden;
}

.form-section::before {
  content: '';
  @apply absolute left-0 top-0 bottom-0 w-1 rounded-l-lg;
  background: var(--gradient-header);
}

/* Input focus ring */
input:focus, select:focus, [role="combobox"]:focus {
  @apply outline-none ring-2 ring-ring ring-offset-2 ring-offset-background;
  transition: box-shadow 0.2s ease;
}

/* Smooth transitions */
.transition-smooth {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Task 1.5: Create Utility Function

**File: `src/lib/utils.ts`**

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Task 1.6: Create Directory Structure

```bash
mkdir -p src/lib
mkdir -p src/types
mkdir -p src/components/ui
```

### Task 1.7: Configure Path Aliases

**File: `tsconfig.app.json`** — Add `baseUrl` and `paths` to `compilerOptions`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**File: `vite.config.ts`** — Add path alias:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
```

Install Node types:

```bash
pnpm add -D @types/node
```

### Task 1.8: Create Placeholder App

**File: `src/App.tsx`**

```tsx
function App() {
  return (
    <div className="min-h-screen gradient-surface molecular-pattern">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground">FLONP</h1>
        <p className="text-muted-foreground">Setup complete. Proceed to F2.</p>
      </div>
    </div>
  )
}

export default App
```

### Task 1.9: Create Environment Files

**File: `.env.example`**

```
VITE_API_URL=http://localhost:8000
```

**File: `.env`**

```
VITE_API_URL=http://localhost:8000
```

### Task 1.10: Update .gitignore

Add:

```
.env
.env.local
node_modules
dist
```

---

## Verification

```bash
# 1. Dependencies installed
pnpm list react react-dom tailwindcss

# 2. Dev server starts
pnpm dev

# 3. Open http://localhost:5173
#    - Background has gradient
#    - "FLONP" displays
#    - IBM Plex Sans font loads
```

---

## Acceptance Criteria

- [ ] `pnpm dev` starts without errors
- [ ] Page displays with gradient background
- [ ] IBM Plex Sans font loads
- [ ] Path aliases work (`@/lib/utils`)
- [ ] `.env` exists with `VITE_API_URL`
- [ ] Directories exist: `src/lib/`, `src/types/`, `src/components/ui/`

---

## Next Phase

Proceed to **FRD-F2: Types + Schema**
