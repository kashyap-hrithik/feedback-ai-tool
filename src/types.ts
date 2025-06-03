// src/types.ts
export interface HighlightRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type FeedbackCategory = "feedback" | "feature_request";

export interface AIFeedback {
  summary: string;
  suggested_fix: string;
}
