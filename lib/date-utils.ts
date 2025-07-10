/**
 * Utility functions for date handling in note filtering
 */

/**
 * Converts relative date strings to ISO date strings
 * @param relativeDate - String like "last 14 days", "this week", "yesterday"
 * @returns ISO date string or null if not recognized
 */
export function parseRelativeDate(relativeDate: string): string | null {
    const now = new Date();
    const lower = relativeDate.toLowerCase().trim();

    // Handle "last X days"
    const daysMatch = lower.match(/last\s+(\d+)\s+days?/);
    if (daysMatch) {
        const days = parseInt(daysMatch[1]);
        const date = new Date(now);
        date.setDate(date.getDate() - days);
        date.setHours(0, 0, 0, 0);
        return date.toISOString();
    }

    // Handle "this week"
    if (lower.includes("this week")) {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        return startOfWeek.toISOString();
    }

    // Handle "last week"
    if (lower.includes("last week")) {
        const startOfLastWeek = new Date(now);
        startOfLastWeek.setDate(
            startOfLastWeek.getDate() - startOfLastWeek.getDay() - 7
        );
        startOfLastWeek.setHours(0, 0, 0, 0);
        return startOfLastWeek.toISOString();
    }

    // Handle "this month"
    if (lower.includes("this month")) {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return startOfMonth.toISOString();
    }

    // Handle "yesterday"
    if (lower.includes("yesterday")) {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        return yesterday.toISOString();
    }

    // Handle "today"
    if (lower.includes("today")) {
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        return today.toISOString();
    }

    return null;
}

/**
 * Formats a date range description for display
 * @param createdAfter - ISO date string
 * @param createdBefore - ISO date string
 * @returns Human-readable date range description
 */
export function formatDateRange(
    createdAfter?: string,
    createdBefore?: string
): string {
    if (!createdAfter && !createdBefore) {
        return "";
    }

    const formatDate = (isoString: string) => {
        return new Date(isoString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    if (createdAfter && createdBefore) {
        return `${formatDate(createdAfter)} - ${formatDate(createdBefore)}`;
    } else if (createdAfter) {
        return `after ${formatDate(createdAfter)}`;
    } else if (createdBefore) {
        return `before ${formatDate(createdBefore)}`;
    }

    return "";
}

/**
 * Common date filter presets
 */
export const datePresets = {
    today: () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today.toISOString();
    },

    yesterday: () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        return yesterday.toISOString();
    },

    thisWeek: () => {
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        return startOfWeek.toISOString();
    },

    lastWeek: () => {
        const startOfLastWeek = new Date();
        startOfLastWeek.setDate(
            startOfLastWeek.getDate() - startOfLastWeek.getDay() - 7
        );
        startOfLastWeek.setHours(0, 0, 0, 0);
        return startOfLastWeek.toISOString();
    },

    thisMonth: () => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return startOfMonth.toISOString();
    },

    lastNDays: (days: number) => {
        const date = new Date();
        date.setDate(date.getDate() - days);
        date.setHours(0, 0, 0, 0);
        return date.toISOString();
    },
};

/**
 * Parses a specific date like "June 29th" or "June 29" and returns ISO string
 * Always assumes current year unless year is specified
 * @param dateString - Date string like "June 29th", "June 29", "6/29", etc.
 * @returns Object with start and end of day in ISO format
 */
export function parseSpecificDate(
    dateString: string
): { start: string; end: string } | null {
    const now = new Date();
    const currentYear = now.getFullYear();
    const lower = dateString.toLowerCase().trim();

    // Handle month names (June 29th, June 29, june 29)
    const monthNameMatch = lower.match(/(\w+)\s+(\d+)(?:st|nd|rd|th)?/);
    if (monthNameMatch) {
        const monthName = monthNameMatch[1];
        const day = parseInt(monthNameMatch[2]);

        const monthMap: { [key: string]: number } = {
            january: 0,
            jan: 0,
            february: 1,
            feb: 1,
            march: 2,
            mar: 2,
            april: 3,
            apr: 3,
            may: 4,
            june: 5,
            jun: 5,
            july: 6,
            jul: 6,
            august: 7,
            aug: 7,
            september: 8,
            sep: 8,
            sept: 8,
            october: 9,
            oct: 9,
            november: 10,
            nov: 10,
            december: 11,
            dec: 11,
        };

        const month = monthMap[monthName];
        if (month !== undefined) {
            const startDate = new Date(currentYear, month, day, 0, 0, 0, 0);
            const endDate = new Date(currentYear, month, day + 1, 0, 0, 0, 0);

            return {
                start: startDate.toISOString(),
                end: endDate.toISOString(),
            };
        }
    }

    // Handle MM/DD format (6/29, 06/29)
    const slashMatch = lower.match(/(\d{1,2})\/(\d{1,2})/);
    if (slashMatch) {
        const month = parseInt(slashMatch[1]) - 1; // Month is 0-indexed
        const day = parseInt(slashMatch[2]);

        const startDate = new Date(currentYear, month, day, 0, 0, 0, 0);
        const endDate = new Date(currentYear, month, day + 1, 0, 0, 0, 0);

        return {
            start: startDate.toISOString(),
            end: endDate.toISOString(),
        };
    }

    return null;
}

/**
 * Enhanced relative date parser that accounts for current year
 * @param relativeDate - String like "last 14 days", "this week", "yesterday"
 * @returns Object with start date and optional end date
 */
export function parseEnhancedRelativeDate(
    relativeDate: string
): { start: string; end?: string } | null {
    const now = new Date();
    const lower = relativeDate.toLowerCase().trim();

    // Handle "last X days"
    const daysMatch = lower.match(/last\s+(\d+)\s+days?/);
    if (daysMatch) {
        const days = parseInt(daysMatch[1]);
        const startDate = new Date(now);
        startDate.setDate(startDate.getDate() - days);
        startDate.setHours(0, 0, 0, 0);
        return { start: startDate.toISOString() };
    }

    // Handle "this week" - start from Sunday of current week
    if (lower.includes("this week")) {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        return { start: startOfWeek.toISOString() };
    }

    // Handle "last week"
    if (lower.includes("last week")) {
        const startOfLastWeek = new Date(now);
        startOfLastWeek.setDate(
            startOfLastWeek.getDate() - startOfLastWeek.getDay() - 7
        );
        startOfLastWeek.setHours(0, 0, 0, 0);

        const endOfLastWeek = new Date(now);
        endOfLastWeek.setDate(endOfLastWeek.getDate() - endOfLastWeek.getDay());
        endOfLastWeek.setHours(0, 0, 0, 0);

        return {
            start: startOfLastWeek.toISOString(),
            end: endOfLastWeek.toISOString(),
        };
    }

    // Handle "yesterday"
    if (lower.includes("yesterday")) {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        const endOfYesterday = new Date(yesterday);
        endOfYesterday.setDate(endOfYesterday.getDate() + 1);

        return {
            start: yesterday.toISOString(),
            end: endOfYesterday.toISOString(),
        };
    }

    // Handle "today"
    if (lower.includes("today")) {
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);

        const endOfToday = new Date(today);
        endOfToday.setDate(endOfToday.getDate() + 1);

        return {
            start: today.toISOString(),
            end: endOfToday.toISOString(),
        };
    }

    return null;
}
