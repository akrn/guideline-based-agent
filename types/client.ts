import { Tables } from "@/lib/supabase/types";
import { User as SupabaseUser } from "@/lib/supabase/users";

export type GuidelineLite = Omit<Tables<"guidelines">, "condition_vector">;

export interface User extends SupabaseUser {
  lastMessage?: string;
  lastMessageTime?: string;
}

export interface Message {
  id: string;
  content: string;
  sender: "user" | "agent";
  timestamp: string;
  senderName: string;
}
