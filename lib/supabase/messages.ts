import { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "./client";
import { Tables, TablesInsert, TablesUpdate } from "./types";

export type Message = Tables<"messsages">; // Note: keeping the typo from the schema
export type MessageInsert = TablesInsert<"messsages">;
export type MessageUpdate = TablesUpdate<"messsages">;

export class MessagesService {
  private supabase = createClient();
  constructor(supabaseClient?: SupabaseClient) {
    if (supabaseClient) {
      this.supabase = supabaseClient;
    }
  }

  async getMessagesByUserId(userId: number): Promise<Message[]> {
    const { data, error } = await this.supabase
      .from("messsages")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      throw error;
    }

    return data || [];
  }

  async createMessage(message: MessageInsert): Promise<Message> {
    const { data, error } = await this.supabase
      .from("messsages")
      .insert(message)
      .select()
      .single();

    if (error) {
      console.error("Error creating message:", error);
      throw error;
    }

    return data;
  }

  async updateMessage(id: number, updates: MessageUpdate): Promise<Message> {
    const { data, error } = await this.supabase
      .from("messsages")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating message:", error);
      throw error;
    }

    return data;
  }

  async deleteMessage(id: number): Promise<void> {
    const { error } = await this.supabase
      .from("messsages")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting message:", error);
      throw error;
    }
  }

  async getRecentMessages(
    userId: number,
    limit: number = 50
  ): Promise<Message[]> {
    const { data, error } = await this.supabase
      .from("messsages")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching recent messages:", error);
      throw error;
    }

    return (data || []).reverse(); // Reverse to get chronological order
  }
}

export const messagesService = new MessagesService();
