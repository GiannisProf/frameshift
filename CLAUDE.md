# CLAUDE.md — Frameshift

This file is the single source of truth for Claude Code on this project.
Read it fully before any operation. Never deviate from the conventions here without explicit instruction.

---

## Project Overview

**Name:** Frameshift
**Purpose:** A developer tool that translates frontend components between frameworks (Angular ↔ React, React ↔ Vue, Vue ↔ Angular) using the Anthropic API. It shows a side-by-side diff of the original vs translated code, and a "Fingerprint Panel" that explains the conceptual differences the AI resolved.
**Audience:** Frontend developers — this is a portfolio project and learning tool, not a commercial product.
**Status:** V1 in active development.

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | React | 18 |
| Language | TypeScript | strict mode |
| Build tool | Vite | latest |
| Styling | Tailwind CSS | v4 |
| Code editor | @monaco-editor/react | latest |
| Diff engine | diff (npm) | latest |
| State management | Zustand | latest |
| Routing | React Router | v6 |
| AI | Anthropic API | claude-sonnet-4-20250514 |
| API proxy | Vercel serverless function | `api/translate.ts` |
| Testing | Vitest + React Testing Library | latest |
| Linting | ESLint + Prettier | latest |
| Git hooks | Husky | latest |
| CI | GitHub Actions | — |
| Deployment | Vercel | — |
| Local dev | Vercel CLI (`vercel dev`) | latest |

---

## Repository Structure

```
frameshift/
├── api/
│   └── translate.ts                   # Vercel serverless function — proxies to Anthropic API
├── public/
├── src/
│   ├── components/
│   │   ├── Editor/
│   │   │   ├── CodeEditor.tsx         # Monaco editor wrapper (source input)
│   │   │   └── CodeEditor.test.tsx
│   │   ├── DiffViewer/
│   │   │   ├── DiffViewer.tsx         # Side-by-side diff, line highlights
│   │   │   ├── DiffLine.tsx           # Single line with added/removed styling
│   │   │   └── DiffViewer.test.tsx
│   │   ├── FrameworkSelector/
│   │   │   ├── FrameworkSelector.tsx  # Source + target dropdowns, auto-detect badge
│   │   │   └── FrameworkSelector.test.tsx
│   │   ├── FingerprintPanel/
│   │   │   ├── FingerprintPanel.tsx   # Toggled drawer, renders concept cards
│   │   │   ├── ConceptCard.tsx        # Single fingerprint item with severity badge
│   │   │   └── FingerprintPanel.test.tsx
│   │   └── shared/
│   │       ├── Badge.tsx              # Severity badge (major / minor / no-equivalent)
│   │       └── CopyButton.tsx         # Copy to clipboard with feedback state
│   ├── hooks/
│   │   ├── useTranslate.ts            # Calls Anthropic API, parses JSON response
│   │   ├── useDetectFramework.ts      # Heuristic + AI-assisted framework detection
│   │   └── useDiff.ts                 # Wraps diff library, returns structured lines
│   ├── prompts/
│   │   └── translate.ts               # All prompt templates — the core logic
│   ├── store/
│   │   └── useAppStore.ts             # Zustand store — single global store
│   ├── types/
│   │   └── index.ts                   # All shared TypeScript types and interfaces
│   ├── utils/
│   │   ├── parseResponse.ts           # Strip markdown fences, validate JSON schema
│   │   └── validPairs.ts              # All valid source → target framework combinations
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .github/
│   ├── workflows/
│   │   └── ci.yml                     # Lint + build + test on every PR
│   └── PULL_REQUEST_TEMPLATE.md
├── CLAUDE.md                          # This file
├── vercel.json                        # Vercel config — routes /api/* to serverless functions
├── .env.example                       # ANTHROPIC_API_KEY= (server-side only, never VITE_ prefixed)
├── .eslintrc.json
├── .prettierrc
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
└── package.json
```

---

## V1 Feature Scope

### In scope
- Single file/component paste via Monaco editor
- Framework auto-detection on paste (heuristic first, AI fallback)
- Manual source/target framework override via dropdowns
- Supported translation pairs: Angular → React, React → Angular, React → Vue, Vue → React, Vue → Angular, Angular → Vue
- Anthropic API call returning structured JSON (see schema below)
- Side-by-side diff view with line-level red/green highlighting
- Copy button on translated output panel
- Fingerprint Panel as a toggled drawer below the diff
- Concept cards with severity badges: `major`, `minor`, `no-equivalent`
- Loading state with progress indicator and status message

### Explicitly out of scope for V1
- Multi-file / full project translation
- Svelte support
- User accounts or history
- Shareable links
- Inline warnings on diff lines
- CSS framework translation
- Confidence score meter

---

## API Response JSON Schema

This is the exact shape Claude must return. Never deviate from this schema.

```typescript
interface TranslationResponse {
  translatedCode: string;
  fingerprint: FingerprintItem[];
  warnings: Warning[];
}

interface FingerprintItem {
  concept: string;          // Short label, e.g. "Class-based → function component"
  original: string;         // How it appears in source framework
  translated: string;       // How it was handled in target framework
  explanation: string;      // 1–2 sentence plain-English explanation
  severity: "major" | "minor" | "no-equivalent";
}

interface Warning {
  type: string;             // e.g. "no-equivalent", "manual-review"
  message: string;
  line?: number;
}

interface DiffLine {
  type: "added" | "removed" | "unchanged";
  content: string;
  lineNumber: {
    source: number | null;  // null for added lines (no source line)
    target: number | null;  // null for removed lines (no target line)
  };
}
```

---

## Error Taxonomy

All errors are stored in `error: string | null` in the Zustand store. Use these exact error type keys in `parseResponse.ts` and `useTranslate.ts`. Never invent new error types without updating this section.

| Error type | When it occurs | User-facing message |
|---|---|---|
| `empty_input` | User clicks Translate with no source code | "Please paste a component to translate." |
| `invalid_pair` | Source and target framework are the same | "Source and target frameworks must be different." |
| `api_error` | `/api/translate` returns a non-200 response | "Translation failed. Please try again." |
| `parse_error` | API responded but JSON was malformed | "Received an unexpected response. Please try again." |
| `network_error` | Fetch threw (offline, timeout) | "Network error. Check your connection and try again." |

Errors are displayed inline below the Translate button — not as modals or toasts. The error clears automatically when the user edits the source code or changes a framework selector.

---

## Framework Auto-Detection Heuristics

`useDetectFramework` runs on every `sourceCode` change with a 500ms debounce. Detection is heuristic-first — only call the AI fallback if heuristics are inconclusive.

**Angular signals** (any 2+ triggers detection):
- `@Component(`, `@NgModule(`, `@Injectable(`, `@Input()`, `@Output()`
- `implements OnInit`, `implements OnDestroy`, `ngOnInit`, `ngOnDestroy`
- `[(ngModel)]`, `*ngIf`, `*ngFor`
- `import ... from '@angular/core'`

**React signals** (any 2+ triggers detection):
- `useState(`, `useEffect(`, `useRef(`, `useCallback(`, `useMemo(`
- `import React`, `from 'react'`
- `.jsx` / `.tsx` file extension indicators in the code
- `JSX.Element`, `React.FC`, `ReactNode`

**Vue signals** (any 2+ triggers detection):
- `<template>`, `<script setup>`, `defineComponent(`
- `ref(`, `reactive(`, `computed(`, `onMounted(`
- `import ... from 'vue'`
- `v-if`, `v-for`, `v-model`

If fewer than 2 signals match any framework, set `sourceFramework: null` and prompt the user to select manually. Do not guess.

---

## Loading Messages

`useTranslate` cycles through these messages during a translation call, updating `loadingMessage` in the store every 2 seconds in order:

1. `"Analyzing component structure..."`
2. `"Mapping framework concepts..."`
3. `"Translating patterns..."`
4. `"Building fingerprint..."`

If the call resolves before all messages are shown, stop cycling immediately and clear the message.

---

---

## Zustand Store Shape

```typescript
interface AppState {
  // Input
  sourceCode: string;
  sourceFramework: Framework | null;
  targetFramework: Framework | null;
  isAutoDetected: boolean;

  // Output
  translatedCode: string | null;
  diffLines: DiffLine[];
  fingerprint: FingerprintItem[];
  warnings: Warning[];

  // UI
  isLoading: boolean;
  loadingMessage: string;
  isFingerprintOpen: boolean;
  error: string | null;

  // Actions
  setSourceCode: (code: string) => void;
  setSourceFramework: (f: Framework) => void;
  setTargetFramework: (f: Framework) => void;
  translate: () => Promise<void>;
  toggleFingerprint: () => void;
  reset: () => void;
}

type Framework = "angular" | "react" | "vue";
```

---

## TypeScript Conventions

- Strict mode is enabled. No `any`. No type assertions unless absolutely unavoidable.
- All shared types live in `src/types/index.ts`. Never inline types in component files.
- Use `interface` for object shapes, `type` for unions and primitives.
- Props interfaces are named `[ComponentName]Props`, e.g. `ConceptCardProps`.
- All async functions must handle errors explicitly — no unhandled promise rejections.
- Use `unknown` over `any` when type is genuinely unknown, then narrow.

---

## Component Conventions

- All components are functional. No class components.
- One component per file. File name matches component name exactly.
- Components only handle UI. Business logic lives in hooks.
- No direct API calls inside components — always via hooks.
- Props are always destructured in the function signature.
- Keep components under 150 lines. Split if larger.

Example structure:
```typescript
interface ConceptCardProps {
  item: FingerprintItem;
}

export function ConceptCard({ item }: ConceptCardProps) {
  // ...
}
```

---

## Styling Conventions (Tailwind CSS v4)

- Tailwind utility classes only. No custom CSS except in `index.css` for global resets and CSS variables.
- Dark mode support is required on every component from day one. Use `dark:` variants.
- Color palette:
  - Background: `bg-zinc-950` (app), `bg-zinc-900` (panels), `bg-zinc-800` (headers)
  - Borders: `border-zinc-700` (default), `border-zinc-600` (emphasis)
  - Text: `text-zinc-100` (primary), `text-zinc-400` (secondary), `text-zinc-500` (muted)
  - Diff added: `bg-green-950 text-green-300`
  - Diff removed: `bg-red-950 text-red-300`
  - Severity major: `bg-red-950 text-red-400`
  - Severity minor: `bg-amber-950 text-amber-400`
  - Severity no-equivalent: `bg-violet-950 text-violet-400`
- No inline styles. No style props.
- Responsive breakpoints: design for `md` (768px) upward as baseline. App is not usable on mobile — that is acceptable for V1.

---

## Hooks Conventions

- All hooks prefixed with `use`.
- Hooks return plain objects, never arrays (except standard React patterns like `useState`).
- `useTranslate` is the primary hook. It reads from the Zustand store and writes results back.
- `useDetectFramework` runs on every `sourceCode` change with a debounce of 500ms.

---

## Prompt Engineering Rules

All prompts live in `src/prompts/translate.ts`. This file is critical.

- The system prompt must instruct the model to return ONLY valid JSON matching the schema above — no preamble, no markdown fences, no explanation outside the JSON.
- The user message must include: source framework, target framework, and the raw source code.
- Always request `claude-sonnet-4-20250514`. Never hardcode a different model.
- `max_tokens` for translation calls: `4096`.
- The frontend sends requests to `/api/translate` (the Vercel serverless proxy) — never directly to `api.anthropic.com`.
- The serverless function in `api/translate.ts` forwards the request to Anthropic using the server-side `ANTHROPIC_API_KEY`.
- Parse the response with a try/catch in `parseResponse.ts`. On failure, surface a user-friendly error — never crash.
- Strip any accidental markdown fences (` ```json `) before parsing.

---

## Environment Variables

```
ANTHROPIC_API_KEY=your_key_here
```

- The API key is server-side only. It lives in the Vercel serverless function (`api/translate.ts`) and is never sent to or accessible by the browser.
- Never use the `VITE_` prefix for the API key — that would expose it publicly in the browser bundle.
- Locally: add to a `.env` file at the root. `vercel dev` picks it up automatically.
- In production: set via the Vercel dashboard under Project → Settings → Environment Variables.
- Never commit `.env`. It is gitignored.
- `.env.example` must always be kept up to date with key names (not values).
- The frontend calls `/api/translate` — never calls Anthropic directly.

---

## Git & Branch Strategy

- `main` — production-ready code only. Protected branch. No direct pushes.
- `dev` — integration branch. All feature branches merge here first.
- `feat/[feature-name]` — feature branches, e.g. `feat/diff-viewer`
- `fix/[issue-name]` — bug fix branches
- `chore/[task-name]` — tooling, config, refactor

Commit message format (Conventional Commits):
```
feat: add fingerprint panel toggle
fix: handle empty source code gracefully
chore: configure ESLint rules
docs: update CLAUDE.md with store shape
```

Every PR must:
- Target `dev` (not `main`)
- Pass CI (lint + build + tests)
- Include a short description of what changed and why
- Reference the feature it implements

---

## Testing Conventions

- Unit tests with Vitest for hooks and utils.
- Component tests with React Testing Library for interactive components.
- Test files co-located with the component: `ComponentName.test.tsx`.
- Test IDs use `data-testid` attributes, not class names or text.
- Minimum coverage targets (V1): hooks 80%, utils 100%, components 60%.
- Do not test implementation details — test behavior.

---

## CI (GitHub Actions)

On every PR to `dev` or `main`:
1. `npm run lint` — must pass
2. `npm run build` — must compile without errors
3. `npm run test` — all tests must pass

---

## What Claude Code Should Always Do

- Read this file before starting any task.
- Check the feature scope before implementing anything — do not build post-V1 features.
- Follow the store shape exactly — do not add fields to the store without updating this file.
- Always write the test file alongside the component or hook.
- Always use the types from `src/types/index.ts` — never redefine them locally.
- When creating a new component, follow the file structure in the Repository Structure section exactly.
- When unsure about a design decision, refer to the wireframes described below before asking.

## What Claude Code Should Never Do

- Use `any` in TypeScript.
- Make API calls directly inside components.
- Add dependencies not listed in the tech stack without flagging it first.
- Commit directly to `main`.
- Add features that are explicitly listed as out of scope for V1.
- Write CSS outside of Tailwind utilities (except global resets in `index.css`).
- Use class components.

---

## Wireframe Reference

Four screens exist for V1:

**Empty state:** Two-panel layout. Left = Monaco editor with placeholder. Right = empty output panel. Top bar with app name, auto-detected framework badge, source/target selectors, Translate button. Fingerprint tab at bottom, disabled.

**Loading state:** Source panel dimmed. Right panel shows animated dots + cycling status message + progress bar. Fingerprint tab disabled.

**Result state:** Left = source code with red diff lines. Right = translated code with green diff lines + Copy button. Fingerprint drawer open by default below the diff, showing concept cards with severity badges.

**Result state — empty fingerprint:** When the API returns an empty `fingerprint` array, the drawer is still open by default but shows: a small neutral icon + the message "No conceptual differences detected — this was a straightforward translation." No cards rendered. Do not hide or collapse the drawer in this case.

**Fingerprint default state:** Always open after a successful translation. The user can manually close it. State resets to open on the next translation.

---

## Valid Translation Pairs

All valid pairs are defined in `src/utils/validPairs.ts`. This is the single source of truth for what combinations the UI allows. The `FrameworkSelector` component reads from this list dynamically — never hardcode pairs in components.

```typescript
export const VALID_PAIRS: [Framework, Framework][] = [
  ["angular", "react"],
  ["react", "angular"],
  ["react", "vue"],
  ["vue", "react"],
  ["angular", "vue"],
  ["vue", "angular"],
];

export function isValidPair(source: Framework, target: Framework): boolean {
  return VALID_PAIRS.some(([s, t]) => s === source && t === target);
}
```

Note: Vue ↔ Angular is included in V1 but may produce lower quality translations than the React pairs due to less common migration patterns in the wild. No special handling is needed — the AI manages it. Monitor output quality during testing.

---

## V2 Roadmap

Features explicitly deferred to V2. Do not implement these in V1 under any circumstances.

**AI-powered tooltips**
Hoverable `ℹ` icons on key UI elements (auto-detected badge, severity badges, framework selectors) that trigger a lightweight secondary Anthropic API call to generate contextual explanations. For example, hovering the auto-detected badge would explain exactly which code signals were used to identify the framework. Requires: new `useTooltip` hook, a `Tooltip` shared component, a secondary prompt template in `translate.ts`, and debounced API calls with their own loading state.

**Multi-file / full project translation**
Accept multiple component files as input and translate the entire slice together, preserving cross-file references and imports.

**Shareable links**
Encode the source code + framework pair in the URL so translations can be shared.

**Inline warnings on diff lines**
Surface `Warning` items from the API response directly on the relevant line in the diff view, not just in the Fingerprint Panel.

**Confidence score meter**
Visual indicator of how confident the AI was in the overall translation.

**Svelte support**
Add Svelte as a fourth framework option once V1 pairs are validated.

---

## Deployment

**Target:** Vercel.

**How it works:**
- The React frontend is served as a static site by Vercel.
- `api/translate.ts` is automatically treated as a Vercel serverless function.
- `ANTHROPIC_API_KEY` is set in Vercel dashboard → Project → Settings → Environment Variables. It is never in the repo.
- Local development uses `vercel dev` which emulates the serverless function locally.

**`vercel.json`** at the root configures routing so `/api/*` is handled by the serverless function and everything else falls through to the React app:
```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```
