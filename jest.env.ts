/**
 * Environment setup for Jest tests
 * This file sets test-specific environment configurations
 * Note: .env.test.local is automatically loaded by Next.js Jest integration
 */

// Set test environment using Object.assign to avoid readonly restriction
Object.assign(process.env, { NODE_ENV: "test" });

// Verify that required environment variables are available
// (These should be loaded automatically from .env.test.local by Next.js)
const requiredEnvVars = [
    "POSTGRES_HOST",
    "POSTGRES_DB",
    "POSTGRES_USER",
    "POSTGRES_PASSWORD",
];

const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
    console.warn(
        "Warning: Missing required environment variables:",
        missingVars
    );
    console.warn(
        "Make sure .env.test.local exists and contains all required variables"
    );
} else {
    console.log("✅ All required environment variables loaded");
}

// Set test environment using Object.assign to avoid readonly restriction
Object.assign(process.env, { NODE_ENV: "test" });
