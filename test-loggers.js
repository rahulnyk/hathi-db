// Quick test to verify environment variables are read correctly

console.log("Environment:", process.env.NODE_ENV);
console.log("LOG_CHAT_TO_CSV:", process.env.LOG_CHAT_TO_CSV);
console.log("LOG_CHAT_TO_CONSOLE:", process.env.LOG_CHAT_TO_CONSOLE);

// Test the helper functions
function shouldLog(isError = false) {
    if (process.env.NODE_ENV === "production") {
        return isError;
    }
    return process.env.NODE_ENV === "development";
}

function shouldLogToConsole() {
    return process.env.LOG_CHAT_TO_CONSOLE === "true";
}

function shouldLogToCsv() {
    return process.env.LOG_CHAT_TO_CSV === "true";
}

console.log("shouldLog(false):", shouldLog(false));
console.log("shouldLog(true):", shouldLog(true));
console.log("shouldLogToConsole():", shouldLogToConsole());
console.log("shouldLogToCsv():", shouldLogToCsv());
