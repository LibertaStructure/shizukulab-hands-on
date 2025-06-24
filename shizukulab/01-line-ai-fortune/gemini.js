//const { getCachedResponse, saveResponseToCache } = require("./dynamo");
const axios = require("axios");
require('dotenv').config();


// **環境変数の取得**
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // ✅ Gemini API の API キー
const GEMINI_API_URL = process.env.GEMINI_API_URL; // ✅ Gemini URL


/**
 * Gemini API を使用して占いの応答を生成（キャッシュ対応）
 * 
 * @param {string} userId - ユーザーID
 * @param {string} userMessage - ユーザーの入力メッセージ
 * @returns {Promise<string>} - Gemini API が生成した応答メッセージ（キャッシュを利用）
 */
async function generateGeminiResponse(userId, userMessage) {
    try {
        console.log(`Checking cache for message: ${userMessage}`);

        // **キャッシュをチェック**
        //const cachedResponse = await getCachedResponse(userId, userMessage);
        //if (cachedResponse) {
        //    console.log("Returning cached response:", cachedResponse);
        //    return cachedResponse;
        //}

        console.log(`Sending request to Gemini API with message: ${userMessage}`);

        // **Gemini API へリクエスト**
        const response = await axios.post(
            `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
            {
                contents: [{ 
                    role: "user", parts: [
                        { text: `あなたは占い師です。「${userMessage}」について占って下さい。` }
                    ] 
                }],
                generationConfig: {
                    maxOutputTokens: 50,
                    temperature: 0.7
                }
            },
            { headers: { "Content-Type": "application/json" }, timeout: 3000 }
        );

        console.log("Gemini API Full Response:", JSON.stringify(response.data, null, 2));

        if (!response.data || 
            !response.data.candidates || 
            response.data.candidates.length === 0) 
            {
            throw new Error("Gemini API のレスポンスが空です。");
        }

        const responseMessage = response.data.candidates[0].content.parts[0].text.trim();

        // **キャッシュに保存**
        //await saveResponseToCache(userId, userMessage, responseMessage);

        return responseMessage;
    } catch (error) {
        console.error("Gemini API Error:", error.response?.data || error.message);
        return "現在、占いができません。後で試してください。";
    }
}

// **エクスポート**
module.exports = { generateGeminiResponse };
