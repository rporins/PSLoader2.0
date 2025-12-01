/**
 * Core Interfaces and Types for Validation System
 * ================================================
 *
 * This file contains all the type definitions and interfaces used by the validation system.
 * When creating a new validation processor, you'll implement the IValidationProcessor interface.
 */

/**
 * Validation processor metadata
 * Describes the validation and its purpose
 */
export interface ValidationProcessorMetadata {
  /** Unique identifier for the validation (e.g., 'duplicate_records', 'balance_check') */
  id: string;

  /** Display name shown in UI (e.g., 'Duplicate Records Check') */
  name: string;

  /** Detailed description explaining what this validation checks */
  description: string;

  /** Category for grouping validations (e.g., 'Data Quality', 'Financial', 'Referential Integrity') */
  category: string;

  /** Whether this validation is mandatory */
  required: boolean;

  /** Execution order - lower numbers execute first */
  sequence: number;

  /** Expected duration estimate (in seconds) for UI display */
  estimatedDuration?: number;

  /** Tags for filtering/searching validations */
  tags?: string[];

  /** Version of this validation processor */
  version?: string;

  /** OU (organizational unit) this validation applies to */
  ou?: string;
}

/**
 * Validation execution result
 * Contains the outcome of the validation
 */
export interface ValidationResult {
  /** Whether the validation passed */
  success: boolean;

  /** Number of records checked */
  recordCount?: number;

  /** Validation errors (failures that must be fixed) */
  errors?: string[];

  /** Validation warnings (issues that should be reviewed but don't prevent use) */
  warnings?: string[];

  /** Information messages about what was checked */
  info?: string[];

  /** Detailed breakdown by error type */
  errorDetails?: {
    type: string;
    message: string;
    count: number;
    sampleRecords?: any[];
  }[];

  /** Statistics about the validation */
  stats?: {
    startTime?: Date;
    endTime?: Date;
    duration?: number;
    recordsChecked?: number;
    issuesFound?: number;
  };

  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Validation options
 * Allows customization of validation behavior
 */
export interface ValidationOptions {
  /** Skip this validation entirely */
  skip?: boolean;

  /** Run in detailed mode (collect more information) */
  detailed?: boolean;

  /** Maximum number of errors to collect before stopping */
  maxErrors?: number;

  /** Whether to stop on first error */
  stopOnFirstError?: boolean;

  /** Organizational unit to validate */
  ou?: string;

  /** Time period to validate (e.g., year/month) */
  period?: {
    year?: number;
    month?: number;
  };

  /** Additional processor-specific options */
  custom?: Record<string, any>;
}

/**
 * Core validation processor interface
 * All validation processors MUST implement this interface
 */
export interface IValidationProcessor {
  /** Metadata describing this processor */
  metadata: ValidationProcessorMetadata;

  /**
   * Pre-validation hook - runs before validation
   * Use for setup tasks like creating temp tables, indexes, etc.
   * @param options - Validation options
   */
  preValidation?(options?: ValidationOptions): Promise<void>;

  /**
   * Execute the validation
   * Performs the actual validation checks
   * @param options - Validation options
   * @returns Validation result with details
   */
  validate(options?: ValidationOptions): Promise<ValidationResult>;

  /**
   * Post-validation hook - runs after validation
   * Use for cleanup, logging, notifications, etc.
   * @param result - The validation result
   * @param options - Validation options
   */
  postValidation?(result: ValidationResult, options?: ValidationOptions): Promise<void>;

  /**
   * Get a preview of what this validation will check
   * Returns information about the validation without running it
   * @param options - Validation options
   * @returns Preview information
   */
  preview?(options?: ValidationOptions): Promise<{
    description: string;
    recordsToCheck: number;
    estimatedDuration: number;
  }>;

  /**
   * Clean up any resources used by this processor
   * Called when processor is being destroyed or app is shutting down
   */
  cleanup?(): Promise<void>;
}

/**
 * Validation execution request
 */
export interface ValidationExecutionRequest {
  /** Validation processor ID */
  validationId: string;

  /** Validation options */
  options?: ValidationOptions;
}

/**
 * Validation execution response
 */
export interface ValidationExecutionResponse {
  /** Whether the validation execution succeeded (not the same as validation passed) */
  success: boolean;

  /** Validation processor ID */
  validationId: string;

  /** Validation result */
  result?: ValidationResult;

  /** Error message if execution failed */
  error?: string;

  /** Execution time in milliseconds */
  duration?: number;
}

/**
 * Validation error details
 * Provides detailed error information
 */
export interface ValidationError {
  /** Error code for programmatic handling */
  code: string;

  /** Human-readable error message */
  message: string;

  /** Record ID where error occurred */
  recordId?: string | number;

  /** Table/entity where error occurred */
  table?: string;

  /** Field/column where error occurred */
  field?: string;

  /** The invalid value that caused the error */
  invalidValue?: any;

  /** Suggested fix for the error */
  suggestion?: string;

  /** Whether this error is auto-fixable */
  autoFixable?: boolean;

  /** Severity level */
  severity?: 'error' | 'warning' | 'info';
}

/**
 * Batch validation result
 * Used when validating multiple items in batches
 */
export interface BatchValidationResult {
  /** Batch number */
  batchNumber: number;

  /** Number of records in this batch */
  recordCount: number;

  /** Number of valid records */
  validRecords: number;

  /** Number of invalid records */
  invalidRecords: number;

  /** Errors in this batch */
  errors?: ValidationError[];
}
