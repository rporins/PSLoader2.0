/**
 * Validation Registry
 * ===================
 *
 * Central registry for managing all validation processors.
 * This is the main entry point for accessing and executing validations.
 */

import {
  IValidationProcessor,
  ValidationProcessorMetadata,
  ValidationOptions,
  ValidationResult,
  ValidationExecutionRequest,
  ValidationExecutionResponse
} from './interfaces';

// Import validation processors
import { TestValidationProcessor } from '../processors/testValidation';
import { DuplicateRecordsValidation } from '../processors/duplicateRecordsValidation';
import { TestValidationProcessor as A3AccountValidation } from '../processors/test_validation';

/**
 * Central registry for all validation processors
 * Singleton pattern for global access
 */
export class ValidationRegistry {
  /** Map of processor ID to processor instance */
  private static processors: Map<string, IValidationProcessor> = new Map();

  /** Whether the registry has been initialized */
  private static initialized = false;

  /** Database client reference */
  private static db: any = null;

  /** Prevent instantiation */
  private constructor() {}

  /**
   * Set the database client for all processors
   * @param db Database client instance
   */
  static setDatabase(db: any): void {
    this.db = db;
    console.log('[ValidationRegistry] Database client configured');

    // Inject database into all existing processors
    for (const processor of this.processors.values()) {
      if ('setDatabase' in processor && typeof processor.setDatabase === 'function') {
        processor.setDatabase(db);
      }
    }
  }

  /**
   * Initialize the registry with all available processors
   * This is called automatically on first use
   */
  static initialize(): void {
    if (this.initialized) {
      console.log('[ValidationRegistry] Already initialized');
      return;
    }

    console.log('[ValidationRegistry] Initializing...');

    // Register all processors here
    // Add new validation processors as you create them

    // Test processor (always first)
    this.register(new TestValidationProcessor());

    // Production processors
    this.register(new DuplicateRecordsValidation());

    // Custom validations
    this.register(new A3AccountValidation());

    // TODO: Register additional validation processors here
    // this.register(new BalanceCheckValidation());
    // this.register(new ReferentialIntegrityValidation());
    // this.register(new RequiredFieldsValidation());
    // this.register(new DataRangeValidation());

    this.initialized = true;
    console.log(`[ValidationRegistry] Initialized with ${this.processors.size} validation processors`);
  }

  /**
   * Register a new validation processor
   * @param processor The processor to register
   */
  static register(processor: IValidationProcessor): void {
    const id = processor.metadata.id;

    if (this.processors.has(id)) {
      console.warn(`[ValidationRegistry] Processor '${id}' already registered, replacing...`);
    }

    // Inject database if available
    if (this.db && 'setDatabase' in processor && typeof processor.setDatabase === 'function') {
      processor.setDatabase(this.db);
    }

    this.processors.set(id, processor);
    console.log(`[ValidationRegistry] Registered validation processor: ${processor.metadata.name} (${id})`);
  }

  /**
   * Unregister a processor
   * @param id Processor ID to unregister
   */
  static unregister(id: string): boolean {
    if (this.processors.has(id)) {
      const processor = this.processors.get(id);
      if (processor && processor.cleanup) {
        processor.cleanup().catch(console.error);
      }
      this.processors.delete(id);
      console.log(`[ValidationRegistry] Unregistered validation processor: ${id}`);
      return true;
    }
    return false;
  }

  /**
   * Get a processor by ID
   * @param id Processor ID
   * @returns Processor instance or undefined
   */
  static getProcessor(id: string): IValidationProcessor | undefined {
    this.initialize();
    return this.processors.get(id);
  }

  /**
   * Get all registered processors
   * @returns Array of all processors
   */
  static getAllProcessors(): IValidationProcessor[] {
    this.initialize();
    return Array.from(this.processors.values());
  }

  /**
   * Get all processor metadata for UI display
   * @returns Array of processor metadata sorted by sequence
   */
  static getAllMetadata(): ValidationProcessorMetadata[] {
    this.initialize();
    return Array.from(this.processors.values())
      .map(p => p.metadata)
      .sort((a, b) => a.sequence - b.sequence);
  }

  /**
   * Get processors by category
   * @param category Category to filter by
   * @returns Array of processors in that category
   */
  static getByCategory(category: string): IValidationProcessor[] {
    this.initialize();
    return Array.from(this.processors.values())
      .filter(p => p.metadata.category === category);
  }

  /**
   * Get required processors only
   * @returns Array of required processors
   */
  static getRequiredProcessors(): IValidationProcessor[] {
    this.initialize();
    return Array.from(this.processors.values())
      .filter(p => p.metadata.required);
  }

  /**
   * Get processors by OU
   * @param ou Organizational unit
   * @returns Array of processors for that OU
   */
  static getByOU(ou: string): IValidationProcessor[] {
    this.initialize();
    return Array.from(this.processors.values())
      .filter(p => !p.metadata.ou || p.metadata.ou === ou);
  }

  /**
   * Search processors by tags
   * @param tags Tags to search for
   * @returns Array of matching processors
   */
  static searchByTags(tags: string[]): IValidationProcessor[] {
    this.initialize();
    return Array.from(this.processors.values())
      .filter(p => {
        if (!p.metadata.tags) return false;
        return tags.some(tag => p.metadata.tags!.includes(tag));
      });
  }

  /**
   * Execute a validation
   * @param validationId Processor ID
   * @param options Validation options
   * @returns Validation execution response
   */
  static async executeValidation(
    validationId: string,
    options?: ValidationOptions
  ): Promise<ValidationExecutionResponse> {
    this.initialize();
    const startTime = Date.now();

    console.log(`[ValidationRegistry] Executing validation '${validationId}'`);

    const processor = this.getProcessor(validationId);
    if (!processor) {
      return {
        success: false,
        validationId,
        error: `Validation processor '${validationId}' not found`
      };
    }

    try {
      // Run pre-validation hooks
      if (processor.preValidation) {
        await processor.preValidation(options);
      }

      // Execute validation
      const result = await processor.validate(options);

      // Run post-validation hooks
      if (processor.postValidation) {
        await processor.postValidation(result, options);
      }

      return {
        success: true,
        validationId,
        result,
        duration: Date.now() - startTime
      };
    } catch (error) {
      console.error(`[ValidationRegistry] Validation execution error:`, error);
      return {
        success: false,
        validationId,
        error: error instanceof Error ? error.message : 'Validation execution failed',
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Execute multiple validations in sequence
   * @param validationIds Array of processor IDs
   * @param options Validation options
   * @returns Array of execution responses
   */
  static async executeMultiple(
    validationIds: string[],
    options?: ValidationOptions
  ): Promise<ValidationExecutionResponse[]> {
    const results: ValidationExecutionResponse[] = [];

    for (const validationId of validationIds) {
      const result = await this.executeValidation(validationId, options);
      results.push(result);

      // Stop if stopOnFirstError is set and validation failed
      if (options?.stopOnFirstError && !result.result?.success) {
        console.log(`[ValidationRegistry] Stopping execution due to failure in '${validationId}'`);
        break;
      }
    }

    return results;
  }

  /**
   * Execute all validations for an OU
   * @param ou Organizational unit
   * @param options Validation options
   * @returns Array of execution responses
   */
  static async executeAllForOU(
    ou: string,
    options?: ValidationOptions
  ): Promise<ValidationExecutionResponse[]> {
    const processors = this.getByOU(ou);
    const validationIds = processors
      .sort((a, b) => a.metadata.sequence - b.metadata.sequence)
      .map(p => p.metadata.id);

    return this.executeMultiple(validationIds, { ...options, ou });
  }

  /**
   * Preview a validation
   * @param validationId Processor ID
   * @param options Validation options
   * @returns Preview information
   */
  static async previewValidation(
    validationId: string,
    options?: ValidationOptions
  ): Promise<{
    description: string;
    recordsToCheck: number;
    estimatedDuration: number;
  }> {
    this.initialize();
    const processor = this.getProcessor(validationId);

    if (!processor) {
      throw new Error(`Validation processor '${validationId}' not found`);
    }

    if (!processor.preview) {
      return {
        description: processor.metadata.description,
        recordsToCheck: 0,
        estimatedDuration: processor.metadata.estimatedDuration || 1
      };
    }

    return processor.preview(options);
  }

  /**
   * Clean up all processors
   * Called on application shutdown
   */
  static async cleanup(): Promise<void> {
    console.log('[ValidationRegistry] Cleaning up all validation processors...');

    const cleanupPromises: Promise<void>[] = [];
    for (const processor of this.processors.values()) {
      if (processor.cleanup) {
        cleanupPromises.push(processor.cleanup());
      }
    }

    await Promise.all(cleanupPromises);
    this.processors.clear();
    this.initialized = false;

    console.log('[ValidationRegistry] Cleanup complete');
  }

  /**
   * Get validation statistics
   * @returns Statistics about registered validations
   */
  static getStatistics(): {
    totalProcessors: number;
    byCategory: Record<string, number>;
    requiredCount: number;
    byOU: Record<string, number>;
  } {
    this.initialize();

    const byCategory: Record<string, number> = {};
    const byOU: Record<string, number> = {};

    for (const processor of this.processors.values()) {
      // Count by category
      const category = processor.metadata.category;
      byCategory[category] = (byCategory[category] || 0) + 1;

      // Count by OU
      const ou = processor.metadata.ou || 'all';
      byOU[ou] = (byOU[ou] || 0) + 1;
    }

    return {
      totalProcessors: this.processors.size,
      byCategory,
      requiredCount: this.getRequiredProcessors().length,
      byOU
    };
  }
}

// Export as default
export default ValidationRegistry;
