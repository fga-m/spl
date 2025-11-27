import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisStats, AiInsight } from "../types";

export const analyzeEventWithGemini = async (
  filename: string,
  stats: AnalysisStats
): Promise<AiInsight> => {
  
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    console.warn("API Key is missing. Skipping AI analysis.");
    return {
      eventName: filename,
      eventDate: "Unknown Date",
      summary: "AI analysis unavailable. Please configure the API_KEY environment variable.",
      complianceNote: "Integration requires a valid Gemini API key."
    };
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    I have an SPL (Sound Pressure Level) log file.
    
    Filename: "${filename}"
    
    Log Statistics:
    - Average SPL: ${stats.averageSpl.toFixed(2)} dB
    - Max SPL: ${stats.maxSpl.toFixed(2)} dB
    - Max SPL before 10am: ${stats.maxSplBefore10am ? stats.maxSplBefore10am.value + ' dB' : 'None'}
    - Duration: ${stats.durationString}

    Task:
    1. Extract the "Event Name" and "Event Date" strictly from the Filename provided above. 
       - Look for dates like "2023-10-25" or "Oct 25".
       - Look for event descriptors like "Sunday Service", "Concert", "FOH".
       - Example: "2023-11-12 Sunday Service.txt" -> Event: "Sunday Service", Date: "2023-11-12".
       - If no date is found in filename, return "Unknown Date".
       - If no event name is found in filename, return the Filename itself (without extension).
    2. Provide a 1-sentence summary of the loudness profile based on the stats.
    3. Provide a brief "Compliance Note" (e.g. OSHA limits, concert norms).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            eventName: { type: Type.STRING, description: "The extracted event name from the filename" },
            eventDate: { type: Type.STRING, description: "The extracted date from the filename" },
            summary: { type: Type.STRING, description: "A one sentence summary of the loudness profile" },
            complianceNote: { type: Type.STRING, description: "A brief note on noise level safety or norms" }
          },
          required: ["eventName", "eventDate", "summary", "complianceNote"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as AiInsight;

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    // Fallback if AI fails
    return {
      eventName: filename,
      eventDate: "Unknown Date",
      summary: "Analysis unavailable.",
      complianceNote: "Could not generate compliance insights."
    };
  }
};