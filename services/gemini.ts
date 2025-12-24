import { GoogleGenAI } from "@google/genai";
import { CareLog } from '../types';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const generateCatAdvice = async (logs: CareLog[]): Promise<string> => {
  const client = getClient();
  if (!client) {
    return "請設定 API Key 以啟用貓咪小助手功能 (模擬回應：RURU 跟 CCL 記得多陪我玩！)";
  }

  // Get last 7 days of logs for context
  const recentLogs = logs.slice(0, 20).map(log => ({
    date: new Date(log.timestamp).toLocaleString('zh-TW'),
    author: log.author || '家人',
    actions: log.actions
  }));

  const prompt = `
    你是一隻優雅、有點傲嬌的灰色英國長毛貓的管家（或者你就是那隻貓）。
    請根據以下最近的照顧記錄，給主人 (RURU 和 CCL) 一段簡短、幽默或溫馨的建議。
    
    最近記錄:
    ${JSON.stringify(recentLogs, null, 2)}
    
    規則：
    1. 提到 RURU 或 CCL 誰做得比較多，給予稱讚。
    2. 如果大家都做很好，就撒嬌一下。
    3. 如果發現這幾天清貓砂頻率低，優雅地抱怨一下。
    4. 字數控制在 100 字以內，繁體中文。
    5. 語氣要符合英國長毛貓的高貴慵懶形象。
  `;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "貓咪正在理毛，暫時無法回應...";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "貓咪小助手連線失敗，請稍後再試。";
  }
};