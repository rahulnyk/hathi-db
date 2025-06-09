import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { AuthButton } from "@/components/auth-button";
import { ReduxProvider } from "@/store/provider";
import clsx from "clsx";

const defaultUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

export const metadata: Metadata = {
    metadataBase: new URL(defaultUrl),
    title: "Next.js and Supabase Starter Kit",
    description: "The fastest way to build apps with Next.js and Supabase",
};

// const quickSand = Quicksand({
//     variable: "--font-quicksand",
//     display: "swap",
//     subsets: ["latin"],
// });
const lexend = Lexend({
    variable: "--font-lexend",
    display: "swap",
    subsets: ["latin"],
});

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${lexend.className} antialiased`}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <main className="min-h-screen flex">
                        <nav
                            className={clsx(
                                "h-screen fixed left-0 flex flex-col",
                                "backdrop-blur-xl bg-white/50 dark:bg-zinc-800/50",
                                "border-r border-foreground/10",
                                "w-12"
                            )}
                        >
                            <div className="flex flex-col gap-4 justify-center items-center pt-4">
                                <ThemeSwitcher />
                                <AuthButton />
                            </div>
                        </nav>
                        <div className="flex-1 p-5 bg-zinc-50 dark:bg-zinc-900">
                            <ReduxProvider>{children}</ReduxProvider>
                        </div>
                    </main>
                </ThemeProvider>
            </body>
        </html>
    );
}
