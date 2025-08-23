import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

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

export function slugToSentenceCase(slug: string): string {
    if (!slug) return "";
    return slug
        .split("-")
        .map(
            (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(" ");
}

export function sentenceCaseToSlug(sentence: string): string {
    if (!sentence) return "";
    return sentence
        .trim() // Remove leading and trailing spaces
        .toLowerCase()
        .replace(/\s+/g, "-") // Replace spaces with hyphens
        .replace(/[^\w-]+/g, ""); // Remove non-alphanumeric characters except hyphens
}
/**
 * Checks if two arrays are equal.
 * @param a The first array.
 * @param b The second array.
 * @returns True if the arrays are equal, false otherwise.
 */
export function areArraysEqual<T>(a: T[], b: T[]): boolean {
    if (a === b) return true;
    if (a.length !== b.length) return false;

    for (let i = 0; i < a.length; i++) {
        if (!deepEqual(a[i], b[i])) {
            return false;
        }
    }

    return true;
}

/**
 * Checks if two objects are equal.
 * @param a The first object.
 * @param b The second object.
 * @returns True if the objects are equal, false otherwise.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function deepEqual(a: any, b: any): boolean {
    if (a === b) return true;

    if (typeof a !== typeof b) return false;

    if (a && b && typeof a === "object") {
        if (Array.isArray(a)) {
            if (!Array.isArray(b) || a.length !== b.length) return false;
            for (let i = 0; i < a.length; i++) {
                if (!deepEqual(a[i], b[i])) return false;
            }
            return true;
        }

        const aKeys = Object.keys(a);
        const bKeys = Object.keys(b);
        if (aKeys.length !== bKeys.length) return false;

        for (const key of aKeys) {
            if (!b.hasOwnProperty(key) || !deepEqual(a[key], b[key]))
                return false;
        }

        return true;
    }

    return false;
}
