"use client";

import * as React from "react";
import { SidebarNav, SidebarSection } from "@/components/sidebar-nav";
import { ChatSection } from "@/components/chat-section";
import { SettingsSection } from "@/components/settings-section";
import { usersService } from "@/lib/supabase/users";
import { messagesService } from "@/lib/supabase/messages";
import { User, Message } from "@/types/client";

export default function Home() {
  const [activeSection, setActiveSection] =
    React.useState<SidebarSection>("chat");
  const [users, setUsers] = React.useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = React.useState<string>();
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [usersLoading, setUsersLoading] = React.useState(true);

  // Load users from Supabase on component mount
  React.useEffect(() => {
    const loadUsers = async () => {
      try {
        setUsersLoading(true);
        const supabaseUsers = await usersService.getAllUsers();

        // Transform Supabase users to include UI-specific fields
        const transformedUsers: User[] = supabaseUsers.map(user => ({
          ...user,
          lastMessage: "",
          lastMessageTime: new Date(user.created_at).toLocaleDateString(),
        }));

        setUsers(transformedUsers);
      } catch (error) {
        console.error("Failed to load users:", error);
        // Set empty array on error
        setUsers([]);
      } finally {
        setUsersLoading(false);
      }
    };

    loadUsers();
  }, []);

  const handleUserSelect = async (userId: string) => {
    setSelectedUserId(userId);
    const messages = await messagesService.getMessagesByUserId(
      parseInt(userId)
    );
    const transformedMessages: Message[] = messages.map(message => ({
      id: message.id.toString(),
      content: message.message,
      sender: message.is_agent_response ? "agent" : "user",
      timestamp: new Date(message.created_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      senderName: message.is_agent_response ? "Agent" : "User",
    }));
    setMessages(transformedMessages);
  };

  const handleAddUser = async (newUser: User) => {
    try {
      // Create user in Supabase
      const createdUser = await usersService.createUser({
        full_name: newUser.full_name,
      });

      // Transform the created user to include UI-specific fields
      const transformedUser: User = {
        ...createdUser,
        lastMessage: "Just joined",
        lastMessageTime: "now",
      };

      setUsers((prev: User[]) => [transformedUser, ...prev]);
    } catch (error) {
      console.error("Failed to create user:", error);
      // Optionally show error message to user
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedUserId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: "user",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      senderName: "User",
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: content,
          userId: selectedUserId,
        }),
      });

      if (!response.ok) {
        // TODO: Mark message as failed
        throw new Error("Failed to send message");
      }

      const data = await response.json();

      const agentMessage: Message = {
        id: data.agentMessage.id.toString(),
        content: data.agentMessage.message,
        sender: "agent",
        timestamp: new Date(data.agentMessage.created_at).toLocaleTimeString(
          [],
          { hour: "2-digit", minute: "2-digit" }
        ),
        senderName: "Agent",
      };
      setMessages(prev => [...prev, agentMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content:
          "Sorry, I'm having trouble connecting right now. Please try again.",
        sender: "agent",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        senderName: "Agent",
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case "chat":
        return (
          <ChatSection
            users={users}
            selectedUserId={selectedUserId}
            messages={messages}
            isLoading={isLoading}
            usersLoading={usersLoading}
            onUserSelect={handleUserSelect}
            onAddUser={handleAddUser}
            onSendMessage={handleSendMessage}
          />
        );
      case "settings":
        return <SettingsSection />;
      default:
        return null;
    }
  };

  return (
    <div className="h-screen p-4 bg-background">
      <div className="h-full flex gap-4">
        {/* Sidebar Navigation */}
        <div className="flex-shrink-0">
          <SidebarNav
            activeSection={activeSection}
            onSectionChange={setActiveSection}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">{renderContent()}</div>
      </div>
    </div>
  );
}
