import "@testing-library/jest-dom";

// Suppress console output during tests for cleaner output
const originalConsole = global.console;
global.console = {
    ...originalConsole,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
};
