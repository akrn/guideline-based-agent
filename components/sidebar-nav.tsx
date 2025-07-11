"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MessageCircle, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export type SidebarSection = "chat" | "settings";

interface SidebarNavProps {
  activeSection: SidebarSection;
  onSectionChange: (section: SidebarSection) => void;
}

export function SidebarNav({
  activeSection,
  onSectionChange,
}: SidebarNavProps) {
  const navItems = [
    {
      id: "chat" as const,
      icon: MessageCircle,
      label: "Chat",
      description: "Chat with users",
    },
    {
      id: "settings" as const,
      icon: Settings,
      label: "Settings",
      description: "Application settings",
    },
  ];

  return (
    <Card className="w-16 h-full flex flex-col items-center py-4 bg-muted/30">
      <TooltipProvider>
        <div className="flex flex-col gap-2">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "w-12 h-12 rounded-xl transition-all duration-200",
                      activeSection === item.id
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "hover:bg-accent hover:text-accent-foreground"
                    )}
                    onClick={() => onSectionChange(item.id)}
                  >
                    <Icon className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="ml-2">
                  <p className="font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    </Card>
  );
}
