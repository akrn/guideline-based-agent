import {
  Guideline,
  guidelinesService,
  GuidelineWithSimilarity,
} from "@/lib/supabase/guidelines";
import { createEmbedding } from "./utils";
import OpenAI from "openai";

const LLM_MODEL = "gpt-4o";
const CONDITIONAL_GUIDELINES_MATCH_COUNT = 5;

export interface AgentConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AgentRequest {
  conversation: AgentConversationMessage[];
  userId: string;
}

export interface AgentResponse {
  message: string;
}

export class Agent {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Get global guidelines that are relevant to all conversations
   * @returns The global guidelines
   */
  private async getGlobalGuidelines() {
    return await guidelinesService.getGuidelinesByType({
      isGlobal: true,
      enabled: true,
    });
  }

  /**
   * Get conditional guidelines that are relevant to the current conversation using semantic search
   * @param conversation - The conversation history between the user and the agent
   * @returns The conditional guidelines
   */
  private async getConditionalGuidelines(
    conversation: AgentConversationMessage[]
  ) {
    try {
      let conditionalGuidelines: GuidelineWithSimilarity[] = [];

      const embeddingQuery = `${conversation
        // .filter(c => c.role === "user") // TODO: need to test if having only user messages is better
        .map(c => `${c.role} says ${c.content}`)
        .join(" ")}`;

      try {
        const messageEmbedding = await createEmbedding(embeddingQuery);

        conditionalGuidelines = await guidelinesService.searchSimilarGuidelines(
          messageEmbedding,
          CONDITIONAL_GUIDELINES_MATCH_COUNT
        );
      } catch (error) {
        console.error("Failed to perform vector similarity search:", error);
      }

      console.debug("🤖 Guidelines selected by semantic search:");

      conditionalGuidelines.forEach((guideline: GuidelineWithSimilarity) => {
        console.debug(
          `${guideline.id}: [${guideline.similarity.toFixed(2)}] ${guideline.guideline}`
        );
      });

      return conditionalGuidelines;
    } catch (error) {
      console.error("Failed to fetch guidelines:", error);
      return [];
    }
  }

  /**
   * Get relevant conditional guidelines that are relevant to the current conversation using LLM
   * @param conditionalGuidelines - The conditional guidelines
   * @param conversation - The conversation history between the user and the agent
   * @returns The relevant conditional guidelines
   */
  private async getRelevantConditionalGuidelines(
    conditionalGuidelines: GuidelineWithSimilarity[],
    conversation: AgentConversationMessage[]
  ) {
    if (!conditionalGuidelines.length) {
      return [];
    }

    const systemPrompt = `
      You are an expert customer service guideline analyzer.
      Your task is to carefully review conditional guidelines and determine which ones are appropriate for the current customer service conversation.

      <filtering_criteria>
      1. RELEVANCE: Only select guidelines where the condition clearly matches the current customer situation
      2. APPROPRIATENESS: Exclude guidelines that would be inappropriate given the conversation context
      3. AVOID REPETITION: Do NOT select guidelines that have already been applied or addressed in previous assistant responses except for the following cases:
        - The condition is met again for a new reason in the most recent user message, and the associated action has not yet been taken in response to this new occurrence
      4. TIMING: Consider whether the guideline is appropriate for the current stage of the conversation
      </filtering_criteria>

      <analysis_process>
      1. Read the full conversation history carefully
      2. For each guideline, check if its condition matches the customer's current state/request
      3. Verify the guideline hasn't already been applied by reviewing assistant responses
      4. Ensure the guideline action is appropriate for the current conversation context
      5. Consider if applying the guideline would be helpful rather than redundant
      </analysis_process>

      <conditional_guidelines>
      ${conditionalGuidelines
        .map(
          (guideline, index) =>
            `${index + 1}. ID: ${guideline.id}
           When: "${guideline.condition}"
           Then: "${guideline.guideline}"
           Similarity: ${guideline.similarity.toFixed(2)}`
        )
        .join("\n\n")}
      </conditional_guidelines>

      <conversation_context>
      The conversation history will show you what the customer has said and how the assistant has already responded. Look for patterns where guidelines may have already been applied.
      ${conversation.map(c => `${c.role}: ${c.content}`).join("\n")}
      </conversation_context>

      <return_format>
      Return ONLY the IDs of guidelines that are:
      - Clearly relevant to the current customer situation
      - Not already applied in previous responses
      - Appropriate for the current conversation stage
      - Helpful rather than redundant

      JSON format:
      {
        "guidelines": [
          {
            "id": "guideline_id",
            "reason": "Brief explanation of why this guideline is relevant and appropriate"
          }
        ]
      }
      </return_format>
    `;

    const completion = await this.openai.chat.completions.create({
      model: LLM_MODEL,
      response_format: { type: "json_object" },
      messages: [{ role: "system", content: systemPrompt }],
      max_tokens: 1000,
      temperature: 0.3,
      top_p: 0.9,
    });

    const response = completion.choices[0]?.message?.content;

    interface ResponseType {
      guidelines?: { id: number; reason: string }[];
    }

    try {
      const parsedResponse = JSON.parse(response || "{}") as ResponseType;
      const selectedGuidelines = parsedResponse.guidelines || [];
      const guidelinesIds = new Set(
        selectedGuidelines.map(item => Number(item.id))
      );

      console.debug("🤖 Guidelines selected by LLM:");
      selectedGuidelines.forEach(item => {
        console.debug(`${item.id}: [${item.reason}]`);
      });

      return conditionalGuidelines.filter(
        (guideline: GuidelineWithSimilarity) => guidelinesIds.has(guideline.id)
      );
    } catch (error) {
      console.error("Failed to parse JSON:", error);
      // Fallback to original logic if parsing fails
      return conditionalGuidelines;
    }
  }

  /**
   * Construct the system prompt for the LLM based on the selected guidelines
   * @param globalGuidelines - The global guidelines
   * @param conditionalGuidelines - The conditional guidelines
   * @param conversation - The conversation history between the user and the agent
   * @returns The system prompt
   */
  private buildSystemPrompt(
    globalGuidelines: Guideline[],
    conditionalGuidelines: GuidelineWithSimilarity[]
  ) {
    const conditionalGuidelinesSorted = conditionalGuidelines.sort(
      (a: GuidelineWithSimilarity, b: GuidelineWithSimilarity) =>
        b.similarity - a.similarity
    );

    const systemPrompt = `
      You are a helpful AI assistant.
      When crafting your reply, you must:
      1. Follow the global guidelines provided below that apply to all interactions
      2. Follow the behavioral guidelines provided below. These guidelines are specific to the current interaction and should be applied in addition to the global guidelines. Behaviourial guidelines have already been pre-filtered based on the interaction's context and other considerations outside your scope.
      3. You may choose not to follow a guideline ONLY in the following cases:
        3.1. It conflicts with a previous customer request.
        3.2. It is clearly inappropriate given the current context of the conversation.
      4. Do not hallucinate. If you don't know the answer, say so. Do not make up information.

      <global_guidelines>
      ${globalGuidelines.map((guideline, index) => `${index + 1}. ${guideline.guideline}`).join("\n")}
      </global_guidelines>

      <behavioral_guidelines>
      ${conditionalGuidelinesSorted.map((guideline, index) => `${index + 1}. ${guideline.guideline}`).join("\n")}
      </behavioral_guidelines>
    `;

    return systemPrompt;
  }

  /**
   * Call the LLM with the system prompt and conversation history
   * @param systemPrompt - The system prompt
   * @param conversation - The conversation history between the user and the agent
   * @returns The LLM response
   */
  private async callLLM(
    systemPrompt: string,
    conversation: AgentConversationMessage[]
  ): Promise<string> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: LLM_MODEL,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          ...conversation,
        ],
        max_tokens: 1000,
        temperature: 0.3,
        top_p: 0.9,
      });

      const response = completion.choices[0]?.message?.content;

      if (!response) {
        throw new Error("No response received from OpenAI");
      }

      return response.trim();
    } catch (error) {
      console.error("LLM call failed:", error);

      // Provide specific error messages based on the error type
      if (error instanceof Error) {
        if (error.message.includes("OPENAI_API_KEY")) {
          return "I apologize, but the AI service is not properly configured. Please contact support.";
        }
        if (
          error.message.includes("rate limit") ||
          error.message.includes("quota")
        ) {
          return "I'm experiencing high demand right now. Please try again in a moment.";
        }
        if (
          error.message.includes("network") ||
          error.message.includes("timeout")
        ) {
          return "I'm having connectivity issues. Please try again shortly.";
        }
      }

      return "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.";
    }
  }

  /**
   * Process a new message from a user and return an agent response
   * @param conversation - The conversation history between the user and the agent
   * @returns The agent response
   */
  async processMessage({ conversation }: AgentRequest): Promise<AgentResponse> {
    try {
      console.debug(
        `🧓 Message: ${conversation[conversation.length - 1].content}`
      );

      const globalGuidelines = await this.getGlobalGuidelines();
      const conditionalGuidelines =
        await this.getConditionalGuidelines(conversation);

      // At this point we have the global and conditional guidelines
      // Let's call LLM in order to determine which conditional guidelines are relevant to the current interaction

      const relevantConditionalGuidelines =
        await this.getRelevantConditionalGuidelines(
          conditionalGuidelines,
          conversation
        );

      const systemPrompt = this.buildSystemPrompt(
        globalGuidelines,
        relevantConditionalGuidelines
      );

      const response = await this.callLLM(systemPrompt, conversation);

      return {
        message: response,
      };
    } catch (error) {
      console.error("Agent processing failed:", error);

      return {
        message:
          "I apologize, but I encountered an error while processing your message. Please try again.",
      };
    }
  }
}

export const agent = new Agent();
