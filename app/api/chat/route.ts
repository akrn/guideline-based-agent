import { NextRequest, NextResponse } from "next/server";
import { agent } from "@/lib/agent";
import { MessagesService } from "@/lib/supabase/messages";

export async function POST(request: NextRequest) {
  try {
    const { message, userId } = await request.json();

    if (!message || !userId) {
      return NextResponse.json(
        { error: "Message and userId are required" },
        { status: 400 }
      );
    }

    const messagesService = new MessagesService();

    const userMessage = await messagesService.createMessage({
      message,
      user_id: parseInt(userId),
      is_agent_response: false,
    });

    const messages = await messagesService.getMessagesByUserId(
      parseInt(userId)
    );

    const conversation = messages.map(m => ({
      role: m.is_agent_response ? ("assistant" as const) : ("user" as const),
      content: m.message,
    }));

    const agentResponse = await agent.processMessage({
      conversation,
      userId,
    });

    const agentMessage = await messagesService.createMessage({
      message: agentResponse.message,
      user_id: parseInt(userId),
      is_agent_response: true,
    });

    return NextResponse.json({
      userMessage: userMessage,
      agentMessage: agentMessage,
    });
  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
