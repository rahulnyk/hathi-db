/**
 * Shared context definition rules used across AI prompts
 * Ensures consistency between context suggestion and note structurization
 */

/**
 * Common definition of what qualifies as a valid context
 * Used by both suggest-context and structurize prompts
 */
export const CONTEXT_DEFINITION = `Valid Contexts = Knowledge Graph Nodes:
- Concrete entities (People, Places, Projects)
- Specific topics/subjects (React, Psychology, Finance)
- Distinct categories (Work, Journal, Ideas)

INVALID Contexts (Modifiers/Actions):
- Adjectives (Important, Good, Valuable)
- Verbs (Learning, Doing, Meeting)
- Abstract/Vague (Thoughts, Updates, Miscellaneous)`;

/**
 * Common format rules for contexts
 * Used by both suggest-context and structurize prompts
 */
export const CONTEXT_FORMAT_RULES = `Format: Title Case with spaces ([[Meaning of Life]]). No hyphens/lowercase ([[meaning-of-life]] ❌).`;

/**
 * Common examples of correct context usage in structured notes
 */
export const CONTEXT_USAGE_EXAMPLES = `**Examples of correct context usage:**
- "Working on [[Project Alpha]] deadline" ✅
- "Meeting with [[Sarah]] about [[Q4 Planning]]" ✅
- "Learning [[TypeScript]] for the new feature" ✅
- "Exploring the [[Meaning of Life]] and its implications" ✅
- "The meaning of life is about significance and purpose" ✅ (no contexts - these are just descriptive words)`;

/**
 * Examples for suggest-context AI responses
 * Shows correct Title Case format for JSON array responses
 */
export const CONTEXT_EXAMPLES = `Examples:
["Work", "Project Alpha", "Meeting Notes"]
["Sarah", "Q4 Planning"]

Incorrect:
["valuable", "learning"] (not concrete)
["project-alpha"] (use Title Case)`;
