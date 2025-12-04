/**
 * Test Validation - A3 Account Check
 * ===================================
 *
 * Checks if there are accounts starting with "A3" in the financial_data_staging table
 * for the selected OU (organizational unit).
 */

import { BaseValidationProcessor } from '../core/baseProcessor';
import {
  ValidationProcessorMetadata,
  ValidationResult,
  ValidationOptions
} from '../core/interfaces';

export class TestValidationProcessor extends BaseValidationProcessor {
  metadata: ValidationProcessorMetadata = {
    id: 'test_validation',
    name: 'Test Validation - A3 Account Check',
    description: 'Checks for accounts starting with "A3" in the staging table for the selected OU.',
    category: 'Data Quality',
    required: false,
    sequence: 10,
    estimatedDuration: 1,
    tags: ['test', 'account-check', 'A3'],
    version: '1.0.0'
  };

  async validate(options?: ValidationOptions): Promise<ValidationResult> {
    this.log('Checking for accounts starting with "A3"');
    const startTime = new Date();

    try {
      // Build WHERE clause based on options
      const whereConditions: string[] = [];
      const params: any[] = [];

      // Always check for accounts starting with A3
      whereConditions.push("account LIKE 'A3%'");

      // Add OU filter if provided
      if (options?.ou) {
        whereConditions.push('ou = ?');
        params.push(options.ou);
      }

      // Add period filters if provided
      if (options?.period?.year) {
        whereConditions.push('year = ?');
        params.push(options.period.year);
      }

      if (options?.period?.month) {
        whereConditions.push('month = ?');
        params.push(options.period.month);
      }

      const whereClause = whereConditions.length > 0
        ? 'WHERE ' + whereConditions.join(' AND ')
        : '';

      // Get total record count in staging table for the OU
      const totalCountQuery = options?.ou
        ? `SELECT COUNT(*) FROM financial_data_staging WHERE ou = ?`
        : `SELECT COUNT(*) FROM financial_data_staging`;

      const totalCountParams = options?.ou ? [options.ou] : [];
      const totalCount = await this.queryScalar<number>(totalCountQuery, totalCountParams) || 0;

      // Find A3 accounts
      const a3Accounts = await this.query<{
        account: string;
        department: string;
        ou: string;
        period_combo: string;
        amount: number;
      }>(`
        SELECT
          account,
          department,
          ou,
          period_combo,
          SUM(amount) as amount
        FROM financial_data_staging
        ${whereClause}
        GROUP BY account, department, ou, period_combo
        ORDER BY account, department
        ${options?.maxErrors ? `LIMIT ${options.maxErrors}` : ''}
      `, params);

      // Count unique A3 accounts
      const uniqueA3AccountsQuery = `
        SELECT COUNT(DISTINCT account)
        FROM financial_data_staging
        ${whereClause}
      `;
      const uniqueA3Count = await this.queryScalar<number>(uniqueA3AccountsQuery, params) || 0;

      const errors: string[] = [];
      const warnings: string[] = [];
      const info: string[] = [];

      if (a3Accounts.length > 0) {
        // This is a test validation, so we'll treat A3 accounts as informational
        info.push(`Found ${uniqueA3Count} unique account(s) starting with "A3"`);
        info.push(`Total of ${a3Accounts.length} account/department combinations`);

        // Add sample records to info
        const sampleSize = Math.min(5, a3Accounts.length);
        for (let i = 0; i < sampleSize; i++) {
          const record = a3Accounts[i];
          info.push(
            `  - Account: ${record.account}, Dept: ${record.department}, OU: ${record.ou}, Amount: ${record.amount.toFixed(2)}`
          );
        }

        if (a3Accounts.length > sampleSize) {
          info.push(`  ... and ${a3Accounts.length - sampleSize} more`);
        }

        // Optionally add as warning if there are many A3 accounts
        if (uniqueA3Count > 10) {
          warnings.push(
            `High number of A3 accounts detected: ${uniqueA3Count} unique accounts found`
          );
        }
      } else {
        info.push('No accounts starting with "A3" found in the staging table');
        if (options?.ou) {
          info.push(`Checked OU: ${options.ou}`);
        }
      }

      const result: ValidationResult = {
        success: true, // This is a test validation, always succeeds unless there's an error
        recordCount: totalCount,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
        info: info.length > 0 ? info : undefined,
        errorDetails: a3Accounts.length > 0 ? [{
          type: 'A3_ACCOUNTS_FOUND',
          message: `Accounts starting with "A3" in ${options?.ou || 'all OUs'}`,
          count: a3Accounts.length,
          sampleRecords: a3Accounts.slice(0, 10)
        }] : undefined,
        stats: {
          startTime,
          endTime: new Date(),
          duration: new Date().getTime() - startTime.getTime(),
          recordsChecked: totalCount,
          issuesFound: 0 // No issues, just information
        },
        metadata: {
          validationType: this.metadata.id,
          timestamp: new Date().toISOString(),
          ou: options?.ou,
          period: options?.period,
          a3AccountsFound: uniqueA3Count,
          a3RecordsFound: a3Accounts.length
        }
      };

      return result;
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

  async preview(options?: ValidationOptions): Promise<{
    description: string;
    recordsToCheck: number;
    estimatedDuration: number;
  }> {
    try {
      // Get count of records that will be checked
      const whereConditions: string[] = [];
      const params: any[] = [];

      if (options?.ou) {
        whereConditions.push('ou = ?');
        params.push(options.ou);
      }

      const whereClause = whereConditions.length > 0
        ? 'WHERE ' + whereConditions.join(' AND ')
        : '';

      const recordCount = await this.queryScalar<number>(
        `SELECT COUNT(*) FROM financial_data_staging ${whereClause}`,
        params
      ) || 0;

      return {
        description: `Will check ${recordCount} records for accounts starting with "A3" in ${options?.ou || 'all OUs'}`,
        recordsToCheck: recordCount,
        estimatedDuration: this.metadata.estimatedDuration || 1
      };
    } catch (error) {
      return {
        description: this.metadata.description,
        recordsToCheck: 0,
        estimatedDuration: this.metadata.estimatedDuration || 1
      };
    }
  }
}