/* eslint-disable */
// Generated from docs/openapi.json

export interface ApiError {
  [key: string]: unknown;
}

export interface Eligibility {
  userId: number;
  eligible: boolean;
  streak: number;
  requiredStreak: number;
  restoreUsed: number;
  restoreRemaining: number;
  restoreLimit: number;
  missing: number;
  note: string;
}

export interface GlobalForecastResult {
  userId: number;
  forecastDate: string;
  probability: number;
  chancePercent: number;
  threshold: number;
  predictionBinary: number;
  predictionLabel: string;
  modelType: string;
}

export interface GlobalForecastPayload {
  forecast: GlobalForecastResult;
  eligibility: Eligibility;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  errors: ApiError[] | null;
  meta: Record<string, unknown> | null;
}
