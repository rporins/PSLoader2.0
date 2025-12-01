/**
 * Validations Module
 * ==================
 *
 * Central export point for the validation system.
 * Import this module to access the validation registry and execute validations.
 *
 * Usage:
 * ```typescript
 * import { ValidationRegistry } from './services/validations';
 *
 * // Execute a validation
 * const result = await ValidationRegistry.executeValidation('duplicate_records', { ou: 'hotel123' });
 *
 * // Get all validations
 * const allValidations = ValidationRegistry.getAllMetadata();
 * ```
 */

// Export core interfaces
export * from './core/interfaces';

// Export base processor for creating new validations
export { BaseValidationProcessor } from './core/baseProcessor';

// Export registry
export { ValidationRegistry } from './core/registry';

// Re-export as default for convenience
export { ValidationRegistry as default } from './core/registry';
