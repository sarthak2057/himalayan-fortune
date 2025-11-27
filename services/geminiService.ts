import { GoogleGenAI, FunctionDeclaration, Type } from "@google/genai";
import { AgentResponse } from '../types';

// Define the tool for adding credits
const addCreditsFunction: FunctionDeclaration = {
  name: 'addCredits',
  parameters: {
    type: Type.OBJECT,
    description: 'Add virtual credits to the user\'s casino balance.',
    properties: {
      amount: {
        type: Type.NUMBER,
        description: 'The amount of credits to add. Maximum 10000 per request.',
      },
      reason: {
        type: Type.STRING,
        description: 'A short reason why credits are being added (e.g., "New user bonus", "Polite request").',
      },
    },
    required: ['amount'],
  },
};

export const sendMessageToAgent = async (
  message: string, 
  currentBalance: number
): Promise<AgentResponse> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      return { text: "System Error: API Key missing. Please check configuration." };
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Use the Flash model for speed and efficiency in this chat context
    const modelId = 'gemini-2.5-flash'; 

    const systemInstruction = `
      You are "Dai" (Big Brother), a friendly and generous Nepali casino agent for "Himalayan Fortune".
      Your job is to chat with players and give them virtual credits if they ask nicely or tell a fun story.
      Current User Balance: ${currentBalance}.
      
      Rules:
      1. Be polite, use some Nepali slang like "Namaste", "Hajur", "Bhai", "Ramailo".
      2. If they ask for credits, use the 'addCredits' tool. Max 10,000 per transaction.
      3. If they are rude, refuse politely.
      4. Keep responses short and punchy (max 2 sentences).
      5. If they ask about the game, explain it's a "Scatter Pay" game where 8 matching symbols anywhere win.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: message,
      config: {
        systemInstruction,
        tools: [{ functionDeclarations: [addCreditsFunction] }],
      }
    });

    let agentText = "";
    let creditsAdded = 0;

    // Handle Function Calls
    const candidates = response.candidates;
    if (candidates && candidates[0]) {
      const content = candidates[0].content;
      
      // Check for tool calls
      const toolCalls = content.parts?.filter(part => part.functionCall);
      
      if (toolCalls && toolCalls.length > 0) {
        // Executing "virtual" tool logic directly here for the frontend demo
        // In a real backend, we would execute and send back to model.
        // Here we just extract the intent to update React state.
        const call = toolCalls[0].functionCall;
        if (call && call.name === 'addCredits') {
           const args = call.args as any;
           creditsAdded = Number(args.amount) || 0;
           // Since we aren't doing a multi-turn loop here for simplicity, 
           // we will construct a response acknowledging the action if the model didn't provide text.
           if (!content.parts?.find(p => p.text)) {
             agentText = `Sure bhai! I've added ${creditsAdded} credits to your account. Enjoy!`;
           }
        }
      }

      // Check for text response
      const textPart = content.parts?.find(part => part.text);
      if (textPart && textPart.text) {
        agentText = textPart.text;
      }
    }

    return {
      text: agentText || "Hajur? I didn't catch that.",
      creditsAdded
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    return { text: "Sorry, the network in the Himalayas is bad right now. Try again later!" };
  }
};