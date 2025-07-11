"use client";

import * as React from "react";
import { UserList } from "@/components/user-list";
import { ChatArea } from "@/components/chat-area";
import { User } from "@/types/client";
import { Message } from "@/types/client";

interface ChatSectionProps {
  users: User[];
  selectedUserId?: string;
  messages: Message[];
  isLoading: boolean;
  usersLoading?: boolean;
  onUserSelect: (userId: string) => void;
  onAddUser: (user: User) => void;
  onSendMessage: (message: string) => void;
}

export function ChatSection({
  users,
  selectedUserId,
  messages,
  isLoading,
  usersLoading = false,
  onUserSelect,
  onAddUser,
  onSendMessage,
}: ChatSectionProps) {
  const selectedUser = users.find(user => user.id === Number(selectedUserId));

  return (
    <div className="h-full flex gap-4">
      {/* Left sidebar - User list */}
      <div className="w-80 flex-shrink-0">
        <UserList
          users={users}
          selectedUserId={selectedUserId}
          onUserSelect={onUserSelect}
          onAddUser={onAddUser}
          isLoading={usersLoading}
        />
      </div>

      {/* Main chat area */}
      <div className="flex-1 min-w-0">
        <ChatArea
          selectedUser={selectedUser}
          messages={messages}
          onSendMessage={onSendMessage}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
