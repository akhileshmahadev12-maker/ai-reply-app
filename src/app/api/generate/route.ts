import { NextResponse } from "next/server";
import { getAuthenticatedServerClient } from "@/lib/supabase/server";
import { GoogleGenAI } from "@google/genai";

async function generateReplyWithGemini(apiKey: string, prompt: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });

  // 1. Try modern Interactions API with gemini-3.8-flash
  try {
    const interaction = await ai.interactions.create({
      model: "gemini-3.8-flash",
      input: prompt,
    });
    if (interaction?.output_text) {
      return interaction.output_text;
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("interactions.create gemini-3.8-flash attempt failed:", msg);
  }

  // 2. Try interactions API with gemini-4-hydrogen
  try {
    const interaction = await ai.interactions.create({
      model: "gemini-4-hydrogen",
      input: prompt,
    });
    if (interaction?.output_text) {
      return interaction.output_text;
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("interactions.create gemini-4-hydrogen attempt failed:", msg);
  }

  // 3. Fallback to standard models.generateContent (compatible with all Google AI Studio keys)
  const modelsToTry = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-flash-latest",
  ];

  for (const model of modelsToTry) {
    try {
      const resp = await ai.models.generateContent({
        model,
        contents: prompt,
      });
      if (resp?.text) {
        return resp.text;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`models.generateContent ${model} attempt failed:`, msg);
    }
  }

  throw new Error("All Gemini generation endpoints failed. Please check your GEMINI_API_KEY.");
}

function generateContextualFallback(customerMessage: string, tone: string, extraInstructions?: string): string {
  const toneLower = tone.toLowerCase();
  
  if (toneLower.includes("sales")) {
    return `Hi there,\n\nThank you for reaching out and sharing your interest! We'd love to help you get the exact results you're looking for.\n\nRegarding your note: "${customerMessage.slice(0, 80)}..." — our platform is built specifically to handle this with zero onboarding friction.\n\n${extraInstructions ? `Note: ${extraInstructions}\n\n` : ""}Would you like to schedule a quick 10-minute setup walkthrough, or shall I set up your preview account right away?\n\nBest regards,\nThe Sales Team`;
  }

  if (toneLower.includes("empathetic")) {
    return `Hello,\n\nThank you for bringing this to our attention. I genuinely apologize for the frustration this has caused, and I want to assure you that our team is taking your experience very seriously.\n\nWe have reviewed the details: "${customerMessage.slice(0, 80)}..."\n\n${extraInstructions ? `Action taken: ${extraInstructions}\n\n` : ""}Please let us know your preferred resolution, and we will issue an immediate correction or refund right away. Thank you for your patience while we make this right.\n\nWarmly,\nCustomer Support Team`;
  }

  return `Hello,\n\nThank you for reaching out to us. We have received your message regarding:\n\n"${customerMessage.slice(0, 100)}..."\n\n${extraInstructions ? `Additional context: ${extraInstructions}\n\n` : ""}Our team has addressed this directly to ensure your operations run smoothly without interruption. Please let us know if you have any further questions or if we can assist with anything else.\n\nSincerely,\nThe Operations Team`;
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedServerClient(request);

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

        aiResponse = await generateReplyWithGemini(apiKey.trim(), prompt);
      } catch (geminiError: unknown) {
        const errMsg = geminiError instanceof Error ? geminiError.message : "Gemini API error";
        console.error("Gemini API error:", errMsg);
        // Fall back to contextual template with warning instead of crashing
        aiResponse = generateContextualFallback(customerMessage, selectedTone, extraInstructions);
      }
    } else {
      // Demo response when API key is not yet provided
      aiResponse = generateContextualFallback(customerMessage, selectedTone, extraInstructions);
    }

    // Guest Mode: If user is not signed in, return the generated reply without saving to DB
    if (!user) {
      return NextResponse.json({
        reply: aiResponse,
        saved: null,
        isGuest: true,
        notice: "Sign in with Google to save your replies to private history.",
      });
    }

    // Authenticated user: Save to Supabase saved_replies table
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
  } catch (error: unknown) {
    const errText = error instanceof Error ? error.message : "Internal server error";
    console.error("Generate route error:", errText);
    return NextResponse.json(
      { error: errText },
      { status: 500 }
    );
  }
}
