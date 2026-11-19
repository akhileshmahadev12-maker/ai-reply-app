import { NextResponse } from "next/server";
import { getAuthenticatedServerClient } from "@/lib/supabase/server";
import { GoogleGenAI } from "@google/genai";

async function generateReplyWithGemini(apiKey: string, prompt: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });

  // 6.5s timeout promise so Vercel serverless function never times out or hangs
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("Gemini generation timed out after 6.5s")), 6500);
  });

  const workerPromise = (async () => {
    // 1. Try gemini-2.5-flash via standard models.generateContent (fastest, universally supported by all keys)
    try {
      const resp = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
      if (resp?.text) return resp.text;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn("models.generateContent gemini-2.5-flash failed:", msg);
    }

    // 2. Try gemini-2.0-flash
    try {
      const resp = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
      });
      if (resp?.text) return resp.text;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn("models.generateContent gemini-2.0-flash failed:", msg);
    }

    // 3. Try gemini-1.5-flash
    try {
      const resp = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: prompt,
      });
      if (resp?.text) return resp.text;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn("models.generateContent gemini-1.5-flash failed:", msg);
    }

    // 4. Try interactions API with gemini-3.8-flash
    try {
      const interaction = await ai.interactions.create({
        model: "gemini-3.8-flash",
        input: prompt,
      });
      if (interaction?.output_text) return interaction.output_text;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn("interactions.create gemini-3.8-flash failed:", msg);
    }

    throw new Error("All Gemini generation attempts failed.");
  })();

  return await Promise.race([workerPromise, timeoutPromise]);
}

function generateContextualFallback(customerMessage: string, tone: string, extraInstructions?: string): string {
  const toneLower = tone.toLowerCase();
  
  if (toneLower.includes("sales")) {
    return `Hi there,\n\nThank you for reaching out and sharing your interest! We'd love to help you get the exact results you're looking for.\n\nRegarding your note: "${customerMessage.slice(0, 100)}..." — our platform is built specifically to handle this with zero onboarding friction.\n\n${extraInstructions ? `Note: ${extraInstructions}\n\n` : ""}Would you like to schedule a quick 10-minute setup walkthrough, or shall I set up your preview account right away?\n\nBest regards,\nThe Sales Team`;
  }

  if (toneLower.includes("empathetic")) {
    return `Hello,\n\nThank you for bringing this to our attention. I genuinely apologize for the frustration this has caused, and I want to assure you that our team is taking your experience very seriously.\n\nWe have reviewed the details: "${customerMessage.slice(0, 100)}..."\n\n${extraInstructions ? `Action taken: ${extraInstructions}\n\n` : ""}Please let us know your preferred resolution, and we will issue an immediate correction or refund right away. Thank you for your patience while we make this right.\n\nWarmly,\nCustomer Support Team`;
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

    if (apiKey && apiKey.trim().length > 5 && !apiKey.includes("your_gemini")) {
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
        console.warn("Gemini generation failed, falling back to contextual generator:", errMsg);
        aiResponse = generateContextualFallback(customerMessage, selectedTone, extraInstructions);
      }
    } else {
      // Immediate contextual fallback when API key is not yet provided
      aiResponse = generateContextualFallback(customerMessage, selectedTone, extraInstructions);
    }

    // Guest Mode: If user is not signed in, return the reply immediately
    if (!user) {
      return NextResponse.json({
        reply: aiResponse,
        saved: null,
        isGuest: true,
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
      console.warn("Warning saving reply to Supabase:", dbError.message);
      return NextResponse.json({
        reply: aiResponse,
        saved: null,
        warning: "Reply generated, but could not save to history.",
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
