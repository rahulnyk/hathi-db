import { AIProvider } from "./types";
import { OpenAIProvider } from "./openai";

// Export the AI provider interface and types
export * from "./types";

// Create and export the default AI provider
// This can be easily changed to use a different provider
export const aiProvider: AIProvider = new OpenAIProvider();

// Export provider classes for direct use if needed
