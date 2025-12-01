# Validation System

A modular, extensible validation system for PSLoader following the same pattern as the import system.

## Architecture

```
validations/
├── core/
│   ├── interfaces.ts       # Type definitions and interfaces
│   ├── baseProcessor.ts    # Base class for all validations
│   └── registry.ts         # Central registry for validation processors
├── processors/
│   ├── testValidation.ts   # Template/example validation
│   ├── duplicateRecordsValidation.ts
│   └── [your-validation].ts
├── index.ts                # Main export point
└── README.md              # This file
```

## Quick Start

### 1. Create a New Validation

```typescript
// processors/myValidation.ts
import { BaseValidationProcessor } from '../core/baseProcessor';
import { ValidationProcessorMetadata, ValidationResult, ValidationOptions } from '../core/interfaces';

export class MyValidation extends BaseValidationProcessor {
  metadata: ValidationProcessorMetadata = {
    id: 'my_validation',
    name: 'My Validation',
    description: 'Checks something important',
    category: 'Data Quality',
    required: true,
    sequence: 10,
    estimatedDuration: 2,
    version: '1.0.0'
  };

  async validate(options?: ValidationOptions): Promise<ValidationResult> {
    const startTime = new Date();

    try {
      // Your validation logic here
      const count = await this.countRecords('your_table');

      // Example: Check for issues
      const issues = await this.query(`
        SELECT * FROM your_table
        WHERE some_field IS NULL
      `);

      const errors = issues.map(i => `Issue found: ${i.id}`);

      return this.formatResult(
        errors.length === 0,
        count,
        errors,
        [],
        startTime
      );
    } catch (error) {
      return this.formatResult(
        false,
        0,
        [`Validation failed: ${error.message}`],
        [],
        startTime
      );
    }
  }
}
```

### 2. Register Your Validation

In `core/registry.ts`:

```typescript
import { MyValidation } from '../processors/myValidation';

// In the initialize() method:
this.register(new MyValidation());
```

### 3. Use It

From the frontend:

```typescript
// Run a single validation
const result = await window.ipcApi.sendIpcRequest('validation:run', {
  validationName: 'my_validation',
  ou: 'hotel123'
});

// Get all validations
const validations = await window.ipcApi.sendIpcRequest('validation:get-all', {
  ou: 'hotel123'
});

// Run all validations
const results = await window.ipcApi.sendIpcRequest('validation:run-all', {
  ou: 'hotel123',
  period: { year: 2024, month: 12 }
});
```

From the backend:

```typescript
import { ValidationRegistry } from './services/validations';

// Execute a validation
const result = await ValidationRegistry.executeValidation('my_validation', {
  ou: 'hotel123'
});

// Get all validations for an OU
const processors = ValidationRegistry.getByOU('hotel123');
```

## Available Base Methods

### Query Helpers

```typescript
// Execute a query
const rows = await this.query<MyType>('SELECT * FROM table WHERE id = ?', [123]);

// Get a single value
const count = await this.queryScalar<number>('SELECT COUNT(*) FROM table');

// Count records
const recordCount = await this.countRecords('table_name', 'active = ?', [true]);
```

### Result Formatting

```typescript
// Format a complete result
return this.formatResult(
  success,        // boolean
  recordCount,    // number
  errors,         // string[]
  warnings,       // string[]
  startTime       // Date
);

// Create errors/warnings
const error = this.createError('ERR_001', 'Something went wrong', {
  recordId: 123,
  field: 'amount'
});

const warning = this.createWarning('WARN_001', 'This looks suspicious');
```

### Logging

```typescript
this.log('Info message');
this.log('Warning message', 'warn');
this.log('Error message', 'error');
```

## Common Validation Patterns

### 1. Duplicate Check

```typescript
const duplicates = await this.query(`
  SELECT account, department, COUNT(*) as count
  FROM financial_data_staging
  WHERE ou = ?
  GROUP BY account, department
  HAVING count > 1
`, [options?.ou]);

const errors = duplicates.map(d =>
  `Duplicate: ${d.account}/${d.department} (${d.count} times)`
);
```

### 2. Referential Integrity

```typescript
const orphaned = await this.query(`
  SELECT s.id, s.account_id
  FROM staging s
  LEFT JOIN accounts a ON s.account_id = a.id
  WHERE a.id IS NULL
`);

const errors = orphaned.map(o =>
  `Orphaned record ${o.id}: account ${o.account_id} not found`
);
```

### 3. Balance Check

```typescript
const balance = await this.queryScalar<number>(`
  SELECT SUM(amount) FROM financial_data
  WHERE ou = ?
`, [options?.ou]);

if (Math.abs(balance || 0) > 0.01) {
  errors.push(`Balance error: ${balance} (expected 0)`);
}
```

### 4. Required Fields

```typescript
const missing = await this.query(`
  SELECT id, 'account' as field FROM staging WHERE account IS NULL
  UNION ALL
  SELECT id, 'amount' as field FROM staging WHERE amount IS NULL
`);

const errors = missing.map(m =>
  `Record ${m.id}: Missing ${m.field}`
);
```

### 5. Data Range

```typescript
const outOfRange = await this.query(`
  SELECT id, amount FROM staging
  WHERE amount < 0 OR amount > 1000000
`);

const warnings = outOfRange.map(r =>
  `Record ${r.id}: Unusual amount ${r.amount}`
);
```

## Metadata Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier (snake_case) |
| `name` | string | Display name for UI |
| `description` | string | What this validation checks |
| `category` | string | Category for grouping |
| `required` | boolean | Must pass before data can be used |
| `sequence` | number | Execution order (lower = first) |
| `estimatedDuration` | number | Expected runtime in seconds |
| `tags` | string[] | Tags for filtering/searching |
| `version` | string | Processor version |
| `ou` | string | Specific OU (optional) |

## Validation Options

```typescript
interface ValidationOptions {
  skip?: boolean;                    // Skip this validation
  detailed?: boolean;                // Collect more information
  maxErrors?: number;                // Limit errors collected
  stopOnFirstError?: boolean;        // Stop at first error
  ou?: string;                       // Organizational unit
  period?: { year?: number; month?: number; };
  custom?: Record<string, any>;      // Custom options
}
```

## Categories

Organize validations into logical categories:

- **Data Quality** - Duplicates, formatting, completeness
- **Financial** - Balance checks, totals, reconciliation
- **Referential Integrity** - Foreign key checks, orphaned records
- **Business Rules** - Domain-specific validations
- **Performance** - Record counts, data volume
- **Testing** - Test/diagnostic validations

## Best Practices

1. **Keep validations focused** - One validation = one concern
2. **Provide clear error messages** - Include record IDs and values
3. **Use appropriate severity** - errors vs warnings
4. **Estimate duration accurately** - For better UX
5. **Handle errors gracefully** - Always catch and format errors
6. **Test with real data** - Use actual staging data for testing
7. **Document edge cases** - Comment unusual logic
8. **Use sequence wisely** - Run critical checks first

## IPC Channels

| Channel | Request | Response |
|---------|---------|----------|
| `validation:run` | `{ validationName, ou?, period? }` | `ValidationExecutionResponse` |
| `validation:get-all` | `{ ou? }` | `ValidationProcessorMetadata[]` |
| `validation:run-all` | `{ ou, period? }` | `ValidationExecutionResponse[]` |
| `validation:preview` | `{ validationName, ou? }` | `{ description, recordsToCheck, estimatedDuration }` |
| `validation:stats` | `{}` | `{ totalProcessors, byCategory, requiredCount, byOU }` |

## Examples

See:
- `processors/testValidation.ts` - Template with extensive documentation
- `processors/duplicateRecordsValidation.ts` - Real-world example

## Testing

```typescript
// Test a validation
const result = await ValidationRegistry.executeValidation('test_validation');
console.log(result);

// Get statistics
const stats = ValidationRegistry.getStatistics();
console.log(stats);
```

## Troubleshooting

### Database not available
Make sure `ValidationRegistry.setDatabase(db)` is called before using validations.

### Validation not found
Check that it's registered in `core/registry.ts` initialize() method.

### TypeScript errors
Make sure all interfaces are imported from `core/interfaces.ts`.

## Future Enhancements

- Auto-fix capabilities for certain validation failures
- Validation scheduling/automation
- Historical validation tracking
- Custom validation rules from API
- Validation dependencies (run X before Y)
- Parallel validation execution
- Progress callbacks for long validations
