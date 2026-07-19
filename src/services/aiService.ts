export interface ExtractedQuestion {
  text: string;
  topic?: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string;
  points: number;
}

// Resilient fetch helper to automatically retry on transient 404 or 5xx starting/restarting states
async function fetchWithRetry(url: string, options: RequestInit, retries: number = 3, delayMs: number = 1500): Promise<Response> {
  let lastError: Error | null = null;
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        return response;
      }
      
      // If server returned 404 or 502/503/504 (indicating possible restart or server spin-up), retry
      if (response.status === 404 || response.status >= 500) {
        console.warn(`Request to ${url} failed with status ${response.status}. Retrying (${i + 1}/${retries}) in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        continue;
      }
      
      // For normal client status (e.g. 400 Bad Request, validation errors), return immediately
      return response;
    } catch (err) {
      console.warn(`Request to ${url} caught network/connection error:`, err);
      lastError = err instanceof Error ? err : new Error(String(err));
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  throw lastError || new Error(`Network failure: Request to ${url} failed after ${retries} attempts.`);
}

export async function extractQuestionsFromText(text: string): Promise<ExtractedQuestion[]> {
  try {
    const response = await fetchWithRetry("/api/ai/extract-questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    }, 3, 2000);

    if (!response.ok) {
      let errorMessage = "Failed to extract questions";
      const contentType = response.headers.get("Content-Type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } else {
        const htmlText = await response.text();
        if (htmlText.includes("<!doctype") || htmlText.includes("<html")) {
          errorMessage = `Network Error (${response.status}): The server encountered an issue or is currently restarting. Please try again.`;
        } else {
          errorMessage = htmlText.substring(0, 150) || `Server Error: ${response.statusText}`;
        }
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("AI Extraction failed:", error);
    throw error;
  }
}

export async function generateQuestionsFromTopic(
  topic: string, 
  count: number, 
  subject: string, 
  grade: string,
  difficulty: string = "Medium"
): Promise<ExtractedQuestion[]> {
  try {
    const response = await fetchWithRetry("/api/ai/generate-questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, count, subject, grade, difficulty }),
    }, 3, 2000);

    if (!response.ok) {
      let errorMessage = "Failed to generate questions";
      const contentType = response.headers.get("Content-Type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } else {
        const htmlText = await response.text();
        if (htmlText.includes("<!doctype") || htmlText.includes("<html")) {
          errorMessage = `Network Error (${response.status}): The server encountered an issue or is currently restarting. Please try again.`;
        } else {
          errorMessage = htmlText.substring(0, 150) || `Server Error: ${response.statusText}`;
        }
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("AI Generation failed:", error);
    throw error;
  }
}

export async function generateImprovementTips(incorrectQuestions: any[], subject: string): Promise<string> {
  try {
    const response = await fetchWithRetry("/api/ai/improvement-tips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ incorrectQuestions, subject }),
    }, 3, 1500);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to generate tips");
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error("Feedback AI Error:", error);
    return "Keep studying! Focus on reviewing the core concepts of this subject to improve your score next time.";
  }
}
