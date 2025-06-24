const axios = require("axios");
require('dotenv').config();

// **環境変数の取得**
const LINE_ACCESS_TOKEN = process.env.LINE_ACCESS_TOKEN; // ✅ LINE API のアクセストークン

/**
 * LINE に返信メッセージを送信
 * 
 * @param {string} replyToken - LINE の返信トークン
 * @param {string} text - 送信するメッセージ
 * @param {string} userId - LINE ユーザーの ID（プッシュメッセージ用）
 */
async function sendLineReply(replyToken, text, userId) {
    try {
        console.log(`Sending reply message to LINE: ${text}`);

        const url = "https://api.line.me/v2/bot/message/reply";
        const headers = { 
            "Content-Type": "application/json", 
            "Authorization": `Bearer ${LINE_ACCESS_TOKEN}` 
        };
        const payload = { 
            replyToken: replyToken, 
            messages: [{ type: "text", text: text }] 
        };

        const response = await axios.post(url, payload, { headers });

        console.log("LINE API Response:", JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error("LINE API Error:", error.response?.data || error.message);
        if (error.response?.data?.message === "Invalid reply token") {
            console.warn("Reply token expired, sending push message instead.");
            await sendLinePushMessage(userId, text);
        }
    }
}





/**
 * LINE にプッシュメッセージを送信
 * 
 * @param {string} userId - 送信先の LINE ユーザー ID
 * @param {string} text - 送信するメッセージ
 */
async function sendLinePushMessage(userId, text) {
    try {
        console.log(`Sending push message to LINE user ${userId}: ${text}`);

        const url = "https://api.line.me/v2/bot/message/push";
        const headers = { 
            "Content-Type": "application/json", 
            "Authorization": `Bearer ${LINE_ACCESS_TOKEN}` 
        };
        const payload = { 
            to: userId, 
            messages: [{ type: "text", text: text }] 
        };

        await axios.post(url, payload, { headers });
        console.log("Push message sent successfully!");
    } catch (error) {
        console.error("LINE Push API Error:", error.response?.data || error.message);
    }
}

// **エクスポート**
module.exports = {
    sendLineReply,
    sendLinePushMessage
};
