import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { setTodayContext } from "@/store/uiSlice";
import { dateToSlug } from "@/lib/utils";
import { useContextNavigation } from "@/lib/context-navigation";

/**
 * Hook to track the current date and update the "today" context when it changes.
 * This is useful for keeping the "Today" button and other date-dependent UI elements up to date
 * even if the app is left open for multiple days.
 */
export function useTodayTracker() {
    const dispatch = useAppDispatch();
    const { navigateToContext } = useContextNavigation();
    const todayContext = useAppSelector((state) => state.ui.todayContext);

    useEffect(() => {
        const checkDate = (shouldRedirect: boolean) => {
            const currentTodaySlug = dateToSlug(new Date());

            // If the stored "today" context is different from the actual current date
            if (todayContext !== currentTodaySlug) {
                // Update the store so the "Today" button appears if needed
                dispatch(setTodayContext(currentTodaySlug));

                // Only redirect if explicitly requested (e.g., user returning to app)
                if (shouldRedirect) {
                    navigateToContext(currentTodaySlug);
                }
            }
        };

        // Check immediately on mount (redirect if needed to ensure we start on right day)
        checkDate(true);

        // Check when the window gains focus (user comes back to the tab/app)
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                // User is returning, so we SHOULD redirect them to the new today
                checkDate(true);
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("focus", handleVisibilityChange);

        // Periodic check (every minute)
        // We do NOT redirect here, just update the state so the "Today" button appears
        // This prevents abrupt disruption while the user is actively working
        const intervalId = setInterval(() => checkDate(false), 60 * 1000);

        return () => {
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange
            );
            window.removeEventListener("focus", handleVisibilityChange);
            clearInterval(intervalId);
        };
    }, [dispatch, todayContext, navigateToContext]);
}
