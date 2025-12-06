import { sentenceCaseToSlug } from "../../lib/utils";

describe("sentenceCaseToSlug", () => {
    // Suppress console.warn for tests
    let consoleWarnSpy: jest.SpyInstance;

    beforeEach(() => {
        consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
    });

    afterEach(() => {
        consoleWarnSpy.mockRestore();
    });

    describe("Sentence Case to slug conversion", () => {
        it("should convert simple Title Case to slug", () => {
            expect(sentenceCaseToSlug("Project Alpha")).toBe("project-alpha");
        });

        it("should convert multi-word Title Case to slug", () => {
            expect(sentenceCaseToSlug("Machine Learning")).toBe(
                "machine-learning"
            );
        });

        it("should convert Title Case with articles to slug", () => {
            expect(sentenceCaseToSlug("The Meaning Of Life")).toBe(
                "the-meaning-of-life"
            );
        });

        it("should handle proper nouns", () => {
            expect(sentenceCaseToSlug("Sarah")).toBe("sarah");
            expect(sentenceCaseToSlug("TypeScript")).toBe("typescript");
        });

        it("should handle multiple spaces", () => {
            expect(sentenceCaseToSlug("Project   Alpha   Planning")).toBe(
                "project-alpha-planning"
            );
        });

        it("should trim leading and trailing spaces", () => {
            expect(sentenceCaseToSlug("  Project Alpha  ")).toBe(
                "project-alpha"
            );
        });
    });

    describe("Special characters handling", () => {
        it("should remove special characters", () => {
            expect(sentenceCaseToSlug("Project Alpha (2024)")).toBe(
                "project-alpha-2024"
            );
            expect(sentenceCaseToSlug("Q4 Planning!")).toBe("q4-planning");
        });

        it("should handle existing hyphens", () => {
            expect(sentenceCaseToSlug("Full-Stack Development")).toBe(
                "full-stack-development"
            );
        });
    });

    describe("Edge cases", () => {
        it("should handle empty string", () => {
            expect(sentenceCaseToSlug("")).toBe("");
        });

        it("should handle single word", () => {
            expect(sentenceCaseToSlug("Work")).toBe("work");
        });

        it("should handle numbers", () => {
            expect(sentenceCaseToSlug("Q4 2024")).toBe("q4-2024");
        });
    });

    describe("Already slugified input detection", () => {
        it("should warn when input is already in slug format", () => {
            const result = sentenceCaseToSlug("project-alpha");

            expect(result).toBe("project-alpha");

            // In non-production, should warn
            if (process.env.NODE_ENV !== "production") {
                expect(consoleWarnSpy).toHaveBeenCalledWith(
                    expect.stringContaining(
                        '[sentenceCaseToSlug] Input "project-alpha" appears to already be in slug format'
                    )
                );
            }
        });

        it("should warn for multi-word slugs", () => {
            const result = sentenceCaseToSlug("machine-learning");

            expect(result).toBe("machine-learning");

            if (process.env.NODE_ENV !== "production") {
                expect(consoleWarnSpy).toHaveBeenCalled();
            }
        });

        it("should not warn for Title Case input", () => {
            sentenceCaseToSlug("Project Alpha");

            expect(consoleWarnSpy).not.toHaveBeenCalled();
        });

        it("should not warn for mixed case with spaces", () => {
            sentenceCaseToSlug("Machine Learning");

            expect(consoleWarnSpy).not.toHaveBeenCalled();
        });

        it("should warn for single word lowercase", () => {
            const result = sentenceCaseToSlug("work");

            expect(result).toBe("work");

            if (process.env.NODE_ENV !== "production") {
                expect(consoleWarnSpy).toHaveBeenCalled();
            }
        });
    });

    describe("AI context format expectations", () => {
        it("should correctly convert AI-returned Title Case contexts", () => {
            // These are examples of what AI should return after the changes
            const aiResponses = [
                "Work",
                "Project Alpha",
                "Meeting Notes",
                "Machine Learning",
                "Q4 Planning",
                "Sarah",
            ];

            const expectedSlugs = [
                "work",
                "project-alpha",
                "meeting-notes",
                "machine-learning",
                "q4-planning",
                "sarah",
            ];

            aiResponses.forEach((response, index) => {
                expect(sentenceCaseToSlug(response)).toBe(expectedSlugs[index]);
            });
        });

        it("should handle contexts from structured notes", () => {
            // When AI structures notes, it wraps contexts like [[Project Alpha]]
            // The extraction regex removes the brackets and passes the inner text
            const extractedContexts = [
                "Project Alpha",
                "TypeScript",
                "Meaning Of Life",
            ];

            const expectedSlugs = [
                "project-alpha",
                "typescript",
                "meaning-of-life",
            ];

            extractedContexts.forEach((context, index) => {
                expect(sentenceCaseToSlug(context)).toBe(expectedSlugs[index]);
            });
        });
    });
});
