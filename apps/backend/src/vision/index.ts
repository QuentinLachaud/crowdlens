/**
 * Vision Provider Index
 * 
 * Export all vision-related types and implementations.
 */

// Types
export * from './types';

// Provider interface and utilities
export type { VisionProvider, VisionProviderConfig, VisionResult } from './provider';
export { cosineSimilarity, euclideanDistance } from './provider';

// Implementations
export { DummyVisionProvider } from './dummyProvider';

// Factory function to create provider based on environment
import type { VisionProvider, VisionProviderConfig } from './provider';
import { DummyVisionProvider } from './dummyProvider';

export type VisionProviderType = 'dummy' | 'aws-rekognition' | 'google-vision';

/**
 * Create a vision provider based on configuration.
 * Falls back to dummy provider if requested provider is not available.
 */
export function createVisionProvider(
  type: VisionProviderType,
  config?: VisionProviderConfig
): VisionProvider {
  switch (type) {
    case 'aws-rekognition':
      // TODO: Implement AWS Rekognition provider
      // Falls through to dummy for now
      return new DummyVisionProvider(config);
    
    case 'google-vision':
      // TODO: Implement Google Vision provider
      // Falls through to dummy for now
      return new DummyVisionProvider(config);
    
    case 'dummy':
    default:
      return new DummyVisionProvider(config);
  }
}
