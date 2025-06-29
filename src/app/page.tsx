"use client";

import { OsProvider } from "@/contexts/OsContext";
import Desktop from "@/components/system/Desktop";
import Taskbar from "@/components/system/Taskbar";
import { useTheme } from "next-themes";
import { useEffect } from "react";

export default function WebFrameOSPage() {
  const { theme } = useTheme();

  useEffect(() => {
    document.body.className = `font-body antialiased ${theme}`;
  }, [theme])

  return (
    <OsProvider>
      <main className="w-screen h-screen overflow-hidden flex flex-col bg-background text-foreground font-body">
        <Desktop />
        <Taskbar />
      </main>
    </OsProvider>
  );
}
