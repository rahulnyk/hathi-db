import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({
    // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
    dir: "./",
});

// Add any custom config to be passed to Jest
const config: Config = {
    coverageProvider: "v8",
    testEnvironment: "node", // Use node environment for database tests
    // Add more setup options before each test is run
    setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
    // Test files pattern
    testMatch: [
        "<rootDir>/__tests__/**/*.(test|spec).(js|jsx|ts|tsx)",
        "<rootDir>/tests/**/*.(test|spec).(js|jsx|ts|tsx)",
    ],
    // Module name mapping for absolute imports
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/$1",
    },
    // Coverage settings
    collectCoverageFrom: [
        "app/**/*.{js,jsx,ts,tsx}",
        "lib/**/*.{js,jsx,ts,tsx}",
        "db/**/*.{js,jsx,ts,tsx}",
        "!**/*.d.ts",
        "!**/node_modules/**",
    ],
    // Test environment setup for database tests
    setupFiles: ["<rootDir>/jest.env.ts"],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config);
