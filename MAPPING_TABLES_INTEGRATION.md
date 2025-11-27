# Mapping Tables - Integration Instructions

## Quick Integration Guide

This guide shows you exactly where to add the mapping tables sync to your existing application.

## Step 1: Add to App Initialization

Find your main app initialization code (typically where authentication completes) and add the mapping tables sync.

### Example Integration Point A: After Login Success

If you have a login component or auth flow:

```typescript
// In your login/auth component (e.g., src/routes/login.tsx or similar)
import { initializeMappingTables } from '../utils/mappingTablesInit';

async function handleLoginSuccess() {
  // Existing login logic...

  // Add mapping tables sync
  try {
    console.log('Initializing mapping tables...');
    const syncResult = await initializeMappingTables();

    if (!syncResult.success) {
      // Show warning but don't block the app
      console.warn('Mapping tables sync failed:', syncResult.error);
      // Optionally show a toast/notification to user
    } else if (syncResult.synced) {
      console.log('✅ Mapping tables updated');
    } else {
      console.log('✅ Mapping tables up-to-date');
    }
  } catch (error) {
    console.error('Mapping tables initialization error:', error);
    // App can continue even if this fails
  }

  // Continue with rest of app initialization...
}
```

### Example Integration Point B: Main App Component

If you have a main App component that handles initialization:

```typescript
// In your main App component (e.g., src/App.tsx)
import { useEffect, useState } from 'react';
import { initializeMappingTables } from './utils/mappingTablesInit';
import authService from './services/auth';

function App() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    async function initialize() {
      // Wait for auth
      if (!authService.isAuthenticated()) {
        return;
      }

      // Initialize mapping tables
      try {
        await initializeMappingTables();
        setIsInitialized(true);
      } catch (error) {
        console.error('Initialization error:', error);
        setIsInitialized(true); // Continue anyway
      }
    }

    initialize();
  }, [authService.isAuthenticated()]);

  if (!isInitialized) {
    return <LoadingScreen message="Initializing..." />;
  }

  return (
    // Your app UI
  );
}
```

## Step 2: Use During Data Import

### Validate Combos Before Accepting Data

```typescript
// In your import processor (e.g., src/services/imports/processors/*)
import mappingTablesService from '../../../services/mappingTablesService';

async function processFinancialRow(row: any) {
  // Extract account and department from your data
  const account = row.account || row.accountCode;
  const department = row.department || row.deptCode;

  // Validate combo
  const isValidCombo = await mappingTablesService.isValidCombo(
    account,
    department
  );

  if (!isValidCombo) {
    // Reject this row or flag for review
    throw new Error(
      `Invalid account-department combination: ${account}-${department}. ` +
      `This combination is not allowed in the system.`
    );
  }

  // Continue processing the row...
  return {
    account,
    department,
    amount: row.amount,
    // ...
  };
}
```

### Get Hierarchy Levels for Rollups

```typescript
// In your report generation or data processing code
import mappingTablesService from '../services/mappingTablesService';

async function addHierarchyLevelsToData(rows: any[]) {
  const enrichedRows = [];

  for (const row of rows) {
    // Get account hierarchy
    const accountHierarchy = await mappingTablesService.getAccountHierarchy(
      row.account
    );

    // Get department hierarchy
    const deptHierarchy = await mappingTablesService.getDepartmentHierarchy(
      row.department
    );

    // Add hierarchy levels to the row
    enrichedRows.push({
      ...row,
      accountLevel1: accountHierarchy?.level_1,
      accountLevel2: accountHierarchy?.level_2,
      accountLevel3: accountHierarchy?.level_3,
      deptLevel1: deptHierarchy?.level_1,
      deptLevel2: deptHierarchy?.level_2,
      deptLevel3: deptHierarchy?.level_3,
    });
  }

  return enrichedRows;
}
```

## Step 3: Add to Settings/Admin Panel (Optional)

You may want to add a manual sync button for admins:

```typescript
// In your settings/admin component
import { forceMappingTablesSync, getMappingTablesVersion } from '../utils/mappingTablesInit';

function AdminSettings() {
  const [version, setVersion] = useState(null);
  const [syncing, setSyncing] = useState(false);

  async function loadVersion() {
    const ver = await getMappingTablesVersion();
    setVersion(ver);
  }

  async function handleForceSync() {
    setSyncing(true);
    try {
      const result = await forceMappingTablesSync();
      alert(result.message);
      await loadVersion(); // Refresh version display
    } catch (error) {
      alert('Sync failed: ' + error.message);
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => {
    loadVersion();
  }, []);

  return (
    <div>
      <h3>Mapping Tables</h3>
      <p>Version: {version?.version || 'Unknown'}</p>
      <p>Combo Version: {version?.combo_version || 'Unknown'}</p>
      <button onClick={handleForceSync} disabled={syncing}>
        {syncing ? 'Syncing...' : 'Force Refresh Mapping Tables'}
      </button>
    </div>
  );
}
```

## Step 4: Testing

### Test 1: First Run
1. Clear your SQLite database
2. Start the app and login
3. Check console logs for "Syncing mapping tables data..."
4. Verify no errors

### Test 2: Subsequent Runs
1. Start the app again
2. Check console logs for "Mapping tables are up-to-date"
3. Should be very fast (no download)

### Test 3: Version Change
1. In your API database, run:
   ```sql
   UPDATE mapping_configs SET version = '2.0' WHERE id = 1;
   ```
2. Restart the app
3. Should see "Version mismatch" and re-download data

### Test 4: Combo Validation
1. Try validating a known valid combo:
   ```typescript
   const isValid = await mappingTablesService.isValidCombo('4000', '100');
   console.log('Valid combo:', isValid); // Should be true
   ```
2. Try an invalid combo:
   ```typescript
   const isValid = await mappingTablesService.isValidCombo('INVALID', 'INVALID');
   console.log('Invalid combo:', isValid); // Should be false
   ```

### Test 5: Performance
1. Import a file with 1000+ rows
2. Each combo validation should be nearly instant (< 1ms)
3. Overall import should not be significantly slower

## Troubleshooting

### Sync fails with "No access token"
- Make sure the sync happens AFTER authentication
- Check `authService.isAuthenticated()` returns true
- Check `authService.getAccessToken()` returns a valid token

### API returns 404 on `/mapping-tables/combos`
- This endpoint might not exist in your API yet
- Option 1: Add the endpoint to your API
- Option 2: Modify `mappingTablesService.ts` to get combos from a different source
- Option 3: Include combos in the `/mapping-tables/data` response

### Slow performance
- Check that indexes are created (run: `PRAGMA index_list('account_department_combos')`)
- Verify data is actually cached locally (use IPC to call `db:get-combos`)
- Check that you're not accidentally re-syncing on every import

### Combos table is empty
- Check the API response from `/mapping-tables/combos`
- Verify the `storeCombosData` function is being called
- Check for errors in the console during sync

## Rollback Plan

If you need to disable the mapping tables system:

1. Comment out the `initializeMappingTables()` call in your app initialization
2. Remove combo validation from your import processors
3. The tables will remain in SQLite but won't be used

## Success Criteria

✅ App starts successfully with or without the sync
✅ Sync completes on first run (downloads data)
✅ Subsequent starts are fast (no re-download)
✅ Version changes trigger a re-download
✅ Combo validation works correctly
✅ Import performance is not significantly impacted
✅ User sees appropriate messages/feedback

## Next Steps

After successful integration:

1. Monitor the sync behavior in production
2. Collect metrics on sync duration and frequency
3. Consider adding user notifications for sync status
4. Implement background refresh (check version every N hours)
5. Add combo validation to all import workflows

## Contact for Issues

If you encounter issues with this integration:

1. Check the console logs for detailed error messages
2. Verify API endpoints are correct in `src/config.ts`
3. Review the MAPPING_TABLES_README.md for detailed implementation docs
4. Check the MAPPING_TABLES_LLM_GUIDE.md for architecture details
