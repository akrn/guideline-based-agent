import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 1536;

/**
 * Creates vector embeddings for the given text using OpenAI's embeddings API
 * @param text The input text to create embeddings for
 * @returns Promise<number[]> containing the embedding vector
 */
export async function createEmbedding(text: string): Promise<number[]> {
  try {
    // Validate input
    if (!text || text.trim().length === 0) {
      throw new Error("Text input cannot be empty");
    }

    // Remove extra spaces
    const cleanText = text.trim().replace(/\s+/g, " ").toLowerCase();

    const embeddingRequest: OpenAI.Embeddings.EmbeddingCreateParams = {
      model: EMBEDDING_MODEL,
      dimensions: EMBEDDING_DIMENSIONS,
      input: cleanText,
    };

    const response = await openai.embeddings.create(embeddingRequest);
    const embeddingData = response.data[0];

    if (!embeddingData || !embeddingData.embedding) {
      throw new Error(
        "Failed to generate embedding: No embedding data returned"
      );
    }

    return embeddingData.embedding;
  } catch (error) {
    console.error("Error creating embedding:", error);

    if (error instanceof Error) {
      throw new Error(`Embedding creation failed: ${error.message}`);
    }

    throw new Error("Unknown error occurred while creating embedding");
  }
}
