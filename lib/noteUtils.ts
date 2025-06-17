import { sentenceCaseToSlug } from "./utils";

/**
 * Extracts context slugs from note content.
 */
export function extractContexts(content: string): string[] {
    const contextRegex = /\[\[([^\]]+)\]\]/g;
    const contexts: string[] = [];
    let match;
    while ((match = contextRegex.exec(content)) !== null) {
        const context = match[1].trim();
        if (context) {
            contexts.push(sentenceCaseToSlug(context));
        }
    }
    return Array.from(new Set(contexts));
}

/**
 * Extracts hashtags from note content.
 */
export function extractHashtags(content: string): string[] {
    const hashtagRegex = /#(\w+)/g;
    const tags: string[] = [];
    let match;
    while ((match = hashtagRegex.exec(content)) !== null) {
        const tag = match[1].trim();
        if (tag) {
            tags.push(tag.toLowerCase());
        }
    }
    return Array.from(new Set(tags));
}

/**
 * Extracts both contexts and tags from note content.
 */
export function extractMetadata(content: string): {
    contexts: string[];
    tags: string[];
} {
    return {
        contexts: extractContexts(content),
        tags: extractHashtags(content),
    };
}
