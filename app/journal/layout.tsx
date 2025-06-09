import { MobileNavManager } from "@/components/mobile-nav-manager";
import { Nav } from "@/components/nav";

export default function JournalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <MobileNavManager>
                <Nav />
            </MobileNavManager>
            <div className="flex-1 bg-zinc-50 dark:bg-zinc-900 ml-0 md:ml-64"> {/* Adjusted margin */}
                {children}
            </div>
        </>
    );
}
