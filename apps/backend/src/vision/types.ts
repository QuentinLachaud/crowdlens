/**
 * Vision API Types
 * 
 * Defines common types for face detection, clothing analysis,
 * and text (bib number) recognition across different providers.
 */

/** Bounding box for detected elements */
export interface BoundingBox {
  /** X coordinate (0-1, relative to image width) */
  x: number;
  /** Y coordinate (0-1, relative to image height) */
  y: number;
  /** Width (0-1, relative to image width) */
  width: number;
  /** Height (0-1, relative to image height) */
  height: number;
}

/** Face detection result with embedding */
export interface DetectedFace {
  /** Unique identifier for this detection */
  id: string;
  /** Bounding box of the face */
  boundingBox: BoundingBox;
  /** Face embedding vector for similarity comparison */
  embedding: number[];
  /** Detection confidence (0-1) */
  confidence: number;
  /** Optional landmarks (eyes, nose, mouth positions) */
  landmarks?: {
    leftEye?: { x: number; y: number };
    rightEye?: { x: number; y: number };
    nose?: { x: number; y: number };
    leftMouth?: { x: number; y: number };
    rightMouth?: { x: number; y: number };
  };
  /** Estimated age range */
  ageRange?: { low: number; high: number };
  /** Estimated gender */
  gender?: 'male' | 'female' | 'unknown';
}

/** Standard color names for clothing */
export type ClothingColor =
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'purple'
  | 'pink'
  | 'brown'
  | 'black'
  | 'white'
  | 'gray'
  | 'beige'
  | 'navy'
  | 'teal';

/** Clothing type categories */
export type ClothingType =
  | 'shirt'
  | 'jacket'
  | 'sweater'
  | 'tank-top'
  | 'dress'
  | 'pants'
  | 'shorts'
  | 'skirt'
  | 'hat'
  | 'cap'
  | 'sunglasses'
  | 'vest'
  | 'hoodie'
  | 'jersey'
  | 'unknown';

/** Detected clothing item */
export interface DetectedClothingItem {
  /** Type of clothing */
  type: ClothingType;
  /** Primary color */
  primaryColor: ClothingColor;
  /** Secondary color (if applicable) */
  secondaryColor?: ClothingColor;
  /** Detection confidence (0-1) */
  confidence: number;
  /** Bounding box of the clothing item */
  boundingBox?: BoundingBox;
}

/** Person-level clothing attributes */
export interface DetectedAttributes {
  /** Unique identifier for this person detection */
  personId: string;
  /** Bounding box of the entire person */
  boundingBox: BoundingBox;
  /** Associated face detection ID (if matched) */
  faceDetectionId?: string;
  /** Dominant colors detected on this person */
  dominantColors: ClothingColor[];
  /** Individual clothing items detected */
  clothingItems: DetectedClothingItem[];
  /** Text descriptors (e.g., "red jacket", "blue shorts") */
  descriptors: string[];
  /** Detection confidence (0-1) */
  confidence: number;
}

/** Detected text in image (for bib numbers) */
export interface DetectedText {
  /** The detected text content */
  text: string;
  /** Type classification */
  type: 'bib-number' | 'jersey-number' | 'generic-text';
  /** Bounding box of the text */
  boundingBox: BoundingBox;
  /** Detection confidence (0-1) */
  confidence: number;
  /** Associated person/face detection ID (if in proximity) */
  associatedPersonId?: string;
  /** Parent detected text (for multi-line) */
  parentId?: string;
}

/** Combined detection result for a photo */
export interface PhotoDetectionResult {
  /** Photo ID */
  photoId: string;
  /** All detected faces */
  faces: DetectedFace[];
  /** All detected persons with clothing attributes */
  persons: DetectedAttributes[];
  /** All detected text (bib numbers, etc.) */
  textDetections: DetectedText[];
  /** Processing metadata */
  metadata: {
    processingTimeMs: number;
    providerName: string;
    imageWidth: number;
    imageHeight: number;
  };
}

/** Error from vision provider */
export interface VisionProviderError {
  code: string;
  message: string;
  retryable: boolean;
}
