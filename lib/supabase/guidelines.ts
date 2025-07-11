import { createClient } from "./client";
import { Tables, TablesInsert, TablesUpdate } from "./types";

export type Guideline = Tables<"guidelines">;
export type GuidelineWithSimilarity = Omit<Guideline, "condition_vector"> & {
  similarity: number;
};

type GuidelineInsert = TablesInsert<"guidelines">;
type GuidelineUpdate = TablesUpdate<"guidelines">;

export class GuidelinesService {
  private supabase = createClient();

  async getAllGuidelines(): Promise<Guideline[]> {
    const { data, error } = await this.supabase
      .from("guidelines")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch guidelines: ${error.message}`);
    }

    return data || [];
  }

  async getGuidelinesByType({
    isGlobal,
    enabled,
  }: {
    isGlobal: boolean;
    enabled?: boolean;
  }): Promise<Guideline[]> {
    const query = this.supabase
      .from("guidelines")
      .select("*")
      .eq("is_global", isGlobal)
      .order("created_at", { ascending: false });

    if (enabled) {
      query.eq("is_disabled", false);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch guidelines: ${error.message}`);
    }

    return data || [];
  }

  async createGuideline(guideline: GuidelineInsert): Promise<Guideline> {
    const { data, error } = await this.supabase
      .from("guidelines")
      .insert(guideline)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create guideline: ${error.message}`);
    }

    return data;
  }

  async updateGuideline(
    id: number,
    updates: GuidelineUpdate
  ): Promise<Guideline> {
    const { data, error } = await this.supabase
      .from("guidelines")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update guideline: ${error.message}`);
    }

    return data;
  }

  async deleteGuideline(id: number): Promise<void> {
    const { error } = await this.supabase
      .from("guidelines")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(`Failed to delete guideline: ${error.message}`);
    }
  }

  async toggleGuideline(id: number): Promise<Guideline> {
    // First get the current state
    const { data: currentGuideline, error: fetchError } = await this.supabase
      .from("guidelines")
      .select("is_disabled")
      .eq("id", id)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch guideline: ${fetchError.message}`);
    }

    // Toggle the is_disabled state
    const { data, error } = await this.supabase
      .from("guidelines")
      .update({ is_disabled: !currentGuideline.is_disabled })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to toggle guideline: ${error.message}`);
    }

    return data;
  }

  /**
   * Perform semantic search using pgvector for similar conditional guidelines
   * @param queryEmbedding The embedding vector to search for
   * @param limit Maximum number of results to return
   * @returns Array of guidelines with similarity scores
   */
  async searchSimilarGuidelines(
    queryEmbedding: number[],
    limit: number
  ): Promise<GuidelineWithSimilarity[]> {
    try {
      // Convert embedding to string format expected by pgvector
      const embeddingString = `[${queryEmbedding.join(",")}]`;

      // Use pgvector's cosine similarity search
      const { data, error } = await this.supabase.rpc(
        "search_similar_guidelines",
        {
          query_embedding: embeddingString,
          match_count: limit,
        }
      );

      if (error) {
        console.error("pgvector search error:", error);
        throw new Error(
          `Failed to search similar guidelines: ${error.message}`
        );
      }

      return data || [];
    } catch (error) {
      console.error("Error in semantic search:", error);
      return [];
    }
  }
}

export const guidelinesService = new GuidelinesService();
