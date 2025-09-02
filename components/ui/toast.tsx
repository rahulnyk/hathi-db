"use client";

import { toast as reactToast, ToastContainer, ToastOptions } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Toast types for our app
export interface ToastProps {
    message: string;
    type?: "error" | "success" | "warning" | "info";
    duration?: number;
}

// Custom toast function with our app's styling
export const toast = {
    error: (message: string, options?: ToastOptions) => {
        return reactToast.error(message, {
            position: "top-right",
            autoClose: 8000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            ...options,
        });
    },
    success: (message: string, options?: ToastOptions) => {
        return reactToast.success(message, {
            position: "top-right", 
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            ...options,
        });
    },
    warning: (message: string, options?: ToastOptions) => {
        return reactToast.warning(message, {
            position: "top-right",
            autoClose: 6000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            ...options,
        });
    },
    info: (message: string, options?: ToastOptions) => {
        return reactToast.info(message, {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            ...options,
        });
    },
};

// Custom hook for backward compatibility
export const useToast = () => {
    return {
        addToast: ({ message, type = "info", duration }: ToastProps) => {
            const options: ToastOptions = {};
            if (duration) {
                options.autoClose = duration;
            }
            
            switch (type) {
                case "error":
                    return toast.error(message, options);
                case "success":
                    return toast.success(message, options);
                case "warning":
                    return toast.warning(message, options);
                case "info":
                default:
                    return toast.info(message, options);
            }
        },
    };
};

// Toast Provider component using react-toastify
export function ToastProvider({ children }: { children: React.ReactNode }) {
    return (
        <>
            {children}
            <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
                className="toast-container"
            />
        </>
    );
}

// Export the react-toastify toast for direct usage
export { reactToast as toastify };
