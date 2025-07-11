import { createClient } from "./client";
import { Tables, TablesInsert, TablesUpdate } from "./types";

export type User = Tables<"users">;
export type UserInsert = TablesInsert<"users">;
export type UserUpdate = TablesUpdate<"users">;

export class UsersService {
  private supabase = createClient();

  async getAllUsers(): Promise<User[]> {
    const { data, error } = await this.supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching users:", error);
      throw error;
    }

    return data || [];
  }

  async getUserById(id: number): Promise<User | null> {
    const { data, error } = await this.supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching user:", error);
      throw error;
    }

    return data;
  }

  async createUser(user: UserInsert): Promise<User> {
    const { data, error } = await this.supabase
      .from("users")
      .insert(user)
      .select()
      .single();

    if (error) {
      console.error("Error creating user:", error);
      throw error;
    }

    return data;
  }

  async updateUser(id: number, updates: UserUpdate): Promise<User> {
    const { data, error } = await this.supabase
      .from("users")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating user:", error);
      throw error;
    }

    return data;
  }

  async deleteUser(id: number): Promise<void> {
    const { error } = await this.supabase.from("users").delete().eq("id", id);

    if (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  }
}

export const usersService = new UsersService();
