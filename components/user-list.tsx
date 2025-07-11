"use client";

import * as React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { User } from "@/types/client";

interface UserListProps {
  users: User[];
  selectedUserId?: string;
  onUserSelect: (userId: string) => void;
  onAddUser?: (user: User) => void;
  isLoading?: boolean;
}

export function UserList({
  users,
  selectedUserId,
  onUserSelect,
  onAddUser,
  isLoading = false,
}: UserListProps) {
  const handleAddUser = () => {
    const name = prompt("Enter user name:");
    if (name && name.trim()) {
      const newUser: User = {
        id: Date.now(), // This will be overwritten by Supabase
        full_name: name.trim(),
        created_at: new Date().toISOString(),
        lastMessage: "Just joined",
        lastMessageTime: "now",
      };
      onAddUser?.(newUser);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <div className="p-3 border-b">
        <Button
          onClick={handleAddUser}
          className="w-full"
          variant="outline"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Conversation
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2 text-sm text-muted-foreground">
                Loading users...
              </span>
            </div>
          ) : users.length === 0 ? (
            <div className="flex items-center justify-center p-8">
              <span className="text-sm text-muted-foreground">
                No users found
              </span>
            </div>
          ) : (
            users.map((user, index) => (
              <React.Fragment key={user.id}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start h-auto p-3 text-left",
                    selectedUserId === user.id.toString() && "bg-accent"
                  )}
                  onClick={() => onUserSelect(user.id.toString())}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {user.full_name
                            .split(" ")
                            .map(n => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">
                          {user.full_name}
                        </p>
                        {user.lastMessageTime && (
                          <span className="text-xs text-muted-foreground">
                            {user.lastMessageTime}
                          </span>
                        )}
                      </div>
                      {user.lastMessage && (
                        <p className="text-xs text-muted-foreground truncate">
                          {user.lastMessage}
                        </p>
                      )}
                    </div>
                  </div>
                </Button>
                {index < users.length - 1 && <Separator className="my-1" />}
              </React.Fragment>
            ))
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}
