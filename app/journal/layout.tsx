import { Nav } from "@/components/nav";

export default function JournalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <Nav />
            <div className="flex-1 bg-zinc-50 dark:bg-zinc-900 ml-12 mr-0">
                {children}
            </div>
        </>
    );
}
