import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({ 
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});

interface CompletionOptions {
  model?: string;
  messages: OpenAI.Chat.ChatCompletionMessageParam[];
  response_format?: { type: 'json_object' };
}

export const callGeminiWithRetry = async (
  options: CompletionOptions,
  retries = 3,
  delayMs = 1500
): Promise<OpenAI.Chat.ChatCompletion> => {
  let lastError: any = null;
  // Try gemini-2.5-flash first, and fallback to gemini-1.5-flash if needed
  const models = [options.model || 'gemini-2.5-flash', 'gemini-1.5-flash'];

  for (const model of models) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`[AI] Calling Gemini API (model: ${model}, attempt: ${attempt}/${retries})...`);
        const completion = await openai.chat.completions.create({
          ...options,
          model,
        });
        console.log(`[AI] Gemini API call succeeded using model: ${model}`);
        return completion;
      } catch (error: any) {
        lastError = error;
        console.warn(`[AI] Gemini API call failed with model ${model} (attempt ${attempt}/${retries}). Error:`, error.message || error);
        
        // If it's a 400 Bad Request, it's a client error (e.g. payload formatting or safety blocker), 
        // so retrying won't help. Move immediately to the next model.
        if (error.status === 400) {
          console.error("[AI] 400 Bad Request received. Skipping to next model/fallback.");
          break;
        }

        // Wait with exponential backoff before the next attempt
        if (attempt < retries) {
          const waitTime = delayMs * Math.pow(2, attempt - 1);
          console.log(`[AI] Waiting ${waitTime}ms before retry...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }
    }
  }

  throw lastError || new Error("Failed to call Gemini API after all retries and model fallbacks");
};
