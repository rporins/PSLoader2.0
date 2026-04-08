# PSLoader 2.0 — Architecture Guide

This document explains how PSLoader works, how the pieces fit together, and where to look when you need to change something. It assumes you can read code but may not know the specific languages or frameworks used here.

---

## What Is PSLoader?

PSLoader is a desktop application for hotel financial reporting. Hotels export data from their accounting systems (ACCPAC, Opera, etc.), import it into PSLoader, validate it, and generate Profit & Loss (P&L) reports in various formats (on-screen, Excel, Marriott F90).

The lifecycle of data through the tool:

```
Accounting System Export (CSV/Excel files)
    |
    v
Import into PSLoader (file parsing, column validation)
    |
    v
Staging Table (temporary holding area in the database)
    |
    v
Validation (business rules checked against staged data)
    |
    v
Production Table (approved data, versioned)
    |
    v
Report Generation (P&L calculations, Excel export)
```

---

## The Technology Stack (Plain English)

| Layer | Technology | What It Is |
|-------|-----------|------------|
| Desktop shell | Electron | Wraps a web browser in a native desktop window. Think of it as Chrome running your app without the address bar |
| UI framework | React | Builds the user interface from reusable components. Like assembling a page from Lego blocks |
| UI components | Material-UI (MUI) | Pre-built buttons, tables, dialogs, etc. from Google's design system |
| Language | TypeScript | JavaScript with type checking. If you know any C-family language, you can read it |
| Database | LibSQL (SQLite) | A single-file database stored on the user's computer. No server needed |
| Build tool | Vite | Compiles and bundles the source code into runnable files |
| Packaging | Electron Forge | Turns the app into an installable .exe for Windows |

---

## The Two-Process Model

This is the single most important concept. Electron apps run **two separate processes** that talk to each other:

```
┌─────────────────────────────────┐     ┌─────────────────────────────┐
│         MAIN PROCESS            │     │      RENDERER PROCESS       │
│  (the "backend")                │     │  (the "frontend")           │
│                                 │     │                             │
│  - Has full access to the       │     │  - Runs in a browser-like   │
│    computer (files, database,   │     │    sandbox                  │
│    system info, network)        │     │  - Displays the UI (React)  │
│                                 │     │  - Cannot touch files or    │
│  - Cannot display anything      │     │    the database directly    │
│  - Runs src/main.ts             │     │  - Runs src/renderer.ts     │
│                                 │     │    → src/app.tsx             │
│  Entry: src/main.ts             │     │  Entry: index.html          │
└──────────────┬──────────────────┘     └──────────────┬──────────────┘
               │                                       │
               │           IPC (messages)              │
               │◄─────────────────────────────────────►│
               │                                       │
               │       src/preload.ts (bridge)         │
               └───────────────────────────────────────┘
```

**Why two processes?** Security. The UI process could be tricked by malicious data into running dangerous code. By keeping it sandboxed and forcing all system access through controlled message channels, the app stays safe.

**The preload script** (`src/preload.ts`) is the bridge. It exposes a limited set of functions to the UI as `window.ipcApi`. The UI can only call those functions — it cannot access the filesystem, database, or network directly.

---

## Directory Map

```
PSLoader/
├── src/
│   ├── main.ts                    ← App starts here (backend)
│   ├── preload.ts                 ← Security bridge between processes
│   ├── renderer.ts                ← UI starts here (frontend)
│   ├── app.tsx                    ← React app root, defines all routes/pages
│   ├── local_db.ts                ← Database: tables, queries, all data access
│   ├── config.ts                  ← API URL and environment settings
│   │
│   ├── ipc/                       ← MESSAGE SYSTEM (how frontend talks to backend)
│   │   ├── index.ts               ← Wires up all handlers on startup
│   │   ├── registry.ts            ← The router: maps channel names to handler functions
│   │   ├── middleware.ts          ← Security checks, logging, error wrapping
│   │   ├── types.ts               ← Channel name constants and type definitions
│   │   └── handlers/              ← One file per domain area:
│   │       ├── auth.ts            ←   Login, logout, session checks
│   │       ├── database.ts        ←   All database read/write operations
│   │       ├── dataImport.ts      ←   File import processing
│   │       ├── validations.ts     ←   Data validation execution
│   │       ├── excelExport.ts     ←   Excel report generation
│   │       ├── hardware.ts        ←   Machine ID, serial numbers
│   │       ├── settings.ts        ←   App preferences
│   │       └── ...
│   │
│   ├── services/                  ← BUSINESS LOGIC (the "how" of each feature)
│   │   ├── api.ts                 ← REST client for the remote API server
│   │   ├── auth.ts                ← Token management, login state
│   │   ├── financialDataService   ← Syncs financial data from API
│   │   ├── excelExportService     ← Builds Excel workbooks
│   │   ├── imports/               ← FILE IMPORT SYSTEM
│   │   │   ├── core/
│   │   │   │   ├── interfaces.ts  ← Defines what an import processor must do
│   │   │   │   ├── baseProcessor  ← Shared logic all processors inherit
│   │   │   │   └── registry.ts    ← Central list of all available processors
│   │   │   ├── processors/        ← One file per import type:
│   │   │   │   ├── accpacWorksheetImport.ts
│   │   │   │   ├── accpacCompsImport.ts
│   │   │   │   ├── operaRoomSegImport.ts
│   │   │   │   ├── manualImportFile.ts
│   │   │   │   └── ...
│   │   │   └── utils/
│   │   │       └── fileParser.ts  ← CSV and Excel file reading
│   │   ├── reports/               ← P&L CALCULATION ENGINE
│   │   │   ├── plCalculationEngine.ts   ← Builds SQL, evaluates measures, computes variances
│   │   │   ├── plMeasureDefinitions.ts  ← All sub-measures and measures (the formulas)
│   │   │   ├── plRowConfig.ts           ← Custom P&L row layout
│   │   │   ├── summaryPLRowConfig.ts    ← Summary P&L row layout
│   │   │   ├── f90PLRowConfig.ts        ← Marriott F90 row layout
│   │   │   └── investSubgroupConfig.ts  ← Account grouping overrides
│   │   └── validations/           ← VALIDATION ENGINE
│   │       └── engine/
│   │           ├── ValidationEngine.ts       ← Executes named validation rules
│   │           └── validationDefinitions.ts  ← The actual rules
│   │
│   ├── routes/                    ← UI PAGES
│   │   ├── landing.tsx            ← Login screen
│   │   ├── signedinLanding.tsx    ← Main layout (sidebar + header + content area)
│   │   └── nestedPages/           ← All dashboard pages:
│   │       ├── home.tsx, data-import.tsx, validations.tsx,
│   │       ├── summary-pl.tsx, f90-pl.tsx, excel-export.tsx, ...
│   │
│   ├── components/                ← REUSABLE UI PIECES
│   │   ├── ProtectedRoute.tsx     ← Blocks unauthenticated access
│   │   ├── AppInitializer.tsx     ← Loads settings before showing the app
│   │   └── dataImport/ImportCard  ← File upload card with drag-and-drop
│   │
│   ├── store/settings.ts         ← GLOBAL STATE (selected hotel, theme, period, etc.)
│   ├── types/                     ← TYPE DEFINITIONS (data shapes)
│   └── theme/settings.ts         ← Light/dark mode colors
│
├── index.html                     ← The single HTML page that hosts the React app
├── package.json                   ← Dependencies and build scripts
├── forge.config.ts                ← Packaging/installer configuration
└── vite.*.config.ts               ← Build tool configuration (one per process)
```

---

## How Data Flows Through the App

### 1. The IPC Message System

Every action that touches data follows this pattern:

```
UI Component                          Main Process
     │                                     │
     │  window.ipcApi.sendIpcRequest(      │
     │    'db:get-periods', { ou: 'XYZ' }) │
     │ ──────────────────────────────────► │
     │                                     │  Registry looks up 'db:get-periods'
     │                                     │  Runs middleware chain:
     │                                     │    1. Security (sanitize input)
     │                                     │    2. Error handling (catch + wrap)
     │                                     │    3. Logging (record request)
     │                                     │    4. Performance (measure time)
     │                                     │  Calls the handler function
     │                                     │  Handler queries the database
     │                                     │
     │  { success: true,                   │
     │    data: [...periods],              │
     │    timestamp: 1234567890 }           │
     │ ◄────────────────────────────────── │
     │                                     │
     │  Component updates its state        │
     │  UI re-renders with new data        │
```

**Key files in this flow:**
- `src/preload.ts` — defines `window.ipcApi` (what the UI can call)
- `src/ipc/registry.ts` — maps channel names to handler functions
- `src/ipc/handlers/database.ts` — the actual handler that queries the database
- `src/ipc/middleware.ts` — security, logging, error wrapping

**Channel naming convention:** `domain:action`, for example:
- `db:get-periods` — database: get periods
- `auth:login` — authentication: log in
- `excel:generate-report` — excel: generate report
- `validation:run` — validation: run a check

**Every response is wrapped** in a standard envelope:
```
{ success: true/false, data: <the actual result>, error: <message if failed>, timestamp: <when> }
```

### 2. The Database

All data lives in a single SQLite file at `Documents/PSLoader/psloader.db`. The database code is in `src/local_db.ts`.

**Key tables:**

| Table | Purpose |
|-------|---------|
| `financial_data` | Production data — approved, versioned financial records |
| `financial_data_staging` | Staging area — imported data waiting for validation and approval |
| `departments` | Department master data (30-level hierarchy) |
| `accounts` | Account master data (30-level hierarchy) |
| `department_maps` | Maps department codes to hierarchy levels (used by calculations) |
| `account_maps` | Maps account codes to hierarchy levels (used by calculations) |
| `import_sessions` | Tracks each import operation (who, when, status) |
| `mappings` | Rules for transforming source account/dept codes to target codes |
| `validations` | Validation rule results |
| `completion_states` | Workflow tracking: which steps are done for each period |

**The staging pattern:** Data is never written directly to `financial_data`. It always goes to `financial_data_staging` first, gets validated, and only moves to production after sign-off. The calculation engine can read from both tables — staging data overlays production data so users can preview reports before finalizing.

**The combo key:** Financial records are identified by `dep_acc_combo_id`, which is `D{department}_A{account}` (e.g., `D0410_A701110`). This composite key links a department code with an account code.

---

## The Calculation Engine

This is the heart of the reporting system. It lives in `src/services/reports/`.

### How It Works (Conceptual)

The engine answers this question: *"For a given hotel and time period, what are the values for each line of the P&L report?"*

It works in four layers:

```
Layer 1: SUB-MEASURES (plMeasureDefinitions.ts)
    "Sum all amounts where department is Rooms AND account type is Revenue"
    These are the raw aggregations from the database.

Layer 2: MEASURES (plMeasureDefinitions.ts)
    Either a direct reference to one sub-measure ("simple"),
    or a formula combining multiple sub-measures ("calculated").
    Example: Occupancy = Sold Rooms / Total Rooms * 100

Layer 3: ROW CONFIG (plRowConfig.ts, f90PLRowConfig.ts, summaryPLRowConfig.ts)
    Defines the visual layout: which measures appear on which rows,
    with headers, indentation, and formatting.

Layer 4: CALCULATION ENGINE (plCalculationEngine.ts)
    Orchestrates everything: builds SQL, fetches data, evaluates
    measures, computes variances (vs Budget, vs Last Year).
```

### Sub-Measures

A sub-measure is a filter-based aggregation. It says: "Add up all the amounts that match these conditions."

```
total_rooms_revenue_act:
    filters:
      - department hierarchy level 5 = 'ROOMS_and_RESERVATION'
      - account hierarchy level 6 = 'Revenue'
    negate: true  (because revenue is stored as negative credits — flip the sign)
```

**Filter types:**
| Filter | What It Matches | Example |
|--------|----------------|---------|
| `dept_level` | Department at a hierarchy level | Level 10 = 'Rooms' |
| `dept_base` | Exact department code | 'D0480' |
| `acc_level` | Account at a hierarchy level | Level 6 = 'Revenue' |
| `acc_base` | Exact account code(s) | 'A701110' or ['A701110', 'A701111'] |
| `acc_prefix` | Account codes starting with | 'A70' matches A701110, A701211, etc. |

The hierarchy levels come from the `department_maps` and `account_maps` tables. These map each base code (like `D0410`) to a 30-level classification tree (level 1 might be 'Lodging Operations', level 5 might be 'Admin & General', etc.).

### The `negate` Flag (Sign Convention)

Accounting stores revenue as negative numbers (credits) and expenses as positive numbers (debits). To show revenue as a positive number on a report, set `negate: true` on the sub-measure. This multiplies the sum by -1.

**Rule of thumb:**
- Revenue, profit, EBITDA sub-measures → `negate: true`
- Expense, statistical sub-measures → `negate: false` (or omit)

### Measures

A **simple** measure points to one sub-measure:
```
rooms_revenue → total_rooms_revenue_act
```

A **calculated** measure uses a formula function:
```
occupancy_rooms:
    type: 'calculated'
    evaluator: (context) => {
        return (context.subMeasures.sold_rooms_act / context.subMeasures.total_rooms_act) * 100
    }
```

The `context` object gives the evaluator access to all sub-measure values for the current scenario.

### Row Configs

Each report format has a row config that defines the visual layout:

```
{ type: 'header',  label: 'REVENUE' }                          ← Section header
{ type: 'measure', label: 'Room Sales', measureId: 'rooms_revenue', formatting: 'number', indentLevel: 2 }
{ type: 'header',  label: '' }                                  ← Blank spacer row
```

**Three report formats exist:**
- `plRowConfig.ts` — Custom P&L (the default report)
- `summaryPLRowConfig.ts` — Summary P&L (no sign inversion on rows)
- `f90PLRowConfig.ts` — Marriott F90 format (with `invertSign` on specific rows)

### The `invertSign` Flag (F90 Only)

The F90 format applies an additional sign flip at the *row* level via `invertSign: true`. This is different from the sub-measure `negate` flag:

- `negate` on sub-measure: fixes the credit/debit accounting convention
- `invertSign` on row: flips the final display value for the F90 format specifically

For the Summary P&L, `invertSign` only controls variance color (whether positive variance is green or red) — it does not flip the number.

### How a Query Gets Built

The engine generates **one SQL query per scenario** (Actuals, Budget, Prior Year). Each query uses a `WITH combined_data` CTE that merges production and staging data, then calculates all sub-measures in a single pass using `CASE WHEN` aggregations:

```sql
SELECT
  SUM(CASE WHEN dm.level_5 = 'ROOMS_and_RESERVATION' AND am.level_6 = 'Revenue'
      THEN cd.amount * -1 ELSE 0 END) AS total_rooms_revenue_act,
  SUM(CASE WHEN dm.level_10 = 'Rooms' AND am.base_account = 'A960103'
      THEN cd.amount * 1 ELSE 0 END) AS sold_rooms_act,
  ...
FROM combined_data cd
LEFT JOIN department_maps dm ON cd.department = dm.base_department
LEFT JOIN account_maps am ON cd.account = am.base_account
```

This is efficient: one database round-trip gets all the numbers needed for an entire report.

### Variance Calculation

For each measure, the engine computes:
- **vs Budget** = Actuals - Budget
- **vs Budget %** = (Actuals - Budget) / |Budget| * 100
- **vs Last Year** = Actuals - Last Year
- **vs Last Year %** = (Actuals - LY) / |LY| * 100

### Zero-Row Filtering

The F90 report runs `filterZeroRows()` after calculation. This removes measure rows where actuals, budget, and LY are all zero, and cleans up orphaned section headers — so smaller hotels don't see irrelevant empty rows.

---

## The Import System

Lives in `src/services/imports/`. Uses the **registry + processor** pattern.

### How It Works

```
ImportRegistry (registry.ts)
    │
    ├── TestImportProcessor         ← For testing file parsing
    ├── AccpacLineItemsProcessor    ← ACCPAC trial balance line items
    ├── AccpacWorksheetImportProcessor  ← ACCPAC worksheet format
    ├── AccpacCompsImportProcessor  ← ACCPAC comp rooms data
    ├── OperaRoomSegImportProcessor ← Opera room segment statistics
    └── ManualImportFileProcessor   ← Manual data entry files
```

Each processor has a lifecycle:

```
1. preImport()   → Check file exists, check size
2. validate()    → Parse file, check required columns, return preview
3. process()     → Transform each row, write to staging table
4. postImport()  → Cleanup, log results
```

### Adding a New Import Processor

1. **Create a new file** in `src/services/imports/processors/` (e.g., `myNewImport.ts`)

2. **Extend BaseImportProcessor** and define metadata + processing logic:
```
class MyNewImportProcessor extends BaseImportProcessor {
    metadata = {
        id: 'my_new_import',
        name: 'My New Import',
        category: 'Financial',
        supportedFormats: ['csv', 'xlsx'],
        required: false,
        order: 10,
        requiredColumns: ['Account', 'Department', 'Amount'],
    }

    // Override transformRow to convert each file row into your target format
    async transformRow(row, rowIndex) {
        return {
            account: row['Account'],
            department: row['Department'],
            amount: parseFloat(row['Amount']),
        };
    }
}
```

3. **Register it** in `src/services/imports/core/registry.ts`:
```
import { MyNewImportProcessor } from '../processors/myNewImport';
// Inside initialize():
this.register(new MyNewImportProcessor());
```

That's it. The registry, IPC handler, and UI will pick it up automatically.

---

## The Validation Engine

Lives in `src/services/validations/engine/`.

### How It Works

The `ValidationEngine` is a simple name-to-function registry:

```
Engine.register('comboMustHaveValue', validationFunction)
Engine.execute('comboMustHaveValue', { ou: 'HOTEL1', period: { year: 2024, month: 3 } })
    → { success: true/false, errors: [...], stats: { duration, recordsChecked } }
```

Validation functions are defined in `validationDefinitions.ts`. Each function queries the staging table and checks business rules (e.g., "this account-department combo must have a non-zero value", "this combo must be zero", "this data should only appear in January").

### Adding a New Validation

1. Write a function in `validationDefinitions.ts` that takes `(db, options)` and returns a `ValidationResult`
2. Register it by name in the definitions object
3. The UI and IPC layer will pick it up

---

## The UI Layer

### Routing

All routes are defined in `src/app.tsx` using hash-based routing (URLs look like `#/signed-in-landing/home`).

**Structure:**
```
/ (landing)
├── /login
├── /register
└── /signed-in-landing          ← Main app shell (sidebar + header)
    ├── /home                   ← Dashboard
    ├── /data-import            ← Import files
    ├── /validations            ← Run validations
    ├── /staging-review         ← Review staged data
    ├── /summary-pl             ← Summary P&L report
    ├── /f90-pl                 ← F90 P&L report
    ├── /excel-export           ← Export to Excel
    └── ... (15+ more pages)
```

All pages under `/signed-in-landing` are wrapped in `ProtectedRoute`, which checks authentication before rendering.

### State Management

Global app state (selected hotel, theme, current period, etc.) lives in a Zustand store (`src/store/settings.ts`). This store:
- Is accessible from any component
- Auto-saves every change to the SQLite database via IPC
- Loads all saved settings on app startup (via `AppInitializer`)

### Component Patterns

- **Pages** live in `src/routes/nestedPages/`. Each page is a self-contained React component.
- **Reusable pieces** live in `src/components/`.
- **Styling** uses MUI's `styled()` function for component-specific styles and `src/styles/auth.css` for the login pages.

### How a Page Loads Data

Typical pattern inside a page component:

```
1. Component mounts
2. Read selected hotel/period from the Zustand store
3. Call window.ipcApi.sendIpcRequest('db:get-something', { ou, period })
4. Wait for response
5. Store result in local component state
6. Render the data
```

---

## Common Tasks — Where to Look

| I want to... | Go to... |
|--------------|----------|
| Add a new import file type | `src/services/imports/processors/` — create new processor, register in `registry.ts` |
| Add a new P&L line item | `src/services/reports/plMeasureDefinitions.ts` — add sub-measure and/or measure, then add row to the appropriate `*RowConfig.ts` |
| Add a new validation rule | `src/services/validations/engine/validationDefinitions.ts` |
| Add a new page/screen | `src/routes/nestedPages/` — create component, add route in `src/app.tsx` |
| Add a new IPC channel | `src/ipc/handlers/` — add handler function, register channel in the handler module, add channel constant to `src/ipc/types.ts` |
| Add a new database table | `src/local_db.ts` — add CREATE TABLE, add query functions |
| Change the API server URL | `src/config.ts` |
| Change the app theme/colors | `src/theme/settings.ts` |
| Change the sidebar navigation | `src/routes/signedinLanding.tsx` |
| Change what the preload exposes | `src/preload.ts` |
| Debug IPC calls | Check the middleware logging in `src/ipc/middleware.ts` |

---

## Conventions and Patterns

### Naming
- **IPC channels:** `domain:action` (e.g., `db:get-periods`, `auth:login`)
- **Sub-measure IDs:** `descriptive_name_act` (e.g., `total_rooms_revenue_act`)
- **Measure IDs:** `descriptive_name` (e.g., `rooms_revenue`, `occupancy_rooms`)
- **Department codes:** `D` + 4 digits (e.g., `D0410`)
- **Account codes:** `A` + 6 digits (e.g., `A701110`)
- **Combo keys:** `D{dept}_A{account}` (e.g., `D0410_A701110`)

### Error Handling
- IPC handlers never throw raw errors to the UI. The middleware catches everything and wraps it in `{ success: false, error: "message" }`.
- The preload script checks for `success: false` and throws so the UI can catch it in a try/catch.

### Response Wrapping
Every IPC response follows the same shape:
```
{ success: boolean, data?: any, error?: string, timestamp?: number }
```

### Registry Pattern
Used in three places — same idea each time:
1. **IPC Registry** — maps channel names to handler functions
2. **Import Registry** — maps processor IDs to processor instances
3. **Validation Engine** — maps validation names to validation functions

The pattern: register things by name, look them up by name at runtime. This keeps the system extensible without modifying core code.

### Middleware Chain
IPC middleware runs as a chain. Each middleware calls `next()` to pass control to the next one. The final `next()` call reaches the actual handler. This is the same pattern used in Express.js, Django, ASP.NET, and most web frameworks.

### Staging → Production
Data always enters through staging. The calculation engine's SQL query uses a `COALESCE` to overlay staging data on top of production data, so reports can show preview data before it's finalized.

---

## Build and Run

```bash
# Install dependencies
npm install

# Run in development mode (hot reload)
npm start

# Build installable package
npm run make
```

The packaged app is output to `out/`. The installer uses Squirrel for Windows auto-updates via GitHub Releases.

---

## Key Relationships Diagram

```
┌──────────────┐    defines     ┌──────────────────┐
│  Sub-Measures │◄──────────────│ plMeasureDefs.ts  │
│  (raw sums)   │               └──────────────────┘
└──────┬───────┘                         │
       │ referenced by                   │ also defines
       │                                 ▼
       │                        ┌──────────────────┐
       │                        │    Measures       │
       │                        │ (formulas)        │
       │                        └────────┬─────────┘
       │                                 │ referenced by
       │                                 ▼
       │                        ┌──────────────────┐
       │                        │  Row Configs      │
       │                        │ (report layout)   │
       │                        └────────┬─────────┘
       │                                 │ consumed by
       ▼                                 ▼
┌──────────────────────────────────────────────────┐
│              Calculation Engine                    │
│  plCalculationEngine.ts                           │
│                                                    │
│  1. Reads sub-measures → builds SQL CASE WHENs    │
│  2. Runs query against DB (staging + production)  │
│  3. Evaluates measures from query results         │
│  4. Walks row config → outputs PLCalculationResult│
│  5. Computes variances (vs budget, vs LY)         │
└──────────────────────────────────────────────────┘
         │
         │ returns
         ▼
┌──────────────────┐
│ PLCalcResult[]   │──► UI renders table
│ (rows with       │──► Excel export
│  actuals, budget,│──► Protea report pack
│  variances)      │
└──────────────────┘
```

---

## Glossary

| Term | Meaning |
|------|---------|
| OU | Operating Unit — a hotel's unique identifier |
| ACT | Actuals scenario — real financial data |
| BUD | Budget scenario — planned/budgeted numbers |
| PY1 | Prior Year scenario — last year's data for comparison |
| F90 | A Marriott-specific P&L report format |
| ACCPAC | An accounting software system used by hotels |
| Opera | A hotel property management system |
| Staging | Temporary holding area for imported data before approval |
| Combo | A department-account combination (e.g., D0410_A701110) |
| Sub-measure | A filtered sum of financial amounts from the database |
| Measure | A value displayed on a report row (may combine sub-measures) |
| IPC | Inter-Process Communication — how the UI talks to the backend |
| Middleware | Code that runs before/after every IPC request (logging, security) |
| Preload | The bridge script that safely connects the UI to the backend |
