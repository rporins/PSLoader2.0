/**
 * ACCPAC ROOM REVENUE IMPORT PROCESSOR
 * ====================================
 *
 * Import processor for ACCPAC Room Revenue data.
 * Mapping ID: 11
 *
 * @author Your Name
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
 * ACCPAC Room Revenue Import Processor
 */
export class AccpacRoomRevImportProcessor extends BaseImportProcessor {
  /**
   * STEP 1: DEFINE YOUR METADATA
   */
  metadata: ImportProcessorMetadata = {
    // Unique identifier
    id: 'accpac_room_rev',

    // Display name shown in the UI
    name: 'ACCPAC Room Revenue',

    // Detailed description
    description: 'Import ACCPAC room revenue data with mapping ID 11. Processes room revenue data by segments including room nights, revenue, and bed nights.',

    // Category for grouping in UI
    category: 'ACCPAC',

    // File formats this processor can handle
    supportedFormats: ['csv'],

    // Whether this import is required for system operation
    required: true,

    // Processing order
    order: 11,

    // Required columns
    requiredColumns: [
      'Segments',
      'Prop Code',
      'Month',
      'Room Nighs',
      'Revenue',
      'Bed Nights'
    ],

    // Optional columns
    optionalColumns: [],

    // Validation rules shown to users
    validationRules: [
      'CSV file must contain all required columns: Segments, Prop Code, Month, Room Nighs, Revenue, Bed Nights',
      'Prop Code in first data row must match hotel Local ID 1',
      'Month must match the selected import period (format: DD/MM/YYYY, only year and month validated)'
    ],

    // Tags for filtering/searching
    tags: ['accpac', 'room', 'revenue', 'financial'],

    // Version of this processor
    version: '1.0.0'
  };

  /**
   * Override getParsedFile to force XLSX parsing even for .csv files
   * This file is labeled as .csv but contains Excel metadata
   */
  protected async getParsedFile(filePath: string, _fileType: string, options?: ImportOptions): Promise<any> {
    // Force XLSX parsing regardless of file extension
    return super.getParsedFile(filePath, 'xlsx', options);
  }

  /**
   * STEP 2: CUSTOMIZE VALIDATION
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

      // Validate Prop Code against hotel's local_id_1
      if (parsed.data.length > 0) {
        const firstRow = parsed.data[0];
        const propCode = firstRow['Prop Code'];

        // Get the hotel's local_id_1 from options or database
        const expectedPropCode = await this.getHotelLocalId1(options);

        if (!expectedPropCode) {
          errors.push('Unable to retrieve hotel Local ID 1 from settings');
        } else if (propCode !== expectedPropCode) {
          errors.push(`Prop Code mismatch: Expected "${expectedPropCode}" but found "${propCode}" in first data row`);
        }
      } else {
        errors.push('File contains no data rows');
      }

      // Validate Month field format (DD/MM/YYYY) and match with selected period
      if (parsed.data.length > 0) {
        const firstRow = parsed.data[0];
        const monthField = firstRow.Month;

        // Get expected period from options
        const expectedYear = options?.custom?.year;
        const expectedMonth = options?.custom?.month;

        if (!expectedYear || !expectedMonth) {
          errors.push('Import period (year and month) must be selected before validating');
        } else {
          // Parse the date field - Excel may return Date object or string
          let fileMonth: number;
          let fileYear: number;

          if (monthField instanceof Date) {
            // Excel date object
            fileMonth = monthField.getMonth() + 1; // getMonth() is 0-indexed
            fileYear = monthField.getFullYear();
          } else if (typeof monthField === 'string') {
            // String format: DD/MM/YYYY or D/M/YYYY
            const dateMatch = monthField.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
            if (!dateMatch) {
              errors.push(`Month field format is invalid: "${monthField}". Expected format: DD/MM/YYYY (e.g., 31/07/2023) or Excel date`);
              fileMonth = 0;
              fileYear = 0;
            } else {
              fileMonth = parseInt(dateMatch[2], 10);
              fileYear = parseInt(dateMatch[3], 10);
            }
          } else if (typeof monthField === 'number') {
            // Excel serial date number - convert to Date
            const excelDate = new Date((monthField - 25569) * 86400 * 1000);
            fileMonth = excelDate.getMonth() + 1;
            fileYear = excelDate.getFullYear();
          } else {
            errors.push(`Month field has unexpected type: ${typeof monthField}. Value: ${monthField}`);
            fileMonth = 0;
            fileYear = 0;
          }

          if (fileYear !== 0 && fileMonth !== 0) {
            if (fileYear !== expectedYear) {
              errors.push(`Year mismatch: Expected ${expectedYear} but found ${fileYear} in Month field`);
            }
            if (fileMonth !== expectedMonth) {
              errors.push(`Month mismatch: Expected ${expectedMonth} but found ${fileMonth} in Month field`);
            }
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

      // Format month field for display
      const monthField = parsed.data[0].Month;
      let monthDisplay: string;
      if (monthField instanceof Date) {
        monthDisplay = monthField.toLocaleDateString();
      } else {
        monthDisplay = String(monthField);
      }

      return {
        isValid: true,
        rowCount: parsed.rowCount,
        columnCount: parsed.columns.length,
        detectedColumns: parsed.columns,
        warnings: [
          `File validated successfully - ${parsed.rowCount} rows detected`,
          `Prop Code validated: ${parsed.data[0]['Prop Code']}`,
          `Month validated: ${monthDisplay}`
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
      try {
        const hotelsJson = await db.getCachedHotels();
        const hotels = JSON.parse(hotelsJson);
        console.log(`[${this.metadata.id}] Found ${hotels.length} cached hotels`);

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
   * STEP 3: CUSTOMIZE PROCESSING
   */
  protected async processRows(parsed: ParsedFile, options?: ImportOptions): Promise<ImportResult> {
    console.log(`[${this.metadata.id}] Processing ${parsed.rowCount} rows`);

    const startTime = new Date();
    const warnings: string[] = [];
    let processedRows = 0;
    let mappedRows = 0;
    let unmappedRows = 0;

    try {
      // Step 1: Get import configuration
      const year = options?.custom?.year;
      const month = options?.custom?.month;
      const ou = options?.custom?.ou;

      if (!year || !month || !ou) {
        throw new Error('Missing required import options: year, month, or ou');
      }

      // Generate import batch ID
      const now = new Date();
      const batchId = `accpac_room_rev_${now.toISOString().replace(/[:.]/g, '-')}`;

      // Step 2: Get hotel currency from metadata
      const currency = await this.getHotelCurrency(ou);
      if (!currency) {
        warnings.push('Hotel currency not found, defaulting to USD');
      }
      const finalCurrency = currency || 'USD';

      // Step 3: Aggregate and map rows
      // Note: Matching staging data is cleared in preImport hook
      const aggregatedData = await this.aggregateAndMapRows(parsed.data, year, month, ou, finalCurrency, batchId);

      // Step 5: Batch insert into staging table
      console.log(`[${this.metadata.id}] Inserting ${aggregatedData.length} aggregated rows into staging...`);
      const batchSize = 100;

      for (let i = 0; i < aggregatedData.length; i += batchSize) {
        const batch = aggregatedData.slice(i, i + batchSize);
        await db.insertBatchStagingData(batch);
        processedRows += batch.length;
      }

      // Step 6: Count mapped vs unmapped
      const mappingStats = await db.getStagingMappingStats();
      mappedRows = mappingStats.mapped || 0;
      unmappedRows = mappingStats.unmapped || 0;

      console.log(`[${this.metadata.id}] Import completed: ${processedRows} rows processed (${mappedRows} mapped, ${unmappedRows} unmapped)`);

      // Step 7: Generate report
      const unmappedAccounts = await db.getUnmappedAccounts();

      const endTime = new Date();

      return {
        success: true,
        rowCount: parsed.rowCount,
        processedRows,
        skippedRows: 0,
        failedRows: 0,
        warnings: warnings.length > 0 ? warnings : undefined,
        metadata: {
          importType: this.metadata.id,
          batchId,
          mappingId: 11,
          message: `ACCPAC room revenue import completed successfully`,
          mappingStats: {
            total: processedRows,
            mapped: mappedRows,
            unmapped: unmappedRows,
            unmappedPercentage: processedRows > 0 ? ((unmappedRows / processedRows) * 100).toFixed(2) + '%' : '0%'
          },
          unmappedAccounts: unmappedAccounts.length > 0 ? unmappedAccounts : undefined,
          period: `${year}-${String(month).padStart(2, '0')}`,
          currency: finalCurrency
        },
        stats: {
          startTime,
          endTime,
          duration: endTime.getTime() - startTime.getTime()
        }
      };
    } catch (error) {
      console.error(`[${this.metadata.id}] Processing error:`, error);
      return {
        success: false,
        rowCount: parsed.rowCount,
        processedRows,
        failedRows: parsed.rowCount - processedRows,
        errors: [error instanceof Error ? error.message : 'Unknown processing error'],
        stats: {
          startTime,
          endTime: new Date()
        }
      };
    }
  }

  /**
   * Get hotel currency from metadata
   */
  private async getHotelCurrency(ou: string): Promise<string | null> {
    try {
      const hotelsJson = await db.getCachedHotels();
      const hotels = JSON.parse(hotelsJson);
      const hotel = hotels.find((h: any) => h.ou === ou);

      if (hotel && hotel.currency) {
        console.log(`[${this.metadata.id}] Found currency for OU ${ou}: ${hotel.currency}`);
        return hotel.currency;
      }

      console.warn(`[${this.metadata.id}] No currency found for OU ${ou}`);
      return null;
    } catch (error) {
      console.error(`[${this.metadata.id}] Error getting hotel currency:`, error);
      return null;
    }
  }

  /**
   * Aggregate rows by mapped combo and process room revenue data
   * Creates 3 staging entries per row: "Rooms - ", "Bednights - ", and "Revenue - " prefixes
   */
  private async aggregateAndMapRows(
    rows: any[],
    year: number,
    month: number,
    ou: string,
    currency: string,
    batchId: string
  ): Promise<any[]> {
    console.log(`[${this.metadata.id}] Aggregating and mapping ${rows.length} rows...`);

    // Get all mappings for config_id = 11
    const mappings = await db.getMappings(11);
    console.log(`[${this.metadata.id}] Loaded ${mappings.length} mappings for config_id = 11`);

    // Build a lookup map for faster access using source_account
    const mappingLookup = new Map<string, any>();
    for (const mapping of mappings) {
      if (mapping.source_account && mapping.is_active) {
        mappingLookup.set(mapping.source_account, mapping);
      }
    }
    console.log(`[${this.metadata.id}] Built mapping lookup with ${mappingLookup.size} entries`);
    if (mappingLookup.size > 0 && mappingLookup.size < 20) {
      console.log(`[${this.metadata.id}] Sample mapping keys:`, Array.from(mappingLookup.keys()).slice(0, 10));
    }

    // Aggregate data by combo key
    const aggregationMap = new Map<string, any>();

    // Define the three data sets we need to create
    const dataSets = [
      { prefix: 'Rooms - ', column: 'Room Nighs' },
      { prefix: 'Bednights - ', column: 'Bed Nights' },
      { prefix: 'Revenue - ', column: 'Revenue' }
    ];

    for (const row of rows) {
      const segments = row.Segments?.trim();

      // Skip rows with no Segments
      if (!segments) {
        console.warn(`[${this.metadata.id}] Skipping row with missing Segments`);
        continue;
      }

      // Process each of the 3 data sets for this row
      for (const dataSet of dataSets) {
        const concatenatedSegment = `${dataSet.prefix}${segments}`;
        const actuals = parseFloat(row[dataSet.column]) || 0;

        // Skip if actuals is zero
        if (actuals === 0) {
          continue;
        }

        // Lookup mapping using the concatenated segment against source_account in mapping table
        const mapping = mappingLookup.get(concatenatedSegment);

        // Debug: Log first few lookups to help diagnose mapping issues
        if (Math.random() < 0.05) { // Log ~5% of lookups to avoid spam
          console.log(`[${this.metadata.id}] Looking up "${concatenatedSegment}" -> ${mapping ? 'FOUND' : 'NOT FOUND'}`);
        }

        let targetAccount: string | null = null;
        let targetDepartment: string | null = null;
        let mappingStatus = 'unmapped';
        let comboId: string | null = null;

        if (mapping && mapping.target_account && mapping.target_department) {
          targetAccount = mapping.target_account;
          targetDepartment = mapping.target_department;
          mappingStatus = 'mapped';
          comboId = `${targetDepartment}_${targetAccount}`;
        } else if (mapping && (mapping.target_account || mapping.target_department)) {
          targetAccount = mapping.target_account;
          targetDepartment = mapping.target_department;
          mappingStatus = 'partial';
          comboId = targetAccount && targetDepartment ? `${targetDepartment}_${targetAccount}` : null;
        }

        // Create aggregation key: combo_id + concatenated segment
        const aggKey = `${comboId || 'UNMAPPED'}_${concatenatedSegment}`;

        if (aggregationMap.has(aggKey)) {
          // Add to existing aggregate
          const existing = aggregationMap.get(aggKey);
          existing.amount += actuals;
        } else {
          // Create new aggregate entry
          const periodCombo = `${year}-${String(month).padStart(2, '0')}`;

          aggregationMap.set(aggKey, {
            dep_acc_combo_id: comboId || 'UNMAPPED',
            month,
            year,
            period_combo: periodCombo,
            scenario: 'ACT',
            amount: actuals,
            count: 1,
            currency,
            ou,
            department: targetDepartment,
            account: targetAccount,
            version: 'MAIN',
            source_account: concatenatedSegment,
            source_department: null,
            source_description: concatenatedSegment,
            mapping_status: mappingStatus,
            import_batch_id: batchId
          });
        }
      }
    }

    const result = Array.from(aggregationMap.values());
    console.log(`[${this.metadata.id}] Aggregated ${rows.length} source rows into ${result.length} staging records (3 per source row)`);

    return result;
  }

  /**
   * STEP 4: ROW VALIDATION (OPTIONAL)
   */
  async validateRow(row: any, rowIndex: number): Promise<true | string> {
    // TODO: Implement row validation logic

    // Example validation:
    // if (!row.room_id) {
    //   return `Missing room_id`;
    // }
    //
    // if (!row.revenue_date) {
    //   return `Missing revenue_date`;
    // }
    //
    // if (!row.amount || isNaN(row.amount)) {
    //   return `Invalid amount value: ${row.amount}`;
    // }

    return true;
  }

  /**
   * STEP 5: ROW TRANSFORMATION (OPTIONAL)
   */
  async transformRow(row: any, rowIndex: number): Promise<any | null> {
    // TODO: Implement row transformation logic

    // Example transformation:
    // return {
    //   roomId: row.room_id?.toString().trim(),
    //   revenueDate: new Date(row.revenue_date),
    //   amount: parseFloat(row.amount),
    //   taxAmount: row.tax_amount ? parseFloat(row.tax_amount) : 0,
    //   importedAt: new Date(),
    //   mappingId: 11,
    //   rowNumber: rowIndex + 1
    // };

    return row;
  }

  /**
   * STEP 6: PRE-IMPORT HOOK (OPTIONAL)
   */
  async preImport(filePath: string, options?: ImportOptions): Promise<void> {
    await super.preImport(filePath, options);

    console.log(`[${this.metadata.id}] Pre-import setup`);

    // Delete any existing staging data that matches the accounts we're about to import
    // This prevents duplicate data if the import is run multiple times
    await this.clearMatchingStagingData();
  }

  /**
   * Clear staging data where staging.source_account matches mapping.source_department from config 11
   * This prevents duplicate data when re-importing
   */
  private async clearMatchingStagingData(): Promise<void> {
    try {
      console.log(`[${this.metadata.id}] Clearing matching staging data...`);

      // Get all mappings for config_id = 11
      const mappings = await db.getMappings(11);

      // Extract unique source_department values from the mapping table
      // These will be matched against source_account in the staging table
      const sourceDepartments = mappings
        .filter(m => m.source_department && m.is_active)
        .map(m => m.source_department)
        .filter((value, index, self) => self.indexOf(value) === index); // Unique values only

      if (sourceDepartments.length === 0) {
        console.log(`[${this.metadata.id}] No source_department mappings found in config 11, skipping cleanup`);
        return;
      }

      console.log(`[${this.metadata.id}] Found ${sourceDepartments.length} unique source_department values to match against staging.source_account`);

      // Delete staging rows where source_account matches any of these source_departments
      const deletedCount = await db.deleteStagingBySourceAccounts(sourceDepartments);

      console.log(`[${this.metadata.id}] Deleted ${deletedCount} matching rows from staging table`);
    } catch (error) {
      console.error(`[${this.metadata.id}] Error clearing matching staging data:`, error);
      // Don't throw - allow import to continue even if cleanup fails
    }
  }

  /**
   * STEP 7: POST-IMPORT HOOK (OPTIONAL)
   */
  async postImport(result: ImportResult, options?: ImportOptions): Promise<void> {
    await super.postImport(result, options);

    console.log(`[${this.metadata.id}] Post-import cleanup`);

    // TODO: Add post-import logic
    // - Send notifications
    // - Update statistics
    // - Trigger dependent processes
    // - Clean up temporary files
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

  /**
   * Format phone number
   */
  private formatPhone(phone: string | undefined): string | null {
    if (!phone) return null;
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    // Format as needed
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return digits;
  }
}

/**
 * STEP 8: REGISTER YOUR PROCESSOR
 * ===============================
 * Don't forget to register your processor in the ImportRegistry!
 *
 * In src/services/imports/core/registry.ts, add:
 * ```typescript
 * import { AccpacRoomRevImportProcessor } from '../processors/accpacRoomRev';
 *
 * // In the initialize() method:
 * this.register(new AccpacRoomRevImportProcessor());
 * ```
 */
