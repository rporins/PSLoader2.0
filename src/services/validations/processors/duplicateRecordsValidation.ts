/**
 * Duplicate Records Validation
 * ============================
 *
 * Checks for duplicate records in the financial_data_staging table.
 * Duplicates are identified by: account + department + period combination.
 */

import { BaseValidationProcessor } from '../core/baseProcessor';
import {
  ValidationProcessorMetadata,
  ValidationResult,
  ValidationOptions
} from '../core/interfaces';

export class DuplicateRecordsValidation extends BaseValidationProcessor {
  metadata: ValidationProcessorMetadata = {
    id: 'duplicate_records',
    name: 'Duplicate Records Check',
    description: 'Checks for duplicate records in the staging table based on account, department, and period.',
    category: 'Data Quality',
    required: true,
    sequence: 1,
    estimatedDuration: 2,
    tags: ['data-quality', 'duplicates', 'integrity'],
    version: '1.0.0'
  };

  async validate(options?: ValidationOptions): Promise<ValidationResult> {
    this.log('Checking for duplicate records');
    const startTime = new Date();

    try {
      // Build WHERE clause based on options
      const whereConditions: string[] = [];
      const params: any[] = [];

      if (options?.ou) {
        whereConditions.push('ou = ?');
        params.push(options.ou);
      }

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

      // Get total record count
      const totalCount = await this.queryScalar<number>(
        `SELECT COUNT(*) FROM financial_data_staging ${whereClause}`,
        params
      ) || 0;

      // Find duplicates
      const duplicates = await this.query<{
        account: string;
        department: string;
        period_combo: string;
        count: number;
      }>(`
        SELECT
          account,
          department,
          period_combo,
          COUNT(*) as count
        FROM financial_data_staging
        ${whereClause}
        GROUP BY account, department, period_combo
        HAVING count > 1
        ORDER BY count DESC
        ${options?.maxErrors ? `LIMIT ${options.maxErrors}` : ''}
      `, params);

      const errors: string[] = [];
      const warnings: string[] = [];

      if (duplicates.length > 0) {
        // Calculate total duplicate records
        const totalDuplicates = duplicates.reduce((sum, d) => sum + (d.count - 1), 0);

        for (const dup of duplicates) {
          errors.push(
            `Duplicate: Account "${dup.account}", Department "${dup.department}", Period "${dup.period_combo}" appears ${dup.count} times`
          );
        }

        warnings.push(
          `Found ${duplicates.length} unique duplicate combinations affecting ${totalDuplicates} excess records`
        );
      }

      const result: ValidationResult = {
        success: errors.length === 0,
        recordCount: totalCount,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
        info: errors.length === 0 ? ['No duplicate records found'] : undefined,
        errorDetails: duplicates.length > 0 ? [{
          type: 'DUPLICATE_RECORDS',
          message: 'Records with same account, department, and period',
          count: duplicates.length,
          sampleRecords: duplicates.slice(0, 5)
        }] : undefined,
        stats: {
          startTime,
          endTime: new Date(),
          duration: new Date().getTime() - startTime.getTime(),
          recordsChecked: totalCount,
          issuesFound: duplicates.length
        },
        metadata: {
          validationType: this.metadata.id,
          timestamp: new Date().toISOString(),
          ou: options?.ou,
          period: options?.period
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
}
