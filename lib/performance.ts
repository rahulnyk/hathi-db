import fs from "fs";
import path from "path";

const logFilePath = path.join(process.cwd(), "performance_log.csv");

async function writeToCsv(data: { [key: string]: string | number }) {
    const headers = Object.keys(data);
    const row = headers.map((header) => data[header]).join(",") + "\n";

    try {
        if (!fs.existsSync(logFilePath)) {
            fs.writeFileSync(logFilePath, headers.join(",") + "\n");
        }
        fs.appendFileSync(logFilePath, row);
    } catch (error) {
        console.error("Failed to write performance log to CSV:", error);
    }
}

export async function measureExecutionTime<T>(
    functionName: string,
    fn: () => Promise<T>
): Promise<T> {
    if (process.env.NODE_ENV !== "development") {
        return fn();
    }

    const start = performance.now();
    try {
        const result = await fn();
        const end = performance.now();
        const duration = parseFloat((end - start).toFixed(2));

        console.log(`[PERF] ${functionName} took ${duration} ms`);

        if (process.env.LOG_PERF_TO_CSV === "true") {
            await writeToCsv({
                timestamp: new Date().toISOString(),
                functionName,
                duration_ms: duration,
                status: "success",
            });
        }

        return result;
    } catch (error) {
        const end = performance.now();
        const duration = parseFloat((end - start).toFixed(2));

        console.error(
            `[PERF] ${functionName} FAILED after ${duration} ms`,
            error
        );

        if (process.env.LOG_PERF_TO_CSV === "true") {
            await writeToCsv({
                timestamp: new Date().toISOString(),
                functionName,
                duration_ms: duration,
                status: "failure",
            });
        }

        throw error;
    }
}
