/**
 * Import Processors Service
 * ========================
 *
 * This service contains all import processor definitions and logic.
 * Each processor is responsible for handling a specific type of data import.
 *
 * Architecture:
 * - Each import processor implements the IImportProcessor interface
 * - Processors are registered in the ImportRegistry
 * - Each processor can define its own validation rules and processing logic
 * - CSV parsing is handled centrally with row counting capability
 *
 * Future extensibility:
 * - Add new processors by implementing IImportProcessor
 * - Register them in the ImportRegistry
 * - Each processor can have custom validation, transformation, and processing logic
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';

// ====================================================================
// TYPES & INTERFACES
// ====================================================================

/**
 * Import processor metadata
 * Describes the import type and its capabilities
 */
export interface ImportProcessorMetadata {
  id: string;                    // Unique identifier for the import
  name: string;                   // Display name for UI
  description: string;            // Detailed description for users
  category: string;               // Category for grouping (e.g., 'Guest Data', 'Inventory', 'Financial')
  supportedFormats: string[];     // File formats this processor can handle
  required: boolean;              // Whether this import is mandatory
  order: number;                  // Processing order (lower numbers process first)
  requiredColumns?: string[];     // Columns that must be present in the file
  optionalColumns?: string[];     // Columns that are optional but recognized
  sampleDataUrl?: string;         // URL to download sample CSV template
  validationRules?: string[];     // Human-readable validation rules
}

/**
 * Import result after processing
 * Contains the outcome of the import operation
 */
export interface ImportResult {
  success: boolean;
  rowCount: number;
  processedRows?: number;
  skippedRows?: number;
  errors?: string[];
  warnings?: string[];
  data?: any[];                   // Parsed data (for future use)
  metadata?: Record<string, any>; // Additional metadata about the import
}

/**
 * Import validation result
 * Result of pre-import validation
 */
export interface ValidationResult {
  isValid: boolean;
  rowCount: number;
  columnCount: number;
  detectedColumns: string[];
  missingRequiredColumns?: string[];
  errors?: string[];
  warnings?: string[];
  fileInfo?: {
    size: number;
    encoding: string;
    delimiter?: string;
  };
}

/**
 * Core import processor interface
 * All import processors must implement this interface
 */
export interface IImportProcessor {
  metadata: ImportProcessorMetadata;

  /**
   * Validate the file before processing
   * Checks structure, required columns, data types, etc.
   */
  validate(filePath: string, fileType: string): Promise<ValidationResult>;

  /**
   * Process the import file
   * Performs the actual data import and transformation
   */
  process(filePath: string, fileType: string, options?: any): Promise<ImportResult>;

  /**
   * Get a preview of the file contents
   * Returns first N rows for user verification
   */
  preview?(filePath: string, fileType: string, rows?: number): Promise<any[]>;

  /**
   * Post-process hook
   * Called after successful import for any cleanup or additional processing
   */
  postProcess?(importResult: ImportResult): Promise<void>;
}

// ====================================================================
// CSV/EXCEL HELPER FUNCTIONS
// ====================================================================

/**
 * Helper function to read and parse CSV files
 * Returns parsed data with row count
 */
async function parseCSVFile(filePath: string, options?: any): Promise<{ data: any[], rowCount: number, columns: string[] }> {
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');

    // Parse CSV with headers
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      ...options
    });

    // Get column names from first record
    const columns = records.length > 0 ? Object.keys(records[0]) : [];

    return {
      data: records,
      rowCount: records.length,
      columns: columns
    };
  } catch (error) {
    console.error('Error parsing CSV file:', error);
    throw new Error(`Failed to parse CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Helper function to read and parse Excel files
 * Supports .xlsx and .xls formats
 */
async function parseExcelFile(filePath: string, sheetName?: string): Promise<{ data: any[], rowCount: number, columns: string[] }> {
  try {
    const fileBuffer = await fs.readFile(filePath);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

    // Use specified sheet or first sheet
    const sheet = sheetName
      ? workbook.Sheets[sheetName]
      : workbook.Sheets[workbook.SheetNames[0]];

    if (!sheet) {
      throw new Error(`Sheet ${sheetName || 'default'} not found in Excel file`);
    }

    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(sheet);
    const columns = data.length > 0 ? Object.keys(data[0]) : [];

    return {
      data: data,
      rowCount: data.length,
      columns: columns
    };
  } catch (error) {
    console.error('Error parsing Excel file:', error);
    throw new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generic file parser that handles CSV, XLS, and XLSX
 */
async function parseFile(filePath: string, fileType: string): Promise<{ data: any[], rowCount: number, columns: string[] }> {
  const ext = fileType.toLowerCase();

  switch (ext) {
    case 'csv':
      return parseCSVFile(filePath);
    case 'xls':
    case 'xlsx':
      return parseExcelFile(filePath);
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

// ====================================================================
// DEMO IMPORT PROCESSORS
// ====================================================================

/**
 * 1. Customer Data Import Processor
 * Handles customer information, contact details, and preferences
 */
export class CustomerDataImportProcessor implements IImportProcessor {
  metadata: ImportProcessorMetadata = {
    id: 'customer_data',
    name: 'Customer Data Import',
    description: 'Import customer profiles including contact information, preferences, and loyalty status',
    category: 'Customer Management',
    supportedFormats: ['csv', 'xlsx', 'xls'],
    required: false,
    order: 1,
    requiredColumns: ['customer_id', 'first_name', 'last_name', 'email'],
    optionalColumns: ['phone', 'address', 'city', 'country', 'loyalty_tier', 'preferences'],
    validationRules: [
      'Customer ID must be unique',
      'Email must be valid format',
      'First and Last name are required',
      'Phone numbers will be standardized to international format'
    ]
  };

  async validate(filePath: string, fileType: string): Promise<ValidationResult> {
    try {
      const { data, rowCount, columns } = await parseFile(filePath, fileType);

      // Check for required columns
      const missingColumns = this.metadata.requiredColumns?.filter(
        col => !columns.includes(col)
      ) || [];

      const fileStats = await fs.stat(filePath);

      return {
        isValid: missingColumns.length === 0,
        rowCount: rowCount,
        columnCount: columns.length,
        detectedColumns: columns,
        missingRequiredColumns: missingColumns.length > 0 ? missingColumns : undefined,
        warnings: rowCount > 10000 ? ['Large file detected. Processing may take longer.'] : undefined,
        fileInfo: {
          size: fileStats.size,
          encoding: 'utf-8',
          delimiter: fileType === 'csv' ? ',' : undefined
        }
      };
    } catch (error) {
      return {
        isValid: false,
        rowCount: 0,
        columnCount: 0,
        detectedColumns: [],
        errors: [error instanceof Error ? error.message : 'Unknown validation error']
      };
    }
  }

  async process(filePath: string, fileType: string): Promise<ImportResult> {
    try {
      const { data, rowCount } = await parseFile(filePath, fileType);

      // For demo purposes, just count rows
      // In production, this would:
      // - Validate each row
      // - Transform data
      // - Check for duplicates
      // - Store in database

      return {
        success: true,
        rowCount: rowCount,
        processedRows: rowCount,
        skippedRows: 0,
        metadata: {
          importType: this.metadata.id,
          timestamp: new Date().toISOString(),
          uniqueCustomers: rowCount // Simplified for demo
        }
      };
    } catch (error) {
      return {
        success: false,
        rowCount: 0,
        errors: [error instanceof Error ? error.message : 'Processing failed']
      };
    }
  }
}

/**
 * 2. Inventory Management Import Processor
 * Handles product inventory, stock levels, and SKU management
 */
export class InventoryImportProcessor implements IImportProcessor {
  metadata: ImportProcessorMetadata = {
    id: 'inventory_management',
    name: 'Inventory Management',
    description: 'Import product inventory including stock levels, SKUs, locations, and reorder points',
    category: 'Operations',
    supportedFormats: ['csv', 'xlsx', 'xls'],
    required: false,
    order: 2,
    requiredColumns: ['sku', 'product_name', 'quantity', 'location'],
    optionalColumns: ['reorder_point', 'unit_cost', 'supplier', 'category', 'barcode'],
    validationRules: [
      'SKU must be unique',
      'Quantity must be a positive number',
      'Location must match existing warehouse codes',
      'Reorder points must be positive integers'
    ]
  };

  async validate(filePath: string, fileType: string): Promise<ValidationResult> {
    try {
      const { data, rowCount, columns } = await parseFile(filePath, fileType);

      const missingColumns = this.metadata.requiredColumns?.filter(
        col => !columns.includes(col)
      ) || [];

      const fileStats = await fs.stat(filePath);

      // Additional validation for inventory
      const warnings: string[] = [];
      if (columns.includes('quantity')) {
        // Check for potential data issues (in production, would check actual values)
        warnings.push('Quantity values will be validated as positive integers');
      }

      return {
        isValid: missingColumns.length === 0,
        rowCount: rowCount,
        columnCount: columns.length,
        detectedColumns: columns,
        missingRequiredColumns: missingColumns.length > 0 ? missingColumns : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
        fileInfo: {
          size: fileStats.size,
          encoding: 'utf-8'
        }
      };
    } catch (error) {
      return {
        isValid: false,
        rowCount: 0,
        columnCount: 0,
        detectedColumns: [],
        errors: [error instanceof Error ? error.message : 'Validation failed']
      };
    }
  }

  async process(filePath: string, fileType: string): Promise<ImportResult> {
    try {
      const { data, rowCount } = await parseFile(filePath, fileType);

      // Demo: Just count rows
      // Production would validate quantities, check SKU uniqueness, etc.

      return {
        success: true,
        rowCount: rowCount,
        processedRows: rowCount,
        skippedRows: 0,
        metadata: {
          importType: this.metadata.id,
          timestamp: new Date().toISOString(),
          totalSKUs: rowCount,
          totalQuantity: 'N/A (demo mode)'
        }
      };
    } catch (error) {
      return {
        success: false,
        rowCount: 0,
        errors: [error instanceof Error ? error.message : 'Processing failed']
      };
    }
  }
}

/**
 * 3. Transaction History Import Processor
 * Handles financial transactions, payments, and billing records
 */
export class TransactionHistoryImportProcessor implements IImportProcessor {
  metadata: ImportProcessorMetadata = {
    id: 'transaction_history',
    name: 'Transaction History',
    description: 'Import financial transactions including payments, refunds, and billing records',
    category: 'Financial',
    supportedFormats: ['csv', 'xlsx', 'xls'],
    required: false,
    order: 3,
    requiredColumns: ['transaction_id', 'date', 'amount', 'type'],
    optionalColumns: ['customer_id', 'payment_method', 'status', 'reference', 'notes'],
    validationRules: [
      'Transaction ID must be unique',
      'Amount must be a valid decimal number',
      'Date must be in ISO format (YYYY-MM-DD)',
      'Type must be: payment, refund, or adjustment'
    ]
  };

  async validate(filePath: string, fileType: string): Promise<ValidationResult> {
    try {
      const { data, rowCount, columns } = await parseFile(filePath, fileType);

      const missingColumns = this.metadata.requiredColumns?.filter(
        col => !columns.includes(col)
      ) || [];

      const fileStats = await fs.stat(filePath);

      return {
        isValid: missingColumns.length === 0,
        rowCount: rowCount,
        columnCount: columns.length,
        detectedColumns: columns,
        missingRequiredColumns: missingColumns.length > 0 ? missingColumns : undefined,
        warnings: ['Financial data will be validated for accuracy'],
        fileInfo: {
          size: fileStats.size,
          encoding: 'utf-8'
        }
      };
    } catch (error) {
      return {
        isValid: false,
        rowCount: 0,
        columnCount: 0,
        detectedColumns: [],
        errors: [error instanceof Error ? error.message : 'Validation failed']
      };
    }
  }

  async process(filePath: string, fileType: string): Promise<ImportResult> {
    try {
      const { data, rowCount } = await parseFile(filePath, fileType);

      return {
        success: true,
        rowCount: rowCount,
        processedRows: rowCount,
        skippedRows: 0,
        metadata: {
          importType: this.metadata.id,
          timestamp: new Date().toISOString(),
          totalTransactions: rowCount
        }
      };
    } catch (error) {
      return {
        success: false,
        rowCount: 0,
        errors: [error instanceof Error ? error.message : 'Processing failed']
      };
    }
  }
}

/**
 * 4. Employee Records Import Processor
 * Handles staff information, schedules, and department assignments
 */
export class EmployeeRecordsImportProcessor implements IImportProcessor {
  metadata: ImportProcessorMetadata = {
    id: 'employee_records',
    name: 'Employee Records',
    description: 'Import staff information including personal details, departments, roles, and schedules',
    category: 'Human Resources',
    supportedFormats: ['csv', 'xlsx', 'xls'],
    required: false,
    order: 4,
    requiredColumns: ['employee_id', 'first_name', 'last_name', 'department', 'role'],
    optionalColumns: ['email', 'phone', 'hire_date', 'manager_id', 'salary_grade', 'shift'],
    validationRules: [
      'Employee ID must be unique',
      'Department must match existing departments',
      'Hire date must be in the past',
      'Email format will be validated'
    ]
  };

  async validate(filePath: string, fileType: string): Promise<ValidationResult> {
    try {
      const { data, rowCount, columns } = await parseFile(filePath, fileType);

      const missingColumns = this.metadata.requiredColumns?.filter(
        col => !columns.includes(col)
      ) || [];

      const fileStats = await fs.stat(filePath);

      // HR-specific warnings
      const warnings: string[] = [];
      if (columns.includes('salary_grade')) {
        warnings.push('Salary information detected - ensure proper access controls');
      }

      return {
        isValid: missingColumns.length === 0,
        rowCount: rowCount,
        columnCount: columns.length,
        detectedColumns: columns,
        missingRequiredColumns: missingColumns.length > 0 ? missingColumns : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
        fileInfo: {
          size: fileStats.size,
          encoding: 'utf-8'
        }
      };
    } catch (error) {
      return {
        isValid: false,
        rowCount: 0,
        columnCount: 0,
        detectedColumns: [],
        errors: [error instanceof Error ? error.message : 'Validation failed']
      };
    }
  }

  async process(filePath: string, fileType: string): Promise<ImportResult> {
    try {
      const { data, rowCount } = await parseFile(filePath, fileType);

      return {
        success: true,
        rowCount: rowCount,
        processedRows: rowCount,
        skippedRows: 0,
        metadata: {
          importType: this.metadata.id,
          timestamp: new Date().toISOString(),
          totalEmployees: rowCount
        }
      };
    } catch (error) {
      return {
        success: false,
        rowCount: 0,
        errors: [error instanceof Error ? error.message : 'Processing failed']
      };
    }
  }
}

/**
 * 5. Booking Reservations Import Processor
 * Handles reservation data, booking details, and guest preferences
 */
export class BookingReservationsImportProcessor implements IImportProcessor {
  metadata: ImportProcessorMetadata = {
    id: 'booking_reservations',
    name: 'Booking Reservations',
    description: 'Import reservation details including dates, room assignments, guest counts, and special requests',
    category: 'Reservations',
    supportedFormats: ['csv', 'xlsx', 'xls'],
    required: true,
    order: 0,  // Process first as it's often the most critical
    requiredColumns: ['reservation_id', 'guest_name', 'check_in_date', 'check_out_date', 'room_type'],
    optionalColumns: ['room_number', 'rate', 'adults', 'children', 'special_requests', 'payment_status'],
    validationRules: [
      'Reservation ID must be unique',
      'Check-in date must be before check-out date',
      'Guest name is required',
      'Room type must match available inventory'
    ]
  };

  async validate(filePath: string, fileType: string): Promise<ValidationResult> {
    try {
      const { data, rowCount, columns } = await parseFile(filePath, fileType);

      const missingColumns = this.metadata.requiredColumns?.filter(
        col => !columns.includes(col)
      ) || [];

      const fileStats = await fs.stat(filePath);

      // Reservation-specific validation warnings
      const warnings: string[] = [];
      if (rowCount > 500) {
        warnings.push('Large reservation batch detected - processing may take several minutes');
      }

      return {
        isValid: missingColumns.length === 0,
        rowCount: rowCount,
        columnCount: columns.length,
        detectedColumns: columns,
        missingRequiredColumns: missingColumns.length > 0 ? missingColumns : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
        fileInfo: {
          size: fileStats.size,
          encoding: 'utf-8'
        }
      };
    } catch (error) {
      return {
        isValid: false,
        rowCount: 0,
        columnCount: 0,
        detectedColumns: [],
        errors: [error instanceof Error ? error.message : 'Validation failed']
      };
    }
  }

  async process(filePath: string, fileType: string): Promise<ImportResult> {
    try {
      const { data, rowCount } = await parseFile(filePath, fileType);

      // In production, would validate dates, check room availability, etc.

      return {
        success: true,
        rowCount: rowCount,
        processedRows: rowCount,
        skippedRows: 0,
        metadata: {
          importType: this.metadata.id,
          timestamp: new Date().toISOString(),
          totalReservations: rowCount
        }
      };
    } catch (error) {
      return {
        success: false,
        rowCount: 0,
        errors: [error instanceof Error ? error.message : 'Processing failed']
      };
    }
  }
}

// ====================================================================
// IMPORT REGISTRY
// ====================================================================

/**
 * Central registry for all import processors
 * Manages registration and retrieval of import processors
 */
export class ImportRegistry {
  private static processors: Map<string, IImportProcessor> = new Map();
  private static initialized = false;

  /**
   * Initialize the registry with all available processors
   */
  static initialize(): void {
    if (this.initialized) return;

    // Register all demo processors
    this.register(new BookingReservationsImportProcessor());
    this.register(new CustomerDataImportProcessor());
    this.register(new InventoryImportProcessor());
    this.register(new TransactionHistoryImportProcessor());
    this.register(new EmployeeRecordsImportProcessor());

    this.initialized = true;
  }

  /**
   * Register a new import processor
   */
  static register(processor: IImportProcessor): void {
    this.processors.set(processor.metadata.id, processor);
    console.log(`Registered import processor: ${processor.metadata.name} (${processor.metadata.id})`);
  }

  /**
   * Get a processor by ID
   */
  static getProcessor(id: string): IImportProcessor | undefined {
    this.initialize();
    return this.processors.get(id);
  }

  /**
   * Get all registered processors
   */
  static getAllProcessors(): IImportProcessor[] {
    this.initialize();
    return Array.from(this.processors.values());
  }

  /**
   * Get all processor metadata for UI display
   */
  static getAllMetadata(): ImportProcessorMetadata[] {
    this.initialize();
    return Array.from(this.processors.values())
      .map(p => p.metadata)
      .sort((a, b) => a.order - b.order);
  }

  /**
   * Get processors by category
   */
  static getByCategory(category: string): IImportProcessor[] {
    this.initialize();
    return Array.from(this.processors.values())
      .filter(p => p.metadata.category === category);
  }

  /**
   * Get required processors only
   */
  static getRequiredProcessors(): IImportProcessor[] {
    this.initialize();
    return Array.from(this.processors.values())
      .filter(p => p.metadata.required);
  }
}

// ====================================================================
// EXPORT PUBLIC API
// ====================================================================

export default ImportRegistry;

// Export utility functions for external use
export {
  parseCSVFile,
  parseExcelFile,
  parseFile
};