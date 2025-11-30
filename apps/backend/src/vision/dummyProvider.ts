/**
 * Dummy Vision Provider
 * 
 * A mock implementation of VisionProvider for development and testing.
 * Returns randomized but realistic-looking detection results.
 * 
 * Use this when real vision API credentials are not available.
 */

import {
  VisionProvider,
  VisionProviderConfig,
  VisionResult,
  cosineSimilarity,
} from './provider';
import {
  DetectedFace,
  DetectedAttributes,
  DetectedText,
  PhotoDetectionResult,
  ClothingColor,
  ClothingType,
} from './types';

/** Generate a random ID */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/** Generate a random float in range */
function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/** Generate a random int in range */
function randomInt(min: number, max: number): number {
  return Math.floor(randomFloat(min, max + 1));
}

/** Pick random item from array */
function randomPick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/** Pick random items from array */
function randomPickMultiple<T>(items: T[], count: number): T[] {
  const shuffled = [...items].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/** Available colors for mock data */
const COLORS: ClothingColor[] = [
  'red', 'orange', 'yellow', 'green', 'blue', 'purple',
  'pink', 'brown', 'black', 'white', 'gray', 'navy',
];

/** Available clothing types */
const CLOTHING_TYPES: ClothingType[] = [
  'shirt', 'jacket', 'sweater', 'tank-top', 'pants',
  'shorts', 'hat', 'cap', 'vest', 'hoodie', 'jersey',
];

/**
 * Generate a random face embedding (128-dimensional vector).
 * In real implementations, this comes from the ML model.
 */
function generateMockEmbedding(dimensions: number = 128): number[] {
  const embedding: number[] = [];
  for (let i = 0; i < dimensions; i++) {
    embedding.push(randomFloat(-1, 1));
  }
  // Normalize to unit vector
  const norm = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
  return embedding.map(v => v / norm);
}

/**
 * Generate mock face detections
 */
function generateMockFaces(count: number): DetectedFace[] {
  const faces: DetectedFace[] = [];
  
  for (let i = 0; i < count; i++) {
    const x = randomFloat(0.1, 0.7);
    const y = randomFloat(0.05, 0.4);
    const size = randomFloat(0.08, 0.2);
    
    faces.push({
      id: generateId(),
      boundingBox: {
        x,
        y,
        width: size,
        height: size * 1.2, // Faces are typically taller than wide
      },
      embedding: generateMockEmbedding(128),
      confidence: randomFloat(0.85, 0.99),
      landmarks: {
        leftEye: { x: x + size * 0.25, y: y + size * 0.35 },
        rightEye: { x: x + size * 0.75, y: y + size * 0.35 },
        nose: { x: x + size * 0.5, y: y + size * 0.6 },
        leftMouth: { x: x + size * 0.3, y: y + size * 0.85 },
        rightMouth: { x: x + size * 0.7, y: y + size * 0.85 },
      },
      ageRange: { low: randomInt(18, 35), high: randomInt(36, 55) },
      gender: randomPick(['male', 'female', 'unknown']),
    });
  }
  
  return faces;
}

/**
 * Generate mock clothing attributes for a person
 */
function generateMockAttributes(faces: DetectedFace[]): DetectedAttributes[] {
  return faces.map((face, index) => {
    const dominantColors = randomPickMultiple(COLORS, randomInt(1, 3));
    const primaryColor = dominantColors[0];
    const secondaryColor = dominantColors[1];
    
    const clothingType = randomPick(CLOTHING_TYPES);
    const descriptor = secondaryColor
      ? `${primaryColor} and ${secondaryColor} ${clothingType}`
      : `${primaryColor} ${clothingType}`;
    
    // Person bounding box extends below face
    const personBox = {
      x: Math.max(0, face.boundingBox.x - 0.05),
      y: face.boundingBox.y,
      width: face.boundingBox.width + 0.1,
      height: Math.min(0.8, face.boundingBox.height * 4),
    };
    
    return {
      personId: generateId(),
      boundingBox: personBox,
      faceDetectionId: face.id,
      dominantColors,
      clothingItems: [
        {
          type: clothingType,
          primaryColor,
          secondaryColor,
          confidence: randomFloat(0.7, 0.95),
        },
      ],
      descriptors: [descriptor],
      confidence: randomFloat(0.8, 0.95),
    };
  });
}

/**
 * Generate mock bib number detections
 */
function generateMockBibNumbers(faces: DetectedFace[]): DetectedText[] {
  // Only some people have visible bib numbers
  const bibCount = Math.floor(faces.length * 0.6);
  const facesWithBibs = randomPickMultiple(faces, bibCount);
  
  return facesWithBibs.map(face => {
    const bibNumber = randomInt(1, 9999).toString();
    
    // Bib is typically on the torso, below the face
    const bibBox = {
      x: face.boundingBox.x + face.boundingBox.width * 0.2,
      y: face.boundingBox.y + face.boundingBox.height * 2,
      width: face.boundingBox.width * 0.6,
      height: face.boundingBox.width * 0.3,
    };
    
    return {
      text: bibNumber,
      type: 'bib-number' as const,
      boundingBox: bibBox,
      confidence: randomFloat(0.8, 0.98),
      associatedPersonId: face.id,
    };
  });
}

/**
 * Dummy Vision Provider Implementation
 */
export class DummyVisionProvider implements VisionProvider {
  readonly name = 'dummy';
  private config: VisionProviderConfig;
  
  constructor(config?: Partial<VisionProviderConfig>) {
    this.config = {
      name: 'dummy',
      options: {
        minFaceConfidence: 0.8,
        minTextConfidence: 0.7,
        maxFaces: 20,
        enableClothingAnalysis: true,
        enableTextDetection: true,
        ...config?.options,
      },
    };
  }
  
  async detectFacesAndEmbeddings(
    imageBytes: ArrayBuffer
  ): Promise<VisionResult<DetectedFace[]>> {
    // Simulate processing delay
    await this.simulateDelay(100, 300);
    
    // Random number of faces (1-5 for testing)
    const faceCount = randomInt(1, 5);
    const faces = generateMockFaces(faceCount);
    
    // Filter by confidence threshold
    const minConf = this.config.options?.minFaceConfidence ?? 0.8;
    const filteredFaces = faces.filter(f => f.confidence >= minConf);
    
    return { success: true, data: filteredFaces };
  }
  
  async detectClothingAttributes(
    imageBytes: ArrayBuffer
  ): Promise<VisionResult<DetectedAttributes[]>> {
    await this.simulateDelay(150, 400);
    
    // First detect faces to associate clothing
    const facesResult = await this.detectFacesAndEmbeddings(imageBytes);
    if (!facesResult.success) {
      return facesResult as VisionResult<DetectedAttributes[]>;
    }
    
    const attributes = generateMockAttributes(facesResult.data);
    return { success: true, data: attributes };
  }
  
  async detectText(
    imageBytes: ArrayBuffer
  ): Promise<VisionResult<DetectedText[]>> {
    await this.simulateDelay(80, 200);
    
    // Generate faces to associate bib numbers
    const faceCount = randomInt(1, 5);
    const faces = generateMockFaces(faceCount);
    const textDetections = generateMockBibNumbers(faces);
    
    // Filter by confidence
    const minConf = this.config.options?.minTextConfidence ?? 0.7;
    const filtered = textDetections.filter(t => t.confidence >= minConf);
    
    return { success: true, data: filtered };
  }
  
  async analyzePhoto(
    imageBytes: ArrayBuffer,
    photoId: string
  ): Promise<VisionResult<PhotoDetectionResult>> {
    const startTime = Date.now();
    
    // Run all detections
    const [facesResult, clothingResult, textResult] = await Promise.all([
      this.detectFacesAndEmbeddings(imageBytes),
      this.config.options?.enableClothingAnalysis
        ? this.detectClothingAttributes(imageBytes)
        : Promise.resolve({ success: true as const, data: [] }),
      this.config.options?.enableTextDetection
        ? this.detectText(imageBytes)
        : Promise.resolve({ success: true as const, data: [] }),
    ]);
    
    if (!facesResult.success) {
      return facesResult as VisionResult<PhotoDetectionResult>;
    }
    
    const processingTimeMs = Date.now() - startTime;
    
    const result: PhotoDetectionResult = {
      photoId,
      faces: facesResult.data,
      persons: clothingResult.success ? clothingResult.data : [],
      textDetections: textResult.success ? textResult.data : [],
      metadata: {
        processingTimeMs,
        providerName: this.name,
        imageWidth: 1920, // Mock values
        imageHeight: 1080,
      },
    };
    
    return { success: true, data: result };
  }
  
  compareFaces(embedding1: number[], embedding2: number[]): number {
    return cosineSimilarity(embedding1, embedding2);
  }
  
  async healthCheck(): Promise<boolean> {
    // Dummy provider is always healthy
    return true;
  }
  
  private async simulateDelay(_minMs: number, _maxMs: number): Promise<void> {
    // In Cloudflare Workers, we skip artificial delays
    // Real providers will have natural latency
    return Promise.resolve();
  }
}
