import nextJest from "next/jest.js";

const createJestConfig = nextJest({
    // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
    dir: "./",
});

// Add any custom config to be passed to Jest
/** @type {import('jest').Config} */
const config = {
    coverageProvider: "v8",
    testEnvironment: "node", // Use node environment for server-side tests
    // Add more setup options before each test is run
    setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
    collectCoverageFrom: [
        "app/agent_tools/**/*.ts",
        "!app/agent_tools/**/*.d.ts",
    ],
    testMatch: ["<rootDir>/tests/**/*.test.ts", "<rootDir>/tests/**/*.spec.ts"],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config);
