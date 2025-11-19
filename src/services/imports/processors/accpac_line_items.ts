/**
 * ACCPAC LINE ITEMS IMPORT PROCESSOR
 * ===================================
 *
 * This processor handles the import of ACCPAC line items from CSV files.
 * It validates and processes line item data for integration into the system.
 *
 * @version 1.0.0
 */

import { BaseImportProcessor } from '../core/baseProcessor';
import {
  ImportProcessorMetadata,
  ValidationResult,
  ImportResult,
  ImportOptions,
  ParsedFile
} from '../core/interfaces';
import * as db from '../../../local_db';

/**
 * ACCPAC Line Items Import Processor
 *
 * This processor imports ACCPAC line items from CSV files.
 * It will validate the data structure and process each line item
 * according to business rules.
 */
export class AccpacLineItemsProcessor extends BaseImportProcessor {
  /**
   * STEP 1: DEFINE METADATA
   */
  metadata: ImportProcessorMetadata = {
    // Unique identifier
    id: 'accpac_line_items',

    // Display name shown in the UI
    name: 'ACCPAC Line Items',

    // Detailed description of what this import does
    description: 'Imports ACCPAC line items from CSV files. Validates and processes line item data for integration into the system.',

    // Category for grouping in UI
    category: 'ACCPAC',

    // File formats this processor can handle
    supportedFormats: ['csv'],

    // Whether this import is required for system operation
    required: true,

    // Processing order
    order: 10,

    // List columns that MUST exist in the import file
    requiredColumns: [
      'FILETYPE',
      'FILEVERSION',
      'PROPCODE',
      'BUSDATE',
      'ACCTCODE',
      'ACCTDESC',
      'ENDINGBALANCE',
      'ACTIVITY'
    ],

    // List columns that are optional but recognized
    optionalColumns: [],

    // Validation rules shown to users
    validationRules: [
      'CSV file must contain all required columns: FILETYPE, FILEVERSION, PROPCODE, BUSDATE, ACCTCODE, ACCTDESC, ENDINGBALANCE, ACTIVITY',
      'PROPCODE in first data row must match hotel Local ID 1',
      'BUSDATE must match the selected import period (format: YYYYMM)'
    ],

    // Tags for filtering/searching
    tags: ['accpac', 'line-items', 'financial'],

    // Version of this processor
    version: '1.0.0'
  };

  /**
   * STEP 2: VALIDATION
   */
  async validate(filePath: string, fileType: string, options?: ImportOptions): Promise<ValidationResult> {
    console.log(`[${this.metadata.id}] Running validation`);

    try {
      const parsed = await this.getParsedFile(filePath, fileType, options);
      const errors: string[] = [];
      const warnings: string[] = [];

      // Check for required columns
      const missingColumns = this.metadata.requiredColumns?.filter(
        col => !parsed.columns.includes(col)
      ) || [];

      if (missingColumns.length > 0) {
        errors.push(`Missing required columns: ${missingColumns.join(', ')}`);
      }

      // If we have missing columns, stop validation here
      if (errors.length > 0) {
        return {
          isValid: false,
          rowCount: parsed.rowCount,
          columnCount: parsed.columns.length,
          detectedColumns: parsed.columns,
          missingRequiredColumns: missingColumns,
          errors,
          fileInfo: {
            size: 0,
            encoding: 'utf-8',
            hasHeaders: true
          }
        };
      }

      // Validate PROPCODE against hotel's local_id_1
      if (parsed.data.length > 0) {
        const firstRow = parsed.data[0];
        const propCode = firstRow.PROPCODE;

        // Get the hotel's local_id_1 from options or database
        const expectedPropCode = await this.getHotelLocalId1(options);

        if (!expectedPropCode) {
          errors.push('Unable to retrieve hotel Local ID 1 from settings');
        } else if (propCode !== expectedPropCode) {
          errors.push(`PROPCODE mismatch: Expected "${expectedPropCode}" but found "${propCode}" in first data row`);
        }
      } else {
        errors.push('File contains no data rows');
      }

      // Validate BUSDATE format and match with selected period
      if (parsed.data.length > 0) {
        const firstRow = parsed.data[0];
        const busDate = firstRow.BUSDATE;

        // Get expected period from options
        const expectedPeriod = this.getExpectedPeriod(options);

        if (!expectedPeriod) {
          errors.push('Import period (year and month) must be selected before validating');
        } else {
          // Validate BUSDATE format (should be YYYYMM)
          if (!/^\d{6}$/.test(busDate)) {
            errors.push(`BUSDATE format is invalid: "${busDate}". Expected format: YYYYMM (e.g., 202307)`);
          } else if (busDate !== expectedPeriod) {
            errors.push(`BUSDATE mismatch: Expected "${expectedPeriod}" but found "${busDate}"`);
          }
        }
      }

      // Return validation result
      if (errors.length > 0) {
        return {
          isValid: false,
          rowCount: parsed.rowCount,
          columnCount: parsed.columns.length,
          detectedColumns: parsed.columns,
          errors,
          warnings,
          fileInfo: {
            size: 0,
            encoding: 'utf-8',
            hasHeaders: true
          },
          sampleData: parsed.data.slice(0, 3)
        };
      }

      return {
        isValid: true,
        rowCount: parsed.rowCount,
        columnCount: parsed.columns.length,
        detectedColumns: parsed.columns,
        warnings: [
          `CSV file validated successfully - ${parsed.rowCount} rows detected`,
          `PROPCODE validated: ${parsed.data[0].PROPCODE}`,
          `BUSDATE validated: ${parsed.data[0].BUSDATE}`
        ],
        fileInfo: {
          size: 0,
          encoding: 'utf-8',
          hasHeaders: true
        },
        sampleData: parsed.data.slice(0, 3)
      };
    } catch (error) {
      return {
        isValid: false,
        rowCount: 0,
        columnCount: 0,
        detectedColumns: [],
        errors: [`Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Get the hotel's local_id_1 from the database
   */
  private async getHotelLocalId1(options?: ImportOptions): Promise<string | null> {
    try {
      // Check if local_id_1 is provided in options
      if (options?.custom?.localId1) {
        console.log(`[${this.metadata.id}] Using local_id_1 from options:`, options.custom.localId1);
        return options.custom.localId1;
      }

      // Get the selected OU from options
      const ou = options?.custom?.ou;
      if (!ou) {
        console.error(`[${this.metadata.id}] No OU provided in options`, options);
        return null;
      }

      console.log(`[${this.metadata.id}] Looking up local_id_1 for OU:`, ou);

      // Query the database for the hotel's local_id_1
      // This runs in the main process, so we can access the database directly
      try {
        const hotelsJson = await db.getCachedHotels();
        const hotels = JSON.parse(hotelsJson);
        console.log(`[${this.metadata.id}] Found ${hotels.length} cached hotels:`, hotels);

        // Find the hotel matching the OU
        const hotel = hotels.find((h: any) => h.ou === ou);
        console.log(`[${this.metadata.id}] Matched hotel for OU ${ou}:`, hotel);

        if (hotel && hotel.local_id_1) {
          console.log(`[${this.metadata.id}] Found local_id_1:`, hotel.local_id_1);
          return hotel.local_id_1;
        } else if (hotel) {
          console.warn(`[${this.metadata.id}] Hotel found but local_id_1 is empty:`, hotel);
        } else {
          console.warn(`[${this.metadata.id}] No hotel found matching OU ${ou}`);
        }
      } catch (dbError) {
        console.error(`[${this.metadata.id}] Database error:`, dbError);
      }

      return null;
    } catch (error) {
      console.error(`[${this.metadata.id}] Error getting hotel local_id_1:`, error);
      return null;
    }
  }

  /**
   * Get the expected period in YYYYMM format from options
   */
  private getExpectedPeriod(options?: ImportOptions): string | null {
    if (!options?.custom?.year || !options?.custom?.month) {
      return null;
    }

    const year = options.custom.year;
    const month = String(options.custom.month).padStart(2, '0');

    return `${year}${month}`;
  }

  /**
   * STEP 3: PROCESS ROWS
   */
  protected async processRows(parsed: ParsedFile, options?: ImportOptions): Promise<ImportResult> {
    console.log(`[${this.metadata.id}] Processing ${parsed.rowCount} rows`);

    // TODO: Implement processing logic
    // 1. Transform each row
    // 2. Save to database
    // 3. Update related records
    // 4. Generate reports

    const actualRowCount = parsed.rowCount;

    return {
      success: true,
      rowCount: actualRowCount,
      processedRows: actualRowCount,
      skippedRows: 0,
      failedRows: 0,
      metadata: {
        importType: this.metadata.id,
        message: `ACCPAC line items import completed: ${actualRowCount} rows processed`,
        columns: parsed.columns,
        sampleData: parsed.data.slice(0, 5),
        fileInfo: {
          totalRows: actualRowCount,
          totalColumns: parsed.columns.length,
          columnNames: parsed.columns
        }
      },
      stats: {
        startTime: new Date(),
        endTime: new Date()
      }
    };
  }

  /**
   * STEP 4: ROW VALIDATION
   */
  async validateRow(row: any, rowIndex: number): Promise<true | string> {
    // TODO: Implement row-level validation
    // - Check required fields
    // - Validate data types
    // - Check business rules

    return true;
  }

  /**
   * STEP 5: ROW TRANSFORMATION
   */
  async transformRow(row: any, rowIndex: number): Promise<any | null> {
    // TODO: Implement row transformation
    // - Clean and transform the data
    // - Map fields to internal structure
    // - Add metadata

    return row;
  }

  /**
   * STEP 6: PRE-IMPORT HOOK
   */
  async preImport(filePath: string, options?: ImportOptions): Promise<void> {
    await super.preImport(filePath, options);

    console.log(`[${this.metadata.id}] Preparing for ACCPAC line items import...`);

    // TODO: Add pre-import setup
    // - Check database connection
    // - Create backup
    // - Clear staging tables
    // - Check dependencies

    console.log(`[${this.metadata.id}] Pre-import setup complete`);
  }

  /**
   * STEP 7: POST-IMPORT HOOK
   */
  async postImport(result: ImportResult, options?: ImportOptions): Promise<void> {
    await super.postImport(result, options);

    console.log(`[${this.metadata.id}] Running post-import tasks...`);

    // TODO: Add post-import tasks
    // - Send notifications
    // - Update statistics
    // - Trigger dependent processes
    // - Clean up temp files

    console.log(`[${this.metadata.id}] Post-import tasks complete`);
  }

  /**
   * HELPER METHODS
   */

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate date format
   */
  private isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  /**
   * Capitalize first letter
   */
  private capitalizeFirst(str: string | undefined): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }
}
