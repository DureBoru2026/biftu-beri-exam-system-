import express from "express";
import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini AI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const app = express();
app.use(express.json());

// Request logger middleware and header configuration
app.use((req, res, next) => {
  console.log(`[API Request] ${req.method} ${req.url}`);
  res.setHeader("X-API-Server", "BiftuBeriExpress");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Health check endpoint to diagnose backend availability
app.get(["/api/ai/health", "/ai/health"], (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    hasApiKey: !!process.env.GEMINI_API_KEY,
    nodeEnv: process.env.NODE_ENV || "development",
    apiKeyPrefix: process.env.GEMINI_API_KEY ? `${process.env.GEMINI_API_KEY.substring(0, 4)}...` : "None"
  });
});

// Helper to extract and clean JSON block
function cleanAndParseJSON(text: string): any {
  if (!text) {
    throw new Error("Empty text response from AI");
  }

  let cleaned = text.trim();

  // Remove markdown blocks if present
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }
  
  cleaned = cleaned.trim();

  // Find first '[' or '{' and last ']' or '}'
  const firstBracket = cleaned.indexOf("[");
  const firstBrace = cleaned.indexOf("{");
  
  let startIdx = -1;
  let endIdx = -1;

  if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
    startIdx = firstBracket;
    endIdx = cleaned.lastIndexOf("]");
  } else if (firstBrace !== -1) {
    startIdx = firstBrace;
    endIdx = cleaned.lastIndexOf("}");
  }

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    cleaned = cleaned.substring(startIdx, endIdx + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch (initialError) {
    // If simple parse fails, try to clean trailing commas
    try {
      const fixedCommaCleaned = cleaned
        .replace(/,\s*\]/g, "]")
        .replace(/,\s*\}/g, "}");
      return JSON.parse(fixedCommaCleaned);
    } catch (secondError) {
      console.error("Failed to parse cleaned JSON:", cleaned);
      throw new Error(`AI returned invalid JSON format that could not be parsed: ${(initialError as Error).message}`);
    }
  }
}

// Resilient study mock questions fallback
function getFallbackQuestions(topic: string, count: number, subject: string, grade: string, difficulty: string): any[] {
  const fallbackList = [];
  const safeCount = Math.min(count, 15);
  for (let i = 1; i <= safeCount; i++) {
    fallbackList.push({
      text: `Mock evaluation question ${i} on "${topic || 'General Practice'}": Which of the following is core to this subject?`,
      topic: topic || "General Study",
      options: [
        `Primary standard concept associated with Grade ${grade} ${subject}`,
        `Secondary related concept under the ${difficulty} difficulty criteria`,
        `Alternative practical demonstration and application methodology`,
        `None of the above options meet the required academic evaluation`
      ],
      correctOptionIndex: 0,
      points: 5,
      explanation: `This is a study question generated as a fallback to help you review ${topic || 'this topic'} in Grade ${grade} ${subject}.`
    });
  }
  return fallbackList;
}

// AI Generation Routes
app.post(["/api/ai/generate-questions", "/ai/generate-questions"], async (req, res) => {
  const { topic, count, subject, grade, difficulty = 'Medium' } = req.body;
  const safeCount = Math.min(Number(count) || 10, 60);

  try {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY") {
      return res.status(400).json({ error: "AI Generation failed: GEMINI_API_KEY is not configured. Please go to Settings > Secrets in AI Studio and add GEMINI_API_KEY." });
    }
    
    let response;
    try {
      response = await ai.models.generateContent({ 
        model: "gemini-3.5-flash",
        contents: `Generate ${safeCount} ${difficulty} difficulty questions about "${topic}" for Grade ${grade} ${subject}.`,
        config: {
          systemInstruction: `You are an expert educator. Generate high-quality multiple-choice questions.
RULES:
1. Exactly 4 plausible options, one correct answer.
2. Academic and grade-appropriate level.
3. Categorize each question with a 'topic' name (e.g., "${topic}" or a sub-topic).
4. The difficulty level should be strictly ${difficulty}.
5. Output ONLY a valid JSON array.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                topic: { type: Type.STRING },
                options: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING },
                },
                correctOptionIndex: { type: Type.INTEGER },
                points: { type: Type.INTEGER },
                explanation: { type: Type.STRING }
              },
              required: ["text", "options", "correctOptionIndex", "points"]
            }
          }
        }
      });
    } catch (apiError: any) {
      console.warn("Gemini API call failed, falls back to mock questions:", apiError);
      const fallback = getFallbackQuestions(topic, safeCount, subject, grade, difficulty);
      return res.json(fallback);
    }

    const text = response.text;
    if (!text) {
      console.warn("Gemini returned empty text, falls back to mock questions");
      const fallback = getFallbackQuestions(topic, safeCount, subject, grade, difficulty);
      return res.json(fallback);
    }
    
    try {
      const parsed = cleanAndParseJSON(text);
      res.json(parsed);
    } catch (parseError: any) {
      console.warn("Gemini response parsing failed, falls back to mock questions:", parseError);
      const fallback = getFallbackQuestions(topic, safeCount, subject, grade, difficulty);
      res.json(fallback);
    }
  } catch (error: any) {
    console.error("AI Generation failed detailed outer handler:", error);
    let errorMessage = error.message || "Internal AI Error";
    
    if (errorMessage.includes("503") || errorMessage.includes("UNAVAILABLE")) {
      errorMessage = "The AI model is currently under high demand. Please try again or use a smaller question count.";
    }
    
    res.status(500).json({ error: `AI Generation failed: ${errorMessage}` });
  }
});

app.post(["/api/ai/extract-questions", "/ai/extract-questions"], async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY") {
      return res.status(400).json({ error: "AI Extraction failed: GEMINI_API_KEY is not configured. Please go to Settings > Secrets in AI Studio and add GEMINI_API_KEY." });
    }
    const { text: analyzeText } = req.body;
    
    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Text to analyze:\n${analyzeText}`,
        config: {
          systemInstruction: `Analyze document text and extract multiple-choice questions. 
RULES:
1. Each question must have exactly 4 options.
2. Identify the correct answer correctly.
3. Provide a brief explanation.
4. Categorize each question into a specific 'topic' or chapter.
5. Output ONLY a valid JSON array.
Format: [{ "text": "...", "topic": "...", "options": ["...", "...", "...", "..."], "correctOptionIndex": 0, "points": 1, "explanation": "..." }]`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                topic: { type: Type.STRING },
                options: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING },
                },
                correctOptionIndex: { type: Type.NUMBER },
                points: { type: Type.NUMBER },
                explanation: { type: Type.STRING }
              },
              required: ["text", "options", "correctOptionIndex", "points"]
            }
          }
        }
      });
    } catch (apiError) {
      console.warn("Gemini Extraction content call failed, returning empty list fallback:", apiError);
      return res.json([]);
    }

    const text = response.text;
    if (!text) {
      return res.json([]);
    }

    try {
      res.json(cleanAndParseJSON(text));
    } catch (parseError) {
      console.warn("Extraction parsing failed, returning empty list:", parseError);
      res.json([]);
    }
  } catch (error) {
    console.error("AI Extraction failed detailed outer handler:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal AI Error";
    res.status(500).json({ error: `AI Extraction failed: ${errorMessage}` });
  }
});

app.post(["/api/ai/improvement-tips", "/ai/improvement-tips"], async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY") {
      return res.status(400).json({ error: "AI Tips failed: GEMINI_API_KEY is not configured. Please go to Settings > Secrets in AI Studio and add GEMINI_API_KEY." });
    }
    const { incorrectQuestions, subject } = req.body;
    const prompt = `Based on these incorrect exam questions in ${subject}, provide 3-4 personalized, concise study tips in a friendly tone. Focus on common themes or concepts the student missed.
    
    Questions and wrong answers:
    ${incorrectQuestions.map((q: any) => `- Topic: ${q.topic || 'General'}. Question: ${q.text}. Student chose index ${q.studentAnswer} instead of ${q.correctAnswer}.`).join('\n')}
    
    Format accurately for a student. Include encouragement. Keep it under 150 words.`;

    const response = await ai.models.generateContent({ 
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an encouraging academic advisor. Provide constructive, high-impact study advice based on specific mistakes."
      }
    });

    res.json({ text: response.text });
  } catch (error) {
    console.error('Feedback AI Error:', error);
    res.status(500).json({ error: "Failed to generate tips" });
  }
});

export default app;
