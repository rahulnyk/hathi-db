// Simple test utility to trigger errors for testing the error boundary
export function triggerChatError() {
    // This can be used in development to test the error boundary
    throw new Error("Test error from chat component");
}

export function simulateAsyncError() {
    return new Promise((_, reject) => {
        setTimeout(() => {
            reject(new Error("Simulated async error"));
        }, 1000);
    });
}
