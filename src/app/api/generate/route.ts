import { NextResponse } from "next/server";
import { getAuthenticatedServerClient } from "@/lib/supabase/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedServerClient(request);

    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in to generate and save replies." },
        { status: 401 }
      );
    }

    const { customerMessage, tone, extraInstructions } = await request.json();

    if (!customerMessage || typeof customerMessage !== "string" || !customerMessage.trim()) {
      return NextResponse.json(
        { error: "Please enter a customer message or review." },
        { status: 400 }
      );
    }

    const selectedTone = tone || "professional";
    let aiResponse = "";

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey && apiKey.trim().length > 5) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `You are an expert B2B and direct-to-consumer customer communication specialist.
Generate a high-converting, professional, and context-aware reply to the customer message below.

Tone requested: ${selectedTone}
Customer Message:
"${customerMessage.trim()}"

${extraInstructions ? `Additional Context / Instructions:\n"${extraInstructions.trim()}"` : ""}

Rules:
1. Write directly to the customer. Do not include placeholders like "[Your Name]" if you can avoid it, or use sensible generic closings like "The Support Team" or "Our Team".
2. Address the customer's specific emotion and points directly.
3. Keep the output clean, ready to copy and paste.`;

        const interaction = await ai.interactions.create({
          model: "gemini-3.8-flash",
          input: prompt,
        });

        aiResponse = interaction.output_text || "Could not generate response. Please try again.";
      } catch (geminiError: unknown) {
        console.error("Gemini API error:", geminiError);
        return NextResponse.json(
          { error: "Failed to generate reply with Gemini API. Check your GEMINI_API_KEY in .env.local." },
          { status: 500 }
        );
      }
    } else {
      // Demo response when API key is not yet provided
      aiResponse = `Thank you for taking the time to share your feedback. We genuinely apologize for the frustration this caused and take your experience very seriously. 

Our team has reviewed your note and would love to resolve this immediately. Please reach out directly with your order details so we can issue a full correction or refund right away. We appreciate your patience and the opportunity to make this right!

(Demo mode: Add your GEMINI_API_KEY in .env.local to generate real-time AI replies with Gemini 3.8 Flash)`;
    }

    // Save to Supabase saved_replies table
    const { data: savedRecord, error: dbError } = await supabase
      .from("saved_replies")
      .insert({
        user_id: user.id,
        customer_message: customerMessage.trim(),
        tone: selectedTone,
        ai_response: aiResponse,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Error saving to Supabase:", dbError);
      // Still return the generated text even if DB save fails
      return NextResponse.json({
        reply: aiResponse,
        saved: null,
        warning: "Reply generated, but failed to save to history.",
      });
    }

    return NextResponse.json({
      reply: aiResponse,
      saved: savedRecord,
    });
  } catch (error) {
    console.error("Generate route error:", error);
    return NextResponse.json(
      { error: "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}
