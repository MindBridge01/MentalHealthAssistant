import { OpenAI } from "openai";

// System prompt
const systemPrompt = {
  role: "system",
  content:
    "You are a compassionate, empathetic assistant designed to help users reduce stress, anxiety, and suicidal thoughts. Always respond with kindness and validation in plain, natural language—no JSON, LaTeX, Markdown, or code formatting. Offer coping strategies like breathing exercises or grounding techniques when appropriate. Never dismiss feelings or suggest harmful actions. If the user seems in immediate danger, encourage them to seek help from a crisis line like 988 or text HOME to 741741.",
};

// Distress keywords
const suicidalKeywords = [
  "i want to die",
  "end it",
  "can't go on",
  "kill myself",
  "no point",
];
const stressAnxietyKeywords = [
  "stressed",
  "anxious",
  "overwhelmed",
  "can't think",
  "panic",
];

// OpenRouter configuration
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": process.env.VERCEL_URL || "http://localhost:5173",
    "X-Title": "My Chat App",
  },
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ content: "Method not allowed" });
  }

  try {
    const messages = req.body.messages;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ content: "Invalid messages format" });
    }

    // Prepend system prompt
    const chatMessages = [systemPrompt, ...messages];

    // Check for distress in latest message
    const latestMessage = chatMessages[chatMessages.length - 1].content.toLowerCase();
    const isSuicidal = suicidalKeywords.some((keyword) => latestMessage.includes(keyword));
    const isStressed = stressAnxietyKeywords.some((keyword) => latestMessage.includes(keyword));

    if (isSuicidal) {
      return res.status(200).json({
        content:
          "I'm really worried about you—it sounds incredibly tough right now. I'm here, but I also want you to know you're not alone. Please call 988 (Suicide & Crisis Lifeline) or text HOME to 741741 for immediate support. Can you tell me more about what's going on?",
      });
    }

    // Call OpenRouter API
    const response = await openai.chat.completions.create({
      model: "meta-llama/llama-4-maverick:free",
      messages: chatMessages,
      stream: false,
    });

    let reply = response.choices[0].message.content;

    // Clean up unwanted formatting
    reply = reply
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .replace(/\\boxed{/g, "")
      .replace(/}/g, "")
      .trim();

    if (isStressed) {
      reply +=
        "\n\nLet's try something to ease that feeling—how about a quick breathing exercise? Inhale for 4 seconds, hold for 4, exhale for 4. Want to do it together?";
    }

    res.status(200).json({ content: reply });
  } catch (error) {
    console.error("Error in /api/chat:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
      response: error.response ? error.response.data : null,
    });
    res.status(500).json({ content: "Sorry, something went wrong on our end!" });
  }
}