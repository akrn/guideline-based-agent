import { NextRequest, NextResponse } from "next/server";
import { guidelinesService } from "@/lib/supabase/guidelines";
import { createEmbedding } from "@/lib/agent/utils";

export async function POST(request: NextRequest) {
  try {
    const { guideline, condition, is_global } = await request.json();

    if (!guideline || typeof guideline !== "string") {
      return NextResponse.json(
        { error: "Guideline text is required" },
        { status: 400 }
      );
    }

    if (!is_global && (!condition || typeof condition !== "string")) {
      return NextResponse.json(
        { error: "Condition is required for conditional guidelines" },
        { status: 400 }
      );
    }

    let embedding: number[] | null = null;

    if (!is_global && condition) {
      try {
        embedding = await createEmbedding(condition);
      } catch (error) {
        console.error("Failed to create embedding for condition:", error);
        return NextResponse.json(
          { error: "Failed to create a guideline" },
          { status: 500 }
        );
      }
    }

    const savedGuideline = await guidelinesService.createGuideline({
      guideline,
      condition: is_global ? null : condition,
      is_global,
      is_disabled: false,
      condition_vector: embedding ? `[${embedding.join(",")}]` : null,
    });

    return NextResponse.json({
      success: true,
      guideline: { ...savedGuideline, condition_vector: undefined },
    });
  } catch (error) {
    console.error("Error in guidelines API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
