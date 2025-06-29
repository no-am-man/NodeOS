"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { APPS } from "@/lib/apps"
import { useOs } from "@/contexts/OsContext"
import { Power } from "lucide-react"

export default function AppLauncher() {
  const { launchApp } = useOs();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="w-10 h-10 p-0 rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
            <Power />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2 mb-2" side="top" align="start">
        <div className="grid grid-cols-1 gap-1">
          <p className="px-2 py-1 text-sm font-semibold text-muted-foreground">Applications</p>
          {APPS.map(app => (
            <Button
              key={app.id}
              variant="ghost"
              className="w-full justify-start gap-3"
              onClick={() => launchApp(app)}
            >
              <app.Icon className="w-5 h-5 text-primary" />
              <span>{app.name}</span>
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
