const { generateGeminiResponse } = require("./gemini");
const { sendLineReply, sendLinePushMessage } = require("./line");
const { FORTUNE_KEYWORDS } = require("./config");

/**
 * Lambda のメインハンドラー関数
 * 受信したメッセージの内容を判定し、Gemini API か L Message に送信する
 * 
 * @param {object} event - AWS Lambda に送信されたイベントデータ
 * @returns {object} - HTTPレスポンス
 */
exports.handler = async (event) => {
    try {
        console.log("📥 Received event:", JSON.stringify(event, null, 2));

        // **リクエストのバリデーション**
        if (!event.body) {
            console.error("🚨 Error: event.body is undefined");
            return { statusCode: 400, body: JSON.stringify({ error: "Invalid request, body is missing" }) };
        }

        const body = JSON.parse(event.body);
        if (!body.events || body.events.length === 0) {
            return { statusCode: 200, body: JSON.stringify({ message: "No events" }) };
        }

        // **最初のイベントデータを取得**
        const eventData = body.events[0];

        // **メッセージが存在しない場合のエラーハンドリング**
        if (!eventData.message || !eventData.message.text || !eventData.replyToken) {
            console.error("🚨 Error: Invalid event data", JSON.stringify(eventData, null, 2));
            return { statusCode: 400, body: JSON.stringify({ error: "Invalid event data" }) };
        }

        const userMessage = eventData.message.text;
        const replyToken = eventData.replyToken;
        let userId = eventData.source?.userId || "unknown";  

        console.log(`💬 User message: ${userMessage}`);
        console.log(`🔄 Reply Token: ${replyToken}`);
        console.log(`👤 User ID: ${userId}`);

        // **占いのキーワードかどうかを判定**
        if (FORTUNE_KEYWORDS.some(keyword => userMessage.includes(keyword))) {
            console.log("🔮 Fortune-related message detected. Fetching Gemini API response...");

            // **占いなら Gemini API で応答**
            const responseMessage = await generateGeminiResponse(userId, userMessage);
            console.log(`✨ Generated Response: ${responseMessage}`);

            // **LINE に返信 → replyToken で送信、失敗したら pushMessage を使う**
            await sendLineReply(replyToken, responseMessage, userId);
        } else {
            // キーワード以外
            return { statusCode: 200, body: JSON.stringify({ message: "No keyword" }) };
        }

        return { statusCode: 200, body: JSON.stringify({ message: "Webhook processed" }) };
    } catch (error) {
        console.error("❌ Lambda Error:", error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
