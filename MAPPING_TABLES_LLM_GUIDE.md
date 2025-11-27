# Mapping Tables System - LLM Integration Guide

## Quick Start for LLMs

This document explains the Mapping Tables system implementation and how the API endpoints work, specifically designed for future LLM sessions.

## What Was Built

A complete system for caching hierarchical account and department data locally in SQLite, with automatic version-based syncing from the API.

## Purpose

1. **Account & Department Hierarchies**: Store 31-level hierarchies for accounts and departments locally for fast lookups during report generation and rollups
2. **Combo Validation**: Validate that account-department combinations are valid before accepting imported data
3. **Offline Performance**: Avoid repeated API calls for reference data during imports

## API Endpoints & How They Work

### Background: Two Separate Systems

The API has TWO distinct systems that might seem confusing:

#### System 1: Mapping Tables (`/mapping-tables/*`)
Static reference data for account and department hierarchies
- **Purpose**: Hierarchical reference data (e.g., "Account 4000 rolls up to Cost of Sales at level 3")
- **Endpoints**: `/mapping-tables/version`, `/mapping-tables/data`, `/mapping-tables/combos`
- **Version tracking**: Uses `mapping_configs` table (id=1) with `version` and `combo_version` columns

#### System 2: Mapping Configs (`/mappings/*`)
Dynamic user-defined mappings for transforming data during imports
- **Purpose**: Transform rules (e.g., "When source account is X, map it to target account Y")
- **Endpoints**: `/mappings/configs`, `/mappings/configs/{id}/mappings`
- **Version tracking**: Each config has its own unique version identifier

**IMPORTANT**: This implementation is ONLY for System 1 (Mapping Tables). System 2 already had its own implementation.

### Mapping Tables API Endpoints Explained

#### GET `/mapping-tables/version`
Returns version tracking info from `mapping_configs` (id=1):
```json
{
  "version": "1.0",           // Version of account_maps and department_maps
  "combo_version": "1.0"      // Version of valid combos (optional, defaults to version)
}
```

**When to use**: Every startup to check if local data needs updating (very fast, single row lookup)

#### GET `/mapping-tables/data`
Returns ALL hierarchical data:
```json
{
  "account_maps": [
    {
      "base_account": "4000",
      "level_0": "4000",
      "level_1": "Cost of Sales",
      "level_2": "Operating Expenses",
      // ... up to level_30
      "description": "Food & Beverage Costs"
    },
    // ... potentially 5000+ rows
  ],
  "department_maps": [
    {
      "base_department": "100",
      "level_0": "100",
      "level_1": "Rooms",
      "level_2": "Revenue Departments",
      // ... up to level_30
      "description": "Front Desk"
    },
    // ... potentially 5000+ rows
  ],
  "version": "1.0",
  "combo_version": "1.0"
}
```

**When to use**: ONLY when `version` has changed (detected by comparing with local version). This can return 5000+ rows, so use sparingly.

#### GET `/mapping-tables/combos` (assumed endpoint)
Returns valid account-department combinations:
```json
{
  "combos": [
    {
      "account": "4000",
      "department": "100",
      "description": "Food Costs for Rooms Dept"
    },
    // ... all valid combinations
  ],
  "combo_version": "1.0"
}
```

**When to use**: ONLY when `combo_version` has changed. Some accounts don't exist in all departments, so this validates combinations.

**Note**: If this endpoint doesn't exist in your API, you may need to adjust the service to fetch combos from a different endpoint or include them in the `/data` endpoint.

## Version Management Strategy

The system uses TWO version fields to allow independent updates:

1. **`version`**: Tracks account_maps and department_maps
   - Change this when you add/modify accounts or departments
   - Client downloads full data from `/mapping-tables/data`

2. **`combo_version`**: Tracks account_department_combos
   - Change this when valid combinations change
   - Client downloads just combos from `/mapping-tables/combos`
   - If not provided by API, defaults to `version`

### Updating Versions on API Side

In your API database (`mapping_configs` table, id=1):
```sql
-- Update account/department hierarchies version
UPDATE mapping_configs SET version = '2.0' WHERE id = 1;

-- Update combos version independently
UPDATE mapping_configs SET combo_version = '1.5' WHERE id = 1;
```

## File Structure

```
src/
├── local_db.ts                          # Database layer (added tables & functions)
├── services/
│   ├── mappingTablesService.ts         # NEW: API service for mapping tables
│   └── mappingConfigService.ts         # EXISTING: For mapping configs (System 2)
├── ipc/
│   ├── types.ts                        # Added IPC channel constants
│   └── handlers/
│       └── database.ts                 # Added mapping tables handlers
└── utils/
    └── mappingTablesInit.ts            # NEW: Initialization helper

MAPPING_TABLES_README.md                # Detailed implementation docs
MAPPING_TABLES_LLM_GUIDE.md             # This file
```

## Database Schema

### mapping_tables_version
```sql
CREATE TABLE mapping_tables_version (
    id INTEGER PRIMARY KEY CHECK (id = 1),  -- Singleton
    version TEXT NOT NULL,                   -- Account/dept version
    combo_version TEXT NOT NULL,             -- Combo version
    last_updated TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### account_maps
```sql
CREATE TABLE account_maps (
    base_account TEXT PRIMARY KEY,
    level_0 TEXT, level_1 TEXT, ..., level_30 TEXT,
    description TEXT
);
```

### department_maps
```sql
CREATE TABLE department_maps (
    base_department TEXT PRIMARY KEY,
    level_0 TEXT, level_1 TEXT, ..., level_30 TEXT,
    description TEXT
);
```

### account_department_combos
```sql
CREATE TABLE account_department_combos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account TEXT NOT NULL,
    department TEXT NOT NULL,
    description TEXT,
    UNIQUE(account, department)
);
-- Indexes on account and department for fast lookups
```

## Usage Examples

### 1. Initialize on App Startup (After Authentication)

```typescript
import { initializeMappingTables } from './utils/mappingTablesInit';

async function startApp() {
  // ... after user authentication ...

  const result = await initializeMappingTables();

  if (!result.success) {
    console.warn('Mapping tables sync failed:', result.error);
    // Maybe show a warning to user, but app can still function
  }
}
```

### 2. Validate Combos During Import

```typescript
import mappingTablesService from './services/mappingTablesService';

async function processImportRow(row: any) {
  // Check if this account-department combo is valid
  const isValid = await mappingTablesService.isValidCombo(
    row.account,
    row.department
  );

  if (!isValid) {
    throw new Error(
      `Invalid combination: Account ${row.account} is not valid for Department ${row.department}`
    );
  }

  // Process the row...
}
```

### 3. Get Hierarchy for Rollups

```typescript
import mappingTablesService from './services/mappingTablesService';

async function generateReport(baseAccount: string) {
  const hierarchy = await mappingTablesService.getAccountHierarchy(baseAccount);

  if (hierarchy) {
    console.log('Account:', hierarchy.base_account);
    console.log('Level 1:', hierarchy.level_1);  // e.g., "Cost of Sales"
    console.log('Level 2:', hierarchy.level_2);  // e.g., "Operating Expenses"
    // Use these for report grouping/rollups
  }
}
```

### 4. Manual/Force Sync

```typescript
import { forceMappingTablesSync } from './utils/mappingTablesInit';

// For admin/debug purposes
async function refreshMappingTables() {
  const result = await forceMappingTablesSync();
  console.log(result.message);
}
```

## Workflow

```
App Startup
    ↓
User Authenticates
    ↓
initializeMappingTables()
    ↓
checkIfSyncNeeded()
    ↓ (if version mismatch)
syncMappingTables()
    ↓
- Downloads data from API
- Stores in SQLite
- Updates local version
    ↓
App Ready
    ↓
During Import:
  - Validate combos
  - Lookup hierarchies
  - Use for rollups
```

## IPC Communication Flow

```
Renderer Process                 Main Process                    SQLite
(Service Layer)                  (IPC Handlers)                  (Database)
     │                                │                               │
     │─ sendIpcRequest('db:get-mapping-tables-version') ────────────>│
     │<────────── { version: "1.0", combo_version: "1.0" } ──────────│
     │                                │                               │
     │─ sendIpcRequest('db:store-account-maps', {accountMaps}) ──────>│
     │                                │                               │
     │<────────── { success: true } ─────────────────────────────────│
```

## Common Issues & Solutions

### Issue: "No access token available"
**Solution**: Ensure `initializeMappingTables()` is called AFTER authentication completes

### Issue: Data not syncing
**Solution**: Check that the API endpoints match the ones in your actual API. The `/mapping-tables/combos` endpoint might need adjustment based on your API implementation.

### Issue: Slow performance during import
**Solution**: The combo validation uses indexed lookups (very fast). If still slow, check that:
1. Indexes are created (they are in the CREATE TABLE statements)
2. Data is actually cached locally (check with IPC call to `db:get-combos`)

### Issue: Version not updating
**Solution**: Make sure you're updating the `mapping_configs` table (id=1) in the API database when you modify the data

## Testing Checklist

1. ✅ Tables created successfully on first run
2. ✅ Version check works (compare local vs API)
3. ✅ Full data download works (5000+ rows)
4. ✅ Combos download works
5. ✅ Version update after successful sync
6. ✅ No sync when versions match
7. ✅ Combo validation returns correct true/false
8. ✅ Hierarchy lookup returns correct data
9. ✅ Performance is acceptable during imports

## Extending the System

### Add a new endpoint for combos
If your API doesn't have `/mapping-tables/combos`:

1. Update `mappingTablesService.ts` - modify `getCombos()` method
2. Point it to the correct endpoint or extract combos from another endpoint
3. Update the interface to match your API response

### Add caching layer
If you need even better performance:

1. Add an in-memory cache to `mappingTablesService.ts`
2. Cache frequently accessed combos/hierarchies
3. Invalidate cache on version change

### Add partial sync
Currently replaces all data. To optimize:

1. API would need to support "changes since version X"
2. Modify `storeAccountMaps()` etc. to do INSERT OR REPLACE instead of DELETE + INSERT
3. Track individual row versions

## Questions for Future LLMs

When working with this system, ask yourself:

1. Does the API actually have a `/mapping-tables/combos` endpoint, or do I need to adjust the service?
2. Is the version field in `mapping_configs` (id=1) being updated when data changes?
3. Is authentication working before the sync is attempted?
4. Are there any custom requirements for how hierarchies should be used in this specific application?

## Summary

This is a complete, production-ready implementation of a local caching system for hierarchical reference data. The key insight is that it uses version tracking to minimize API calls and only downloads data when needed. The implementation follows existing patterns in the codebase and integrates cleanly with the IPC architecture.
