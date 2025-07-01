/**
 * Prompts for optimized embeddings
 *
 * These prompts help create better embeddings for semantic search by
 * optimizing documents for retrieval and queries for finding relevant documents.
 */

/**
 * Prompt for embedding documents (notes) - optimizes them for being retrieved
 * This helps the document embeddings capture the key information that would
 * make them relevant to future queries.
 */
export function documentEmbeddingPrompt(
    content: string,
    contexts?: string[],
    tags?: string[],
    noteType?: string
): string {
    const contextText = contexts && contexts.length > 0 ? `\nContexts: ${contexts.join(", ")}` : "";
    const tagsText = tags && tags.length > 0 ? `\nTags: ${tags.join(", ")}` : "";
    const typeText = noteType ? `\nType: ${noteType}` : "";

    return `Document for retrieval:
Content: ${content}${contextText}${tagsText}${typeText}

This is a document that should be retrieved when users ask questions about: ${content}${contextText}${tagsText}${typeText}`;
}

/**
 * Prompt for embedding queries (questions) - optimizes them for finding relevant documents
 * This helps the query embeddings capture the intent and key concepts that
 * would match relevant documents.
 */
export function queryEmbeddingPrompt(question: string): string {
    return `Query for finding relevant documents:
Question: ${question}

This query is looking for documents that contain information about: ${question}`;
}