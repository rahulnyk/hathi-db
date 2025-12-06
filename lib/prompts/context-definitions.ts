/**
 * Shared context definition rules used across AI prompts
 * Ensures consistency between context suggestion and note structurization
 */

/**
 * Common definition of what qualifies as a valid context
 * Used by both suggest-context and structurize prompts
 */
export const CONTEXT_DEFINITION = `**What qualifies as a context:**
Contexts represent significant nodes in the user's knowledge graph—concrete, identifiable entities or concepts.

✅ VALID CONTEXTS:
- Proper nouns (people, places, projects, products): [[Sarah]], [[Tokyo]], [[Project Alpha]]
- Specific concepts or topics: [[Machine Learning]], [[Marketing Strategy]], [[Meditation]]
- Named entities or frameworks: [[React]], [[Agile]], [[Python]]
- Specific areas of work or life: [[Career]], [[Health]], [[Fitness]], [[Finance]]
- Concrete subjects that could be nodes in a knowledge graph: [[Meeting Notes]], [[Book Reviews]]

❌ INVALID CONTEXTS (do NOT suggest):
- Adjectives: valuable, important, interesting, significant
- Verbs: learning, understanding, implementing, working
- Abstract modifiers: significance, interpretation, worthwhile, intelligible
- Generic descriptive words: idea, thought, reflection, update`;

/**
 * Common format rules for contexts
 * Used by both suggest-context and structurize prompts
 */
export const CONTEXT_FORMAT_RULES = `**Context Format Requirements:**
- ALWAYS use Title Case with spaces: [[Meaning of Life]] ✅
- NEVER use hyphens or lowercase: [[meaning-of-life]] ❌
- Use proper capitalization for proper nouns: [[Sarah]], [[TypeScript]] ✅`;

/**
 * Common examples of correct context usage
 */
export const CONTEXT_EXAMPLES = `**Examples of correct context usage:**
- "Working on [[Project Alpha]] deadline" ✅
- "Meeting with [[Sarah]] about [[Q4 Planning]]" ✅
- "Learning [[TypeScript]] for the new feature" ✅
- "Exploring the [[Meaning Of Life]] and its implications" ✅
- "The meaning of life is about significance and purpose" ✅ (no contexts - these are just descriptive words)`;
