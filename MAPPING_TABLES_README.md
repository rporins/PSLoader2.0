# Mapping Tables - Implementation Guide

## Overview

This system stores account hierarchies, department hierarchies, and valid account-department combinations locally in SQLite. The data is synced from the API and cached locally for fast lookups during data imports and validation.

## Architecture

### Database Tables

1. **`mapping_tables_version`** - Tracks versions for sync management
   - `id` (always 1) - Singleton row
   - `version` - Version of account_maps and department_maps
   - `combo_version` - Version of account_department_combos
   - `last_updated` - Timestamp of last sync

2. **`account_maps`** - Hierarchical account data (up to 31 levels)
   - `base_account` (PRIMARY KEY) - Base account identifier
   - `level_0` through `level_30` - Hierarchy levels
   - `description` - Account description

3. **`department_maps`** - Hierarchical department data (up to 31 levels)
   - `base_department` (PRIMARY KEY) - Base department identifier
   - `level_0` through `level_30` - Hierarchy levels
   - `description` - Department description

4. **`account_department_combos`** - Valid account-department pairs
   - `id` (PRIMARY KEY)
   - `account` - Account code
   - `department` - Department code
   - `description` - Combo description
   - Indexed on both `account` and `department` for fast lookups

### API Endpoints

Based on the API documentation provided:

#### GET `/mapping-tables/version`
Returns the current version from `mapping_configs` (id=1)
```json
{
  "version": "1.0",
  "combo_version": "1.0"
}
```

#### GET `/mapping-tables/data`
Returns all rows from both account_maps and department_maps plus the version
**WARNING**: Can return 5000+ rows, use sparingly
```json
{
  "account_maps": [...],
  "department_maps": [...],
  "version": "1.0",
  "combo_version": "1.0"
}
```

#### GET `/mapping-tables/combos` (assumed endpoint)
Returns all valid account-department combinations
```json
{
  "combos": [...],
  "combo_version": "1.0"
}
```

## Files Created/Modified

### 1. Database Layer: `src/local_db.ts`
Added interfaces:
- `MappingTablesVersion`
- `AccountMap`
- `DepartmentMap`
- `AccountDepartmentCombo`

Added table creation SQL for:
- `mapping_tables_version`
- `account_maps`
- `department_maps`
- `account_department_combos`

Added functions:
- `getMappingTablesVersion()` - Get stored version
- `setMappingTablesVersion(version, comboVersion)` - Update version
- `storeAccountMaps(accountMaps[])` - Store account hierarchies
- `storeDepartmentMaps(departmentMaps[])` - Store department hierarchies
- `storeAccountDepartmentCombos(combos[])` - Store valid combos
- `getAccountMaps()` - Get all account maps
- `getDepartmentMaps()` - Get all department maps
- `getAccountDepartmentCombos()` - Get all combos
- `isValidCombo(account, department)` - Validate combo
- `getAccountMapByBase(baseAccount)` - Get account hierarchy
- `getDepartmentMapByBase(baseDepartment)` - Get department hierarchy

### 2. Service Layer: `src/services/mappingTablesService.ts` (NEW)
Service for interacting with mapping tables API and local storage:
- `getVersion()` - Fetch version from API
- `getData()` - Fetch all mapping tables from API
- `getCombos()` - Fetch combos from API
- `checkIfSyncNeeded()` - Compare local vs remote versions
- `syncMappingTables()` - Main sync function (downloads if needed)
- `isValidCombo()` - Validate combo using local data
- `getAccountHierarchy()` - Get account hierarchy from local
- `getDepartmentHierarchy()` - Get department hierarchy from local

### 3. IPC Layer

#### Types: `src/ipc/types.ts`
Added IPC channel constants:
- `DB_GET_MAPPING_TABLES_VERSION`
- `DB_SET_MAPPING_TABLES_VERSION`
- `DB_STORE_ACCOUNT_MAPS`
- `DB_STORE_DEPARTMENT_MAPS`
- `DB_STORE_COMBOS`
- `DB_GET_ACCOUNT_MAPS`
- `DB_GET_DEPARTMENT_MAPS`
- `DB_GET_COMBOS`
- `DB_IS_VALID_COMBO`
- `DB_GET_ACCOUNT_MAP`
- `DB_GET_DEPARTMENT_MAP`

#### Handlers: `src/ipc/handlers/database.ts`
Added handler functions for all mapping tables operations

## Usage

### Startup Sync (Add to your app initialization)

In your main application initialization (after authentication), add:

```typescript
import mappingTablesService from './services/mappingTablesService';

async function initializeApp() {
  try {
    // After user is authenticated...

    // Sync mapping tables on startup
    console.log('Checking mapping tables sync status...');
    const synced = await mappingTablesService.syncMappingTables();

    if (synced) {
      console.log('Mapping tables synced successfully');
    } else {
      console.log('Mapping tables are up-to-date');
    }
  } catch (error) {
    console.error('Failed to sync mapping tables:', error);
    // Handle error - maybe show a warning to user
  }
}
```

### Validating Combos During Import

```typescript
import mappingTablesService from './services/mappingTablesService';

async function validateImportData(account: string, department: string) {
  const isValid = await mappingTablesService.isValidCombo(account, department);

  if (!isValid) {
    throw new Error(`Invalid account-department combination: ${account}-${department}`);
  }
}
```

### Getting Hierarchies for Rollups

```typescript
import mappingTablesService from './services/mappingTablesService';

async function getAccountRollupLevels(baseAccount: string) {
  const accountMap = await mappingTablesService.getAccountHierarchy(baseAccount);

  if (accountMap) {
    // Use level_0, level_1, etc. for rollups
    return {
      level1: accountMap.level_0,
      level2: accountMap.level_1,
      level3: accountMap.level_2,
      // ... etc
    };
  }
}
```

## Version Management

The system uses two version fields:

1. **`version`** - Tracks changes to `account_maps` and `department_maps`
   - Update this in the API's `mapping_configs` (id=1) whenever you modify account or department hierarchies

2. **`combo_version`** - Tracks changes to `account_department_combos`
   - Update this in the API's `mapping_configs` (id=1) whenever you modify valid combos
   - This allows combos to be updated independently of the account/department structures

### Updating Versions on the API Side

When you make changes to the data:
1. Update the appropriate version field in `mapping_configs` (id=1)
2. The client will detect the version change on next startup
3. The client will download only the changed data

## Performance Notes

1. **Indexes**: The combo table has indexes on both `account` and `department` for fast lookups
2. **Batch Inserts**: Data is inserted in batches of 100 rows to optimize performance
3. **Version Checking**: The version check is a single-row lookup (very fast)
4. **Full Data Fetch**: The `/mapping-tables/data` endpoint can return 5000+ rows, only use when syncing

## Integration Points

### During Data Import
- Validate each account-department combination before accepting the data
- Look up account/department hierarchies for applying rollups

### Report Generation
- Use the hierarchy levels to create drill-down reports
- Filter by specific levels of the hierarchy

### Data Validation
- Reject invalid combinations early in the import process
- Show user-friendly error messages with the combo description

## Future Enhancements

1. **Partial Sync**: Currently replaces all data. Could be optimized to only sync changed rows
2. **Background Sync**: Could periodically check for updates in the background
3. **Combo Lookup Cache**: Could add an in-memory cache for the most frequently checked combos
4. **Offline Mode**: Handle cases where API is unavailable by using cached data with a warning

## Troubleshooting

### Data Not Syncing
1. Check authentication is valid
2. Verify API endpoints are correct in `src/config.ts`
3. Check console logs for error messages
4. Verify versions in the API database

### Invalid Combo Not Detected
1. Ensure combos table is populated (check with `DB_GET_COMBOS` IPC call)
2. Verify the combo exists in the API's `account_department_combos` table
3. Check if combo_version was updated when the combo was added

### Performance Issues
1. Ensure indexes are created (check SQLite schema)
2. Monitor the size of the mapping tables
3. Consider adding pagination to the API endpoints if tables grow very large
