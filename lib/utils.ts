import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// This check can be removed, it is just for tutorial purposes
export const hasEnvVars =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Converts a Date object to a slug string in the format "DD-Month-YYYY".
 * Example: new Date(2025, 5, 10) -> "10-june-2025"
 * @param date The Date object to convert.
 * @returns A string representing the date in "DD-Month-YYYY" format.
 */
export function dateToSlug(date: Date): string {
    const day = date.getDate();
    const month = date.toLocaleString("en-US", { month: "long" }).toLowerCase();
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

/**
 * Converts a slug string in "DD-Month-YYYY" format back to a Date object.
 * Example: "10-june-2025" -> Date object for June 10, 2025
 * @param slug The date slug string.
 * @returns A Date object, or null if the slug is invalid.
 */
export function slugToDate(slug: string): Date | null {
    const parts = slug.split("-");
    if (parts.length !== 3) {
        return null;
    }

    const day = parseInt(parts[0], 10);
    const monthName = parts[1].toLowerCase();
    const year = parseInt(parts[2], 10);

    if (isNaN(day) || isNaN(year)) {
        return null;
    }

    // Convert month name to month index (0-11)
    const monthNames = [
        "january",
        "february",
        "march",
        "april",
        "may",
        "june",
        "july",
        "august",
        "september",
        "october",
        "november",
        "december",
    ];
    const monthIndex = monthNames.indexOf(monthName);

    if (monthIndex === -1) {
        return null;
    }

    const date = new Date(year, monthIndex, day);

    // Validate if the created date matches the input parts (e.g., for invalid dates like 31-february-2025)
    if (
        date.getFullYear() !== year ||
        date.getMonth() !== monthIndex ||
        date.getDate() !== day
    ) {
        return null;
    }

    return date;
}
