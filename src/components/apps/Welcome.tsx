"use client";

export default function Welcome() {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center">
            <h1 className="text-3xl font-bold font-headline text-primary">Welcome to WebFrameOS</h1>
            <p className="mt-2 text-muted-foreground">
                This is a simulated operating system running entirely in your browser.
            </p>
            <p className="mt-4 text-sm">
                Launch applications from the menu, move windows, and explore what&apos;s possible.
            </p>
        </div>
    )
}
