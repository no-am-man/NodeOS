"use client";

import { OsProvider } from "@/contexts/OsContext";
import Desktop from "@/components/system/Desktop";
import Taskbar from "@/components/system/Taskbar";

export default function WebFrameOSPage() {
  return (
    <OsProvider>
      <main className="w-screen h-screen overflow-hidden flex flex-col bg-background text-foreground font-body">
        <Desktop />
        <Taskbar />
      </main>
    </OsProvider>
  );
}
