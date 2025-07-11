"use client";

import * as React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Send, Loader2 } from "lucide-react";
import { User as SupabaseUser } from "@/lib/supabase/users";

interface Message {
  id: string;
  content: string;
  sender: "user" | "agent";
  timestamp: string;
  senderName: string;
}

interface ChatAreaProps {
  selectedUser?: SupabaseUser;
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
}

export function ChatArea({
  selectedUser,
  messages,
  onSendMessage,
  isLoading = false,
}: ChatAreaProps) {
  const [inputValue, setInputValue] = React.useState("");
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!selectedUser) {
    return (
      <Card className="h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p className="text-lg">Select a user to start chatting</p>
          <p className="text-sm">
            Choose someone from the user list to begin the conversation
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      {/* Chat Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarFallback>
                {selectedUser.full_name
                  .split(" ")
                  .map(n => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          <div>
            <h3 className="font-semibold">{selectedUser.full_name}</h3>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === "agent" ? "justify-start" : "justify-end"
              }`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-3 py-2 ${
                  message.sender === "agent"
                    ? "bg-muted text-muted-foreground"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">{message.timestamp}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted text-muted-foreground rounded-lg px-3 py-2 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Agent is typing...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <Separator />

      {/* Message Input */}
      <div className="p-4">
        <div className="flex gap-2">
          <Input
            placeholder="Type your message..."
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
