/**
 * Storage Module Index
 * 
 * Export storage interfaces and implementations.
 */

export type { StorageService } from './types';
export { InMemoryStorage } from './memory';

// Re-export models for convenience
export * from '../models';
