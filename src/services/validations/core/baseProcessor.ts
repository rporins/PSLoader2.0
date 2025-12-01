/**
 * Base Validation Processor Abstract Class
 * =========================================
 *
 * This abstract class provides common functionality for all validation processors.
 * Extend this class when creating new validation processors to get built-in features.
 */

import {
  IValidationProcessor,
  ValidationProcessorMetadata,
  ValidationResult,
  ValidationOptions,
  ValidationError
} from './interfaces';

/**
 * Abstract base class for validation processors
 * Provides common functionality and default implementations
 */
export abstract class BaseValidationProcessor implements IValidationProcessor {
  /** Processor metadata - must be defined by subclasses */
  abstract metadata: ValidationProcessorMetadata;

  /** Track if processor has been initialized */
  protected initialized: boolean = false;

  /** Database client reference (will be injected) */
  protected db?: any;

  /**
   * Initialize the processor
   * Override to add custom initialization logic
   */
  protected async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log(`[${this.metadata.id}] Initializing validation processor: ${this.metadata.name}`);
    this.initialized = true;
  }

  /**
   * Set database client
   * Called by the registry to inject database access
   */
  setDatabase(db: any): void {
    this.db = db;
  }

  /**
   * Pre-validation hook with default implementation
   * Override to add custom pre-validation logic
   */
  async preValidation(options?: ValidationOptions): Promise<void> {
    await this.initialize();

    if (options?.skip) {
      console.log(`[${this.metadata.id}] Validation skipped`);
      return;
    }

    console.log(`[${this.metadata.id}] Running pre-validation hooks`);

    // Check if database is available
    if (!this.db) {
      throw new Error('Database client not available');
    }
  }

  /**
   * Execute validation - must be implemented by subclasses
   */
  abstract validate(options?: ValidationOptions): Promise<ValidationResult>;

  /**
   * Default post-validation hook
   * Override to add custom post-validation logic
   */
  async postValidation(result: ValidationResult, options?: ValidationOptions): Promise<void> {
    console.log(`[${this.metadata.id}] Running post-validation hooks`);
    console.log(`[${this.metadata.id}] Validation completed:`, {
      success: result.success,
      errors: result.errors?.length || 0,
      warnings: result.warnings?.length || 0,
      recordCount: result.recordCount
    });
  }

  /**
   * Preview what this validation will check
   */
  async preview(options?: ValidationOptions): Promise<{
    description: string;
    recordsToCheck: number;
    estimatedDuration: number;
  }> {
    return {
      description: this.metadata.description,
      recordsToCheck: 0,
      estimatedDuration: this.metadata.estimatedDuration || 1
    };
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    console.log(`[${this.metadata.id}] Cleaning up validation processor`);
    this.initialized = false;
  }

  /**
   * Helper method to create a validation error
   */
  protected createError(
    code: string,
    message: string,
    details?: Partial<ValidationError>
  ): ValidationError {
    return {
      code,
      message,
      severity: 'error',
      ...details
    };
  }

  /**
   * Helper method to create a validation warning
   */
  protected createWarning(
    code: string,
    message: string,
    details?: Partial<ValidationError>
  ): ValidationError {
    return {
      code,
      message,
      severity: 'warning',
      ...details
    };
  }

  /**
   * Log a message with processor context
   */
  protected log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    const prefix = `[${this.metadata.id}]`;
    switch (level) {
      case 'error':
        console.error(prefix, message);
        break;
      case 'warn':
        console.warn(prefix, message);
        break;
      default:
        console.log(prefix, message);
    }
  }

  /**
   * Format validation result with timing information
   */
  protected formatResult(
    success: boolean,
    recordCount: number,
    errors: string[] = [],
    warnings: string[] = [],
    startTime: Date = new Date()
  ): ValidationResult {
    const endTime = new Date();

    return {
      success,
      recordCount,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      stats: {
        startTime,
        endTime,
        duration: endTime.getTime() - startTime.getTime(),
        recordsChecked: recordCount,
        issuesFound: errors.length + warnings.length
      },
      metadata: {
        validationType: this.metadata.id,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Query helper for SQLite
   * Safely execute queries with error handling
   */
  protected async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    if (!this.db) {
      throw new Error('Database client not available');
    }

    try {
      const result = await this.db.execute({
        sql,
        args: params
      });

      return (result.rows || []) as T[];
    } catch (error) {
      this.log(`Query error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      throw error;
    }
  }

  /**
   * Query helper that returns a single value
   */
  protected async queryScalar<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const rows = await this.query(sql, params);
    if (rows.length === 0) return null;

    const firstRow = rows[0] as any;
    const firstValue = Object.values(firstRow)[0];
    return firstValue as T;
  }

  /**
   * Count records in a table with optional where clause
   */
  protected async countRecords(
    table: string,
    whereClause?: string,
    params?: any[]
  ): Promise<number> {
    const sql = whereClause
      ? `SELECT COUNT(*) as count FROM ${table} WHERE ${whereClause}`
      : `SELECT COUNT(*) as count FROM ${table}`;

    const count = await this.queryScalar<number>(sql, params || []);
    return count || 0;
  }
}
