"use client"; // Must be a client component to use state

import { Menu } from "@/components/menu";
import { cn } from "@/lib/utils";
import { useViewportHeight } from "@/hooks/use_viewport_height";
import { useAppSelector, useAppDispatch } from "@/store";
import { setIsMenuOpen } from "@/store/uiSlice";
import { ChatProvider } from "@/lib/chat-context";

export default function JournalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const dispatch = useAppDispatch();
    const isMenuOpen = useAppSelector((state) => state.ui.isMenuOpen);
    useViewportHeight(); // Call the hook

    return (
        <ChatProvider>
            <Menu
                isOpen={isMenuOpen}
                onClose={() => dispatch(setIsMenuOpen(false))}
            />

            <main
                className={cn(
                    "flex-1 transition-all duration-300 ease-in-out",
                    {
                        "lg:mr-[40vw]": isMenuOpen, // Apply 40% viewport width margin on lg screens when menu is open
                    }
                )}
            >
                {children}
            </main>
        </ChatProvider>
    );
}
