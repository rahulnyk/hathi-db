"use client"; // Ensure this can be used in client components

import { useEffect } from "react";

const VhProperties = "--dynamic-vh"; // CSS custom property name, can be anything

export function useViewportHeight() {
    useEffect(() => {
        const setVh = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty(VhProperties, `${vh}px`);
        };

        setVh(); // Set on initial load

        // Debounce function to limit the rate of execution
        const debounce = (func: () => void, delay: number) => {
            let timeoutId: number; // Using number for timeoutId
            return (...args: any[]) => {
                window.clearTimeout(timeoutId); // Using window.clearTimeout
                timeoutId = window.setTimeout(() => func(), delay); // Using window.setTimeout
            };
        };

        const debouncedSetVh = debounce(setVh, 150); // Debounce with 150ms delay

        window.addEventListener("resize", debouncedSetVh);
        window.addEventListener("orientationchange", debouncedSetVh);

        return () => {
            window.removeEventListener("resize", debouncedSetVh);
            window.removeEventListener("orientationchange", debouncedSetVh);
        };
    }, []);
}
