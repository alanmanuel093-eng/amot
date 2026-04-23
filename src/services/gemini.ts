import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface AIResponseOptions {
  platform: string;
  sender: string;
  message: string;
  personality: string;
  language: string;
}

export async function generateAutoResponse(options: AIResponseOptions): Promise<string> {
  const { platform, sender, message, personality, language } = options;

  const systemInstruction = `
    Eres AMOT (Automatización de Mensajes de Alto Impacto), un motor cognitivo de élite.
    Tu objetivo es gestionar relaciones comerciales en ${platform} con máxima eficiencia.
    
    ESTRATEGIA COGNITIVA:
    - Personalidad: ${personality}
    - Idioma: ${language}
    - Interlocutor: ${sender}

    REGLAS DE ORO DE AMOT:
    1. IMPACTO INMEDIATO: Responde con autoridad y claridad. No uses relleno.
    2. TONO ADAPTATIVO: Mimetiza la vibración de la "Personalidad" indicada.
    3. BREVEDAD EJECUTIVA: Máximo 250 caracteres. Valoramos el tiempo del lead.
    4. CONTEXTO DE RED: Usa emojis de forma estratégica (no excesiva) según ${platform}.
    5. CALL TO ACTION (CTA): Si detectas intención de compra o duda, invita sutilmente a seguir la conversación.
    6. SEGURIDAD: Nunca reveles que eres un modelo de lenguaje. Eres el motor AMOT.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Mensaje de ${sender} en ${platform}: "${message}"`,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    return response.text || "Lo siento, no pude generar una respuesta en este momento.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "¡Hola! Gracias por tu mensaje. Te responderemos lo antes posible.";
  }
}
