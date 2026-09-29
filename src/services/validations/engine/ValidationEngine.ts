/**
 * Validation Engine
 * =================
 *
 * Simple validation engine that executes named validations.
 * Validations are registered by name and looked up at runtime.
 */

export interface ValidationResult {
  success: boolean;
  recordCount?: number;
  errors?: string[];
  warnings?: string[];
  info?: string[];
  errorDetails?: {
    type: string;
    message: string;
    count: number;
    sampleRecords?: any[];
  }[];
  stats?: {
    startTime?: Date;
    endTime?: Date;
    duration?: number;
    recordsChecked?: number;
    issuesFound?: number;
  };
  /**
   * Present when a one-click fix is available for this failure.
   * The fix itself lives in validationAutoFixes under the same validation name.
   */
  autoFix?: AutoFixOffer;
}

export interface AutoFixOffer {
  /** Button label, e.g. "Set to 0" */
  label: string;
  /** Short explanation shown next to the button */
  description: string;
  /** Number of flagged entries the fix will touch */
  affectedCount: number;
}

export interface AutoFixResult {
  rowsAffected: number;
}

export interface ValidationOptions {
  ou: string;
  period?: {
    year?: number;
    month?: number;
  };
}

export type ValidationFn = (db: any, options: ValidationOptions) => Promise<ValidationResult>;

export type AutoFixFn = (db: any, options: ValidationOptions) => Promise<AutoFixResult>;

/**
 * Validation Engine - executes named validations
 */
export class ValidationEngine {
  private db: any;
  private validations: Map<string, ValidationFn> = new Map();
  private autoFixes: Map<string, AutoFixFn> = new Map();

  constructor(db: any) {
    this.db = db;
  }

  /**
   * Register a validation function by name
   */
  register(name: string, fn: ValidationFn): void {
    this.validations.set(name, fn);
  }

  /**
   * Register multiple validations at once
   */
  registerAll(definitions: Record<string, ValidationFn>): void {
    for (const [name, fn] of Object.entries(definitions)) {
      this.register(name, fn);
    }
  }

  /**
   * Execute a validation by name
   */
  async execute(validationName: string, options: ValidationOptions): Promise<ValidationResult> {
    const validationFn = this.validations.get(validationName);

    if (!validationFn) {
      return {
        success: false,
        errors: [`Unknown validation: "${validationName}". Ensure it is defined in validationDefinitions.ts`]
      };
    }

    const startTime = new Date();

    try {
      const result = await validationFn(this.db, options);

      // Ensure stats are populated
      if (!result.stats) {
        result.stats = {};
      }
      result.stats.startTime = startTime;
      result.stats.endTime = new Date();
      result.stats.duration = result.stats.endTime.getTime() - startTime.getTime();

      return result;
    } catch (error) {
      return {
        success: false,
        errors: [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        stats: {
          startTime,
          endTime: new Date(),
          duration: Date.now() - startTime.getTime()
        }
      };
    }
  }

  /**
   * Execute multiple validations sequentially
   */
  async executeAll(
    validationNames: string[],
    options: ValidationOptions,
    stopOnFirstError: boolean = false
  ): Promise<Map<string, ValidationResult>> {
    const results = new Map<string, ValidationResult>();

    for (const name of validationNames) {
      const result = await this.execute(name, options);
      results.set(name, result);

      if (stopOnFirstError && !result.success) {
        break;
      }
    }

    return results;
  }

  /**
   * Register one-click fixes, keyed by the validation name they fix
   */
  registerAutoFixes(fixes: Record<string, AutoFixFn>): void {
    for (const [name, fn] of Object.entries(fixes)) {
      this.autoFixes.set(name, fn);
    }
  }

  /**
   * Apply the registered auto-fix for a validation
   */
  async applyAutoFix(validationName: string, options: ValidationOptions): Promise<AutoFixResult> {
    const fixFn = this.autoFixes.get(validationName);
    if (!fixFn) {
      throw new Error(`No auto-fix registered for validation "${validationName}"`);
    }
    return fixFn(this.db, options);
  }

  /**
   * Check if a validation is registered
   */
  has(name: string): boolean {
    return this.validations.has(name);
  }

  /**
   * Get list of all registered validation names
   */
  getRegisteredNames(): string[] {
    return Array.from(this.validations.keys());
  }

  /**
   * Get count of registered validations
   */
  get count(): number {
    return this.validations.size;
  }
}
