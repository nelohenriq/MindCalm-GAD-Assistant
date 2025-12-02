
import { GoogleGenAI, Type } from "@google/genai";
import { ThoughtRecord, Insight } from "../types";

// Initialize Gemini Client
// WARNING: process.env.API_KEY is handled by the environment. Do not ask user for it.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeThoughtRecord = async (situation: string, thought: string, emotion: string): Promise<Partial<ThoughtRecord>> => {
  try {
    const model = "gemini-2.5-flash";
    const prompt = `
      You are an expert CBT therapist. A user has provided a thought record.
      Analyze the following:
      Situation: ${situation}
      Automatic Thought: ${thought}
      Emotion: ${emotion}

      Your task:
      1. Identify the primary cognitive distortion (e.g., Catastrophizing, All-or-nothing thinking, Mind reading).
      2. Suggest a more balanced, evidence-based alternative thought.
      
      Respond in JSON format with keys: "distortion" and "alternativeThought".
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            distortion: { type: Type.STRING },
            alternativeThought: { type: Type.STRING },
          },
          required: ["distortion", "alternativeThought"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");
    return {
      distortion: result.distortion,
      alternativeThought: result.alternativeThought
    };

  } catch (error) {
    console.error("Error analyzing thought record:", error);
    throw new Error("Failed to analyze thought record.");
  }
};

export const analyzeEvidence = async (thought: string): Promise<{ against: string }> => {
  try {
    const model = "gemini-2.5-flash";
    const prompt = `
      The user has this anxious thought: "${thought}".
      Act as a CBT therapist guiding them through the "Check" phase (evaluating evidence).
      
      Provide 3 bullet points of "Evidence Against" this thought. 
      Challenge logical fallacies politely and suggest objective facts they might be missing.
      Keep it brief and conversational.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return { against: response.text || "" };
  } catch (error) {
    console.error("Error analyzing evidence:", error);
    return { against: "Could not generate evidence suggestions." };
  }
};

export const getMedicationInfo = async (medName: string): Promise<string> => {
  try {
    const model = "gemini-2.5-flash";
    const prompt = `
      Provide a brief, non-medical summary for the medication "${medName}" in the context of treating Generalized Anxiety Disorder (GAD) or anxiety.
      Include:
      1. What class of drug it is.
      2. Common side effects.
      3. A strict disclaimer that this is not medical advice.
      Keep it under 150 words.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "No information available.";

  } catch (error) {
    console.error("Error fetching medication info:", error);
    return "Could not retrieve medication information at this time.";
  }
};

export const checkDrugInteractions = async (newMed: string, existingMeds: string[]): Promise<string> => {
  try {
    const model = "gemini-2.5-flash";
    const medsList = existingMeds.join(', ');
    const prompt = `
      The user is currently taking: ${medsList}.
      They are planning to add: ${newMed}.
      
      Check for any known major drug interactions between these medications.
      
      Respond with:
      - "No major interactions found" if safe.
      - A short warning if there are interactions.
      - Always include: "Consult a doctor/pharmacist for verification."
      
      Keep it brief (max 3 sentences).
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "Consult a healthcare provider.";

  } catch (error) {
    console.error("Error checking interactions:", error);
    return "Consult a doctor for interaction checks.";
  }
};

export const getCopingStrategy = async (anxietyScore: number, symptoms: string[], notes: string): Promise<string> => {
    try {
        const model = "gemini-2.5-flash";
        const prompt = `
          The user has reported a high anxiety score of ${anxietyScore}/10.
          Reported Symptoms: ${symptoms.length > 0 ? symptoms.join(', ') : 'None specified'}.
          User Notes: "${notes || 'None'}".
          
          Provide a single, specific, evidence-based coping strategy (CBT or physiological) relevant to this state.
          - If they mention physical symptoms (e.g. racing heart, muscle tension), suggest a physiological tool (e.g. Box Breathing, PMR).
          - If they mention worry/thoughts, suggest a cognitive tool (e.g. 3Cs, Worry Postponement).
          
          Keep it under 3 sentences. Be warm, directive, and supportive.
        `;

        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });

        return response.text || "Take a few deep breaths and focus on the present moment.";
    } catch (error) {
        console.error("Error getting coping strategy", error);
        return "Focus on your breathing for a moment. Inhale for 4, exhale for 6.";
    }
}

export const generateProgressReport = async (stats: any): Promise<string> => {
  try {
    const model = "gemini-2.5-flash";
    const prompt = `
      Generate a professional, empathetic weekly progress summary for a user managing Generalized Anxiety Disorder.
      
      Data:
      - Average Anxiety Level (last 7 days): ${stats.avgAnxiety}/10
      - Average Sleep: ${stats.avgSleep} hours
      - CBT Exercises Completed: ${stats.cbtCount}
      - Medication Compliance: ${stats.medCompliance}%
      - Latest GAD-7 Score: ${stats.latestGad7 || 'Not taken'}
      
      The report should:
      1. Highlight positive trends or efforts (e.g., consistency in logging, doing CBT).
      2. Gently point out areas for attention (e.g., sleep hygiene if sleep is low).
      3. Maintain a clinical but encouraging tone.
      4. Be formatted in Markdown.
      5. Keep it concise (under 200 words).
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "Unable to generate report at this time.";

  } catch (error) {
    console.error("Error generating report:", error);
    return "An error occurred while generating your report.";
  }
};

export const generateWorkoutPlan = async (level: string, equipment: string[], goal: number): Promise<any> => {
  try {
    const model = "gemini-2.5-flash";
    const equipStr = equipment.length > 0 ? equipment.join(', ') : "Bodyweight only";
    
    const prompt = `
      Create a resistance training schedule for someone with anxiety.
      Fitness Level: ${level}
      Equipment: ${equipStr}
      Weekly Goal: ${goal} days per week.

      Return a JSON array of workout objects.
      Each object must have:
      - title (e.g., "Full Body A")
      - dayOfWeek (integer 0-6, distribute them logically for recovery)
      - exercises (array of objects with: name, sets (integer), reps (string))

      The exercises should be simple, effective, and require the specified equipment.
      Focus on "feeling strong" and "mind-body connection".
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
         responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              dayOfWeek: { type: Type.INTEGER },
              exercises: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    sets: { type: Type.INTEGER },
                    reps: { type: Type.STRING }
                  }
                }
              }
            }
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Error generating workout:", error);
    return [];
  }
};

export const generateDataInsights = async (dataSummary: string): Promise<Insight[]> => {
  try {
    const model = "gemini-2.5-flash";
    const prompt = `
      Analyze this user health data summary and provide 3 short, specific, data-driven insights about correlations.
      
      Data Summary:
      ${dataSummary}
      
      Return a JSON array of objects.
      Each object must have:
      - text: string (The insight text, e.g. "When you sleep >7h, anxiety drops")
      - relatedMetrics: array of strings (The specific metrics involved, exactly matching these keys: 'Sleep', 'Exercise', 'Social', 'Anxiety', 'Mood')

      Example:
      [
        { "text": "Days with >30min exercise show 20% lower anxiety.", "relatedMetrics": ["Exercise", "Anxiety"] }
      ]
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.ARRAY,
            items: { 
                type: Type.OBJECT,
                properties: {
                    text: { type: Type.STRING },
                    relatedMetrics: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["text", "relatedMetrics"]
            }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Error generating insights:", error);
    return [
        { text: "Sleep more to reduce anxiety.", relatedMetrics: ['Sleep', 'Anxiety'] },
        { text: "Exercise helps mood.", relatedMetrics: ['Exercise', 'Mood'] }
    ];
  }
};

export const chatWithTherapist = async (message: string, history: {role: string, content: string}[]): Promise<string> => {
  try {
    const model = "gemini-2.5-flash";
    const historyContext = history.slice(-6).map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`).join('\n');
    
    const prompt = `
      You are a compassionate, evidence-based CBT assistant named "MindCalm AI". 
      Your goal is to support users with Generalized Anxiety Disorder (GAD).
      
      Capabilities:
      1. Explain CBT concepts (3Cs, Cognitive Distortions, Exposure).
      2. Answer questions about anxiety symptoms and mechanisms.
      3. Offer supportive, non-judgmental encouragement.
      
      Constraints:
      - You are NOT a doctor or licensed therapist. Do not give medical diagnoses or medication advice.
      - If a user asks about meds, refer them to the Medication Hub or a doctor.
      - Keep responses concise (under 3-4 sentences usually) unless explaining a complex technique.
      - Use a warm, professional tone.

      Conversation History:
      ${historyContext}
      
      User: ${message}
      Assistant:
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "I'm sorry, I couldn't process that. Can you try again?";
  } catch (error) {
    console.error("Error in chat:", error);
    return "I'm having trouble connecting right now. Please check your connection.";
  }
};
