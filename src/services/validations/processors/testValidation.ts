/**
 * TEST VALIDATION PROCESSOR - TEMPLATE FOR NEW VALIDATIONS
 * =========================================================
 *
 * This is a fully documented test validation processor that serves two purposes:
 * 1. Provides a simple validation for testing the system
 * 2. Acts as a template for creating new validation processors
 *
 * HOW TO CREATE A NEW VALIDATION PROCESSOR:
 * ----------------------------------------
 * 1. Copy this file and rename it (e.g., 'duplicateRecordsValidation.ts')
 * 2. Update the class name and metadata
 * 3. Implement your validation logic in the validate() method
 * 4. Add any helper methods you need
 * 5. Register your processor in the ValidationRegistry
 *
 * @author Your Name
 * @version 1.0.0
 */

import { BaseValidationProcessor } from '../core/baseProcessor';
import {
  ValidationProcessorMetadata,
  ValidationResult,
  ValidationOptions
} from '../core/interfaces';

/**
 * Test Validation Processor
 *
 * This processor performs a simple validation check to ensure the system is working.
 * It checks if the financial_data_staging table has data.
 *
 * Use this when you need to:
 * - Test the validation system
 * - Verify database connectivity
 * - Template for new validations
 *
 * CUSTOMIZATION GUIDE:
 * - Change the metadata to describe your validation
 * - Implement your validation logic in validate()
 * - Add helper methods as needed
 */
export class TestValidationProcessor extends BaseValidationProcessor {
  /**
   * STEP 1: DEFINE YOUR METADATA
   * ============================
   * This metadata describes your validation processor to the system.
   * Update all fields to match your specific validation requirements.
   */
  metadata: ValidationProcessorMetadata = {
    // Unique identifier - use snake_case (e.g., 'duplicate_records', 'balance_check')
    id: 'test_validation',

    // Display name shown in the UI
    name: 'Test Validation',

    // Detailed description of what this validation checks
    description: 'Simple validation to test the system. Checks if there is data in the staging table.',

    // Category for grouping in UI (e.g., 'Data Quality', 'Financial', 'Referential Integrity')
    category: 'Testing',

    // Whether this validation is required
    required: false,

    // Execution sequence (lower numbers run first)
    sequence: -1,

    // Estimated duration in seconds
    estimatedDuration: 1,

    // Tags for filtering/searching
    tags: ['test', 'diagnostic', 'quick'],

    // Version of this processor
    version: '1.0.0'
  };

  /**
   * STEP 2: IMPLEMENT YOUR VALIDATION
   * =================================
   * This is where you implement the actual validation logic.
   * Return a ValidationResult with success/failure and details.
   */
  async validate(options?: ValidationOptions): Promise<ValidationResult> {
    this.log('Starting test validation');
    const startTime = new Date();

    try {
      // Skip if requested
      if (options?.skip) {
        return this.formatResult(true, 0, [], ['Validation was skipped']);
      }

      // EXAMPLE: Check if staging table has data
      const count = await this.countRecords('financial_data_staging');

      this.log(`Found ${count} records in staging table`);

      // Determine success based on record count
      const errors: string[] = [];
      const warnings: string[] = [];
      const info: string[] = [];

      if (count === 0) {
        errors.push('No data found in staging table. Please import data first.');
      } else if (count < 10) {
        warnings.push(`Only ${count} records found. This seems low for a typical import.`);
      } else {
        info.push(`Found ${count} records in staging table.`);
      }

      return this.formatResult(
        errors.length === 0,
        count,
        errors,
        warnings,
        startTime
      );
    } catch (error) {
      this.log(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      return this.formatResult(
        false,
        0,
        [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        [],
        startTime
      );
    }
  }

  /**
   * STEP 3: ADD HELPER METHODS (OPTIONAL)
   * =====================================
   * Add any helper methods your validation needs.
   */

  /**
   * Example helper method
   */
  private async checkTableExists(tableName: string): Promise<boolean> {
    try {
      const result = await this.query(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
        [tableName]
      );
      return result.length > 0;
    } catch (error) {
      return false;
    }
  }
}

/**
 * TEMPLATE FOR COMMON VALIDATION PATTERNS
 * =======================================
 *
 * 1. DUPLICATE RECORDS CHECK:
 * ---------------------------
 * ```typescript
 * async validate(options?: ValidationOptions): Promise<ValidationResult> {
 *   const duplicates = await this.query(`
 *     SELECT account, department, COUNT(*) as count
 *     FROM financial_data_staging
 *     WHERE ou = ?
 *     GROUP BY account, department
 *     HAVING count > 1
 *   `, [options?.ou]);
 *
 *   const errors = duplicates.map(d =>
 *     `Duplicate record: Account ${d.account}, Department ${d.department} (${d.count} times)`
 *   );
 *
 *   return this.formatResult(errors.length === 0, total, errors);
 * }
 * ```
 *
 * 2. REFERENTIAL INTEGRITY CHECK:
 * ------------------------------
 * ```typescript
 * async validate(options?: ValidationOptions): Promise<ValidationResult> {
 *   const orphaned = await this.query(`
 *     SELECT s.id, s.account_id
 *     FROM financial_data_staging s
 *     LEFT JOIN accounts a ON s.account_id = a.id
 *     WHERE a.id IS NULL
 *   `);
 *
 *   const errors = orphaned.map(o =>
 *     `Orphaned record: ID ${o.id} references non-existent account ${o.account_id}`
 *   );
 *
 *   return this.formatResult(errors.length === 0, total, errors);
 * }
 * ```
 *
 * 3. BALANCE CHECK:
 * ----------------
 * ```typescript
 * async validate(options?: ValidationOptions): Promise<ValidationResult> {
 *   const balance = await this.queryScalar<number>(`
 *     SELECT SUM(amount) FROM financial_data_staging
 *     WHERE ou = ?
 *   `, [options?.ou]);
 *
 *   const errors = [];
 *   if (Math.abs(balance || 0) > 0.01) {
 *     errors.push(`Balance check failed: Total is ${balance}, expected 0`);
 *   }
 *
 *   return this.formatResult(errors.length === 0, total, errors);
 * }
 * ```
 *
 * 4. REQUIRED FIELDS CHECK:
 * ------------------------
 * ```typescript
 * async validate(options?: ValidationOptions): Promise<ValidationResult> {
 *   const missing = await this.query(`
 *     SELECT id FROM financial_data_staging
 *     WHERE account IS NULL OR department IS NULL OR amount IS NULL
 *   `);
 *
 *   const errors = missing.map(m =>
 *     `Record ${m.id}: Missing required field(s)`
 *   );
 *
 *   return this.formatResult(errors.length === 0, total, errors);
 * }
 * ```
 *
 * 5. DATA RANGE CHECK:
 * -------------------
 * ```typescript
 * async validate(options?: ValidationOptions): Promise<ValidationResult> {
 *   const outOfRange = await this.query(`
 *     SELECT id, amount FROM financial_data_staging
 *     WHERE amount < 0 OR amount > 1000000
 *   `);
 *
 *   const warnings = outOfRange.map(r =>
 *     `Record ${r.id}: Amount ${r.amount} seems unusual`
 *   );
 *
 *   return this.formatResult(true, total, [], warnings);
 * }
 * ```
 */
