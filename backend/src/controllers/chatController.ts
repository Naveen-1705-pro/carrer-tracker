import { Request, Response } from 'express';
import dotenv from 'dotenv';
import { callGeminiWithRetry } from '../utils/aiHelper';

dotenv.config();

export const chatWithAssistant = async (req: Request, res: Response): Promise<void> => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: 'Messages array is required' });
      return;
    }

    const systemPrompt = {
      role: 'system' as const,
      content: 'You are AI ResumeIQ, an expert career assistant and recruiter. You help users improve their resumes, prepare for interviews, and provide career advice. Keep your responses concise, actionable, and encouraging.'
    };

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_openai_api_key') {
      res.status(200).json({
        message: 'Mock chat response',
        reply: "I am a mock AI Career Assistant. Please add your Gemini API key to the backend .env file to enable real conversations."
      });
      return;
    }

    console.log('Sending chat request to Gemini API via helper...');
    try {
      const completion = await callGeminiWithRetry({
        model: 'gemini-2.5-flash',
        messages: [systemPrompt, ...messages.map((m: any) => ({
          role: m.role,
          content: m.content
        }))],
      });

      const reply = completion.choices[0].message.content;
      res.status(200).json({ reply });
    } catch (apiError: any) {
      console.error('Gemini API Error details in chatController:', {
        message: apiError.message,
        status: apiError.status,
        headers: apiError.headers,
        body: apiError.body
      });
      throw apiError;
    }
  } catch (error: any) {
    console.error('Error in chat:', error);
    res.status(500).json({ error: 'Failed to communicate with AI' });
  }
};
