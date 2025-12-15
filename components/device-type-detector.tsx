"use client";
import { useEffect } from "react";
import { useAppDispatch } from "@/store";
import { setDeviceType, setIsMenuOpen } from "@/store/uiSlice";

export function DeviceTypeDetector() {
    const dispatch = useAppDispatch();

    useEffect(() => {
        const handleResize = () => {
            const userAgent = navigator.userAgent;
            if (/Mobi/i.test(userAgent)) {
                dispatch(setDeviceType("mobile"));
            } else if (/Tablet/i.test(userAgent) || /iPad/i.test(userAgent)) {
                dispatch(setDeviceType("tablet"));
            } else {
                dispatch(setDeviceType("desktop"));
            }
            // Close menu on resize
            dispatch(setIsMenuOpen(false));
        };

        // Initial check
        handleResize();

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [dispatch]);

    return null;
}
