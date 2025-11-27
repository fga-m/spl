export interface SplDataPoint {
  timestamp: string; // HH:MM:SS format
  seconds: number; // Normalized time in seconds for charting
  value: number; // dB value
  fullDate?: string; // If available
}

export type SafetyLevel = 'Safe' | 'Moderate' | 'High Risk';

export interface AnalysisStats {
  averageSpl: number;
  maxSpl: number;
  minSpl: number;
  maxSplBefore10am: SplDataPoint | null;
  top3Loudest: SplDataPoint[];
  totalSamples: number;
  durationString: string;
  safetyLevel: SafetyLevel;
}

export interface AiInsight {
  eventName: string;
  eventDate: string;
  summary: string;
  complianceNote: string;
}

export interface ParsedLog {
  fileName: string;
  eventName: string;
  eventDate: string;
  data: SplDataPoint[];
  stats: AnalysisStats;
}

export enum AppState {
  IDLE,
  ANALYZING,
  COMPLETE,
  ERROR
}