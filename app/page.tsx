import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    ArrowRight,
    Brain,
    FileText,
    CheckSquare,
    Folder,
    Sparkles,
} from "lucide-react";
import { HathiIcon } from "@/components/icon";

export default function Home() {
    return (
        <div className="flex flex-col min-h-screen w-full mx-auto">
            {/* Hero Section */}
            <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-16 md:py-24 w-full">
                <div className="max-w-7xl w-full mx-auto">
                    <div className="flex items-center justify-center mb-6 gap-4">
                        <HathiIcon className="h-14 w-14 text-primary mr-2" />
                        <h1 className="text-4xl md:text-5xl text-bold">
                            Hathi
                        </h1>
                    </div>

                    <h2 className="text-2xl md:text-3xl font-bold mb-6">
                        Your AI-Powered Second Brain
                    </h2>

                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
                        Seamlessly manage your notes, files, todos, and contexts
                        across your personal and professional life.
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
                        <Button asChild size="lg" className="gap-2">
                            <Link href="/auth/sign-up">
                                Get Started <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="lg">
                            <Link href="/auth/login">Sign In</Link>
                        </Button>
                    </div>

                    {/* Features highlight */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full max-w-5xl mx-auto">
                        <FeatureCard
                            icon={<FileText className="h-8 w-8 text-primary" />}
                            title="Smart Notes"
                            description="Create, organize and connect your thoughts with AI-powered insights."
                        />
                        <FeatureCard
                            icon={
                                <CheckSquare className="h-8 w-8 text-primary" />
                            }
                            title="Task Management"
                            description="Track todos and priorities with context-aware reminders."
                        />
                        <FeatureCard
                            icon={<Folder className="h-8 w-8 text-primary" />}
                            title="Knowledge Hub"
                            description="Store and retrieve documents, files, and resources effortlessly."
                        />
                        <FeatureCard
                            icon={<Sparkles className="h-8 w-8 text-primary" />}
                            title="AI Assistant"
                            description="Get intelligent suggestions and connections across your content."
                        />
                    </div>
                </div>
            </section>

            {/* Secondary section with image */}
            <section className="bg-muted/50 py-16 px-4 w-full">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-3xl font-bold mb-6">
                                Organize Your Thoughts, Amplify Your Ideas
                            </h2>
                            <p className="text-lg text-muted-foreground mb-6">
                                Hathi learns how you think and adapts to your
                                workflow, helping you capture ideas, manage
                                information, and make connections you might have
                                missed.
                            </p>
                            <ul className="space-y-3">
                                {[
                                    "Capture thoughts in markdown with AI-enhanced organization",
                                    "Connect ideas across contexts automatically",
                                    "Find exactly what you need with powerful search",
                                    "Integrate with your existing workflow",
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start">
                                        <div className="mr-2 mt-1 bg-primary/10 rounded-full p-1">
                                            <CheckSquare className="h-4 w-4 text-primary" />
                                        </div>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                            <Button asChild className="mt-8">
                                <Link href="/auth/sign-up">
                                    Start Your Second Brain
                                </Link>
                            </Button>
                        </div>
                        <div className="rounded-lg overflow-hidden shadow-xl bg-background">
                            {/* Placeholder for app screenshot - replace with your actual app screenshot */}
                            <div className="aspect-video bg-gradient-to-br from-primary/5 to-primary/30 w-full h-full flex items-center justify-center">
                                <p className="text-center text-muted-foreground">
                                    App interface visualization
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials or additional section */}
            <section className="py-16 px-4 w-full">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl font-bold mb-12">
                        Your Knowledge, Enhanced
                    </h2>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Button asChild size="lg" className="gap-2">
                            <Link href="/auth/sign-up">
                                Get Started For Free{" "}
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="lg">
                            <Link href="/auth/login">Sign In</Link>
                        </Button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-muted py-8 px-4 w-full">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
                    <div className="flex items-center mb-4 md:mb-0">
                        <Brain className="h-6 w-6 text-primary mr-2" />
                        <span className="font-bold">Hathi</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        © {new Date().getFullYear()} Hathi. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}

// Feature card component
function FeatureCard({
    icon,
    title,
    description,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
}) {
    return (
        <div className="bg-card rounded-lg p-6 border border-border/50 hover:border-primary/50 transition-colors">
            <div className="mb-4">{icon}</div>
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            <p className="text-muted-foreground">{description}</p>
        </div>
    );
}
