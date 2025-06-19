import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { ReduxProvider } from "@/store/provider";
import { DeviceTypeDetector } from "@/components/device_type_detector";

const defaultUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

export const metadata: Metadata = {
    metadataBase: new URL(defaultUrl),
    title: "Next.js and Supabase Starter Kit",
    description: "The fastest way to build apps with Next.js and Supabase",
};

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
                    defaultTheme="dark"
                    enableSystem
                    disableTransitionOnChange
                >
                    <main className="min-h-screen flex">
                        <ReduxProvider>
                            <DeviceTypeDetector />
                            {children}
                        </ReduxProvider>
                    </main>
                </ThemeProvider>
            </body>
        </html>
    );
}
