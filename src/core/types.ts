export interface CharRange {
  line: number;
  startChar: number;
  endChar: number;
}

export interface DetectionResult {
  ranges: CharRange[];
}

export type GremlinLevel = "error" | "warning" | "info";

export interface GremlinCharConfig {
  codePoint: string;
  description: string;
  level: GremlinLevel;
  zeroWidth?: boolean;
  replacement?: string;
}

export interface GremlinDetection {
  range: CharRange;
  config: GremlinCharConfig;
}

export interface GremlinDetectionResult {
  detections: GremlinDetection[];
  affectedLines: Set<number>;
}
