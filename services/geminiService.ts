import { GoogleGenAI } from "@google/genai";
import { Transaction, DashboardStats, Language } from "../types";

export const generateFinancialTip = async (
  transactions: Transaction[], 
  stats: DashboardStats,
  language: Language,
  currency: string
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Construct prompt
    const prompt = `
You are a financial assistant.
User summary:
- Income: ${stats.totalIncome} ${currency}
- Expense: ${stats.totalExpense} ${currency}
- Balance: ${stats.balance} ${currency}

Give ONE short, practical financial tip.
No greeting. No emojis. Simple language.
Language: ${language === 'bn' ? 'Bengali' : 'English'}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    return response.text || (language === 'bn' ? "পরামর্শ পাওয়া যায়নি।" : "No tip available.");

  } catch (error) {
    console.error("Error generating financial tip:", error);
    return language === 'bn' 
      ? "AI টিপ লোড করতে পারিনি। পরে চেষ্টা করুন।" 
      : "Could not load AI tip. Please try again later.";
  }
};