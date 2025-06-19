"use client";
import { useEffect } from "react";
import { useAppDispatch } from "@/store";
import { setDeviceType } from "@/store/uiSlice";

export function DeviceTypeDetector() {
    const dispatch = useAppDispatch();

    useEffect(() => {
        const userAgent = navigator.userAgent;
        if (/Mobi/i.test(userAgent)) {
            dispatch(setDeviceType("mobile"));
        } else if (/Tablet/i.test(userAgent) || /iPad/i.test(userAgent)) {
            dispatch(setDeviceType("tablet"));
        } else {
            dispatch(setDeviceType("desktop"));
        }
    }, [dispatch]);

    return null;
}
