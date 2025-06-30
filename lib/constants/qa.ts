/**
 * Constants for Q&A functionality
 */

// Single configurable limit for all search operations
export const DEFAULT_SEARCH_LIMIT = 15;

// Other Q&A configuration
export const QA_SEARCH_LIMITS = {
  // Maximum notes to fetch from database for initial data retrieval
  MAX_USER_NOTES: 50,
  
  // Similarity thresholds for semantic search
  HIGH_SIMILARITY_THRESHOLD: 0.7,
  LOW_SIMILARITY_THRESHOLD: 0.5,
} as const;
