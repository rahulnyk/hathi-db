"use client";
import { User } from "@supabase/supabase-js";
import { useState } from "react";
import { Notes } from "@/components/journal/notes";
import clsx from "clsx";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
export function JournalComponent({ user }: { user: User }) {
    const [isRightColumnVisible, setIsRightColumnVisible] = useState(false);
    return (
        <div className="flex flex-row w-full min-h-screen">
            <div
                className={clsx(
                    "flex flex-col gap-12 p-6 w-2/3 transition-[margin] duration-300 ease-in-out ml-auto mr-auto"
                    // isRightColumnVisible ? "" : "ml-auto mr-auto"
                )}
            >
                <Notes user={user} />
            </div>
            <div
                className={clsx(
                    "flex flex-col gap-12 fixed right-0 top-0 pt-4",
                    "min-h-screen bg-zinc-100/50 dark:bg-zinc-800/50 transition-transform duration-300 p-6 w-1/3 transform",
                    "border-l border-foreground/10 backdrop-blur-lg",
                    isRightColumnVisible
                        ? "translate-x-0"
                        : "translate-x-[calc(100%-2rem)]"
                )}
            >
                <button
                    onClick={() =>
                        setIsRightColumnVisible(!isRightColumnVisible)
                    }
                    className="absolute left-0 top-5 p-1 rounded-r-lg transition-all duration-200 bg-transparent"
                >
                    {isRightColumnVisible ? (
                        <ChevronRightIcon className="h-5 w-5 text-gray-700 dark:text-gray-200" />
                    ) : (
                        <ChevronLeftIcon className="h-5 w-5 text-gray-700 dark:text-gray-200" />
                    )}
                </button>
                <div className="text-gray-700 dark:text-gray-300 mt-10 px-10">
                    <h2 className="text-xl font-semibold mb-4">Journal</h2>
                    <p className="text-sm">
                        This is your personal journal. You can write notes,
                        thoughts, or anything you want to remember.
                    </p>
                </div>
            </div>
        </div>
    );
}
