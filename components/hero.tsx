import { NextLogo } from "./next-logo";

export function Hero() {
    return (
        <div className="flex flex-col gap-16 items-center">
            <div className="flex gap-8 justify-center items-center">
                <a href="https://nextjs.org/" target="_blank" rel="noreferrer">
                    <NextLogo />
                </a>
            </div>
            <h1 className="sr-only">Hathi-DB - Intelligent Note Taking</h1>
            <p className="text-3xl lg:text-4xl !leading-tight mx-auto max-w-xl text-center">
                An intelligent note-taking app built with{" "}
                <a
                    href="https://nextjs.org/"
                    target="_blank"
                    className="font-bold hover:underline"
                    rel="noreferrer"
                >
                    Next.js
                </a>{" "}
                and <span className="font-bold">PostgreSQL</span>
            </p>
            <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent my-8" />
        </div>
    );
}
