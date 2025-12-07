import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    ArrowRight,
    Brain,
    Database,
    Network,
    Sparkles,
    // Zap,
} from "lucide-react";
import { HathiIcon } from "@/components/icon";

export default function Home() {
    return (
        <div className="flex flex-col min-h-screen w-full bg-background text-foreground relative overflow-hidden selection:bg-primary/20">
            {/* Background Effects */}
            <div className="absolute inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px] animate-pulse"></div>
            
            {/* Nav / Header (Minimal) */}
            <header className="w-full py-6 px-6 md:px-12 flex justify-between items-center z-10">
                <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
                    <HathiIcon className="h-8 w-8 text-primary" />
                    <span>Hathi<span className="text-muted-foreground">DB</span></span>
                </div>
            </header>

            {/* Hero Section */}
            <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 md:py-32 w-full max-w-6xl mx-auto z-10">
                <div className="mb-8 animate-in fade-in zoom-in duration-700">
                    <HathiIcon className="h-24 w-24 text-primary drop-shadow-2xl" />
                </div>
                
                <h1 className="text-5xl md:text-8xl font-bold tracking-tighter mb-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 max-w-4xl bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70 pb-2">
                    Your Second Brain
                </h1>

                <p className="text-lg md:text-xl text-muted-foreground/80 max-w-2xl mx-auto mb-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 leading-relaxed">
                    Hathi is an intelligent engine that thinks alongside you—connecting ideas, surfacing context, and scaling your knowledge.
                </p>

                <div className="flex items-center gap-2 mb-10 text-sm font-medium text-foreground/80 bg-foreground/5 px-4 py-2 rounded-full border border-foreground/10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-250 backdrop-blur-sm">
                    <Database className="h-4 w-4" />
                    <span>100% Local. Your data never leaves your device.</span>
                </div>

                <div className="flex flex-col sm:flex-row justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 w-full sm:w-auto">
                    <Button asChild size="lg" className="rounded-full px-8 text-lg h-14 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 bg-foreground text-background hover:bg-foreground/90 border-0">
                        <Link href="/journal">
                            Start Writing <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="rounded-full px-8 text-lg h-14 backdrop-blur-sm hover:bg-foreground/5 border-foreground/10">
                        <Link href="https://github.com/rahulnyk/hathi-db" target="_blank">
                             View on GitHub
                        </Link>
                    </Button>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 px-4 w-full relative z-10">
                 <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <FeatureCard
                            delay={400}
                            icon={<Sparkles className="h-6 w-6 text-amber-500" />}
                            title="AI Auto-Context"
                            description="AI that understands you. Automatically tags and categorizes your thoughts with precision."
                            gradient="from-amber-500/10 to-transparent"
                        />
                        <FeatureCard
                            delay={500}
                            icon={<Network className="h-6 w-6 text-blue-500" />}
                            title="Knowledge Graph"
                            description="See the big picture. Visualize the hidden connections between your disparate ideas."
                            gradient="from-blue-500/10 to-transparent"
                        />
                        <FeatureCard
                            delay={600}
                            icon={<Brain className="h-6 w-6 text-purple-500" />}
                            title="Semantic Search"
                            description="Search by meaning. Find 'that idea about growth' without needing exact keywords."
                            gradient="from-purple-500/10 to-transparent"
                        />
                        <FeatureCard
                            delay={700}
                            icon={<Database className="h-6 w-6 text-emerald-500" />}
                            title="Local First"
                            description="Privacy by default. Built on SQLite with vector extensions, running entirely on your machine."
                            gradient="from-emerald-500/10 to-transparent"
                        />
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 w-full border-t border-border/40 backdrop-blur-sm">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-center items-center text-sm text-muted-foreground gap-4">
                    <div className="flex items-center gap-2">
                        <HathiIcon className="h-5 w-5 opacity-40" />
                        <span>&copy; {new Date().getFullYear()} Hathi DB</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({
    icon,
    title,
    description,
    delay,
    gradient
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    delay: number;
    gradient: string;
}) {
    return (
        <div 
            className={`group relative h-full bg-card/50 backdrop-blur-sm p-8 rounded-3xl border border-white/5 hover:border-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 fill-mode-backwards`}
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
            
            <div className="relative z-10">
                <div className="mb-6 bg-background/50 w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner border border-white/5 group-hover:scale-110 transition-transform duration-500">
                    {icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground tracking-tight">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    {description}
                </p>
            </div>
        </div>
    );
}
