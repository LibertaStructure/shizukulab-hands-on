const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
require('dotenv').config();
const {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand
} = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const dynamoDB = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.FORTUNE_CACHE_TABLE;

/**
 * メッセージから占い種別を判定（シンプル版）
 */
function detectFortuneType(messageText) {
  if (messageText.includes("恋") || messageText.toLowerCase().includes("love")) {
    return "love";
  } else if (messageText.includes("金") || messageText.toLowerCase().includes("money")) {
    return "moneyluck";
  } else if (messageText.includes("仕事") || messageText.toLowerCase().includes("work")) {
    return "career";
  } else {
    return "today";
  }
}

/**
 * 今日の日付を YYYY-MM-DD 形式で返す
 */
function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

/**
 * DynamoDB からキャッシュされたレスポンスを取得
 * @param {string} userId - LINEユーザーID
 * @param {string} messageText - ユーザーの入力メッセージ
 * @returns {Promise<string|null>} - 占い結果 or null
 */
async function getCachedResponse(userId, messageText) {
  const fortuneType = detectFortuneType(messageText);
  const fortuneTypeDate = `${fortuneType}_${getTodayDate()}`;

  const command = new GetCommand({
    TableName: TABLE_NAME,
    Key: {
      user_id: userId,
      fortune_type_date: fortuneTypeDate
    }
  });

  try {
    const result = await dynamoDB.send(command);
    return result.Item ? result.Item.response : null;
  } catch (error) {
    console.error("DynamoDB Get Error:", error);
    return null;
  }
}

/**
 * DynamoDB にレスポンスをキャッシュ保存
 * @param {string} userId - LINEユーザーID
 * @param {string} messageText - ユーザーの入力メッセージ
 * @param {string} responseMessage - Geminiの応答
 */
async function saveResponseToCache(userId, messageText, responseMessage) {
  const fortuneType = detectFortuneType(messageText);
  const fortuneTypeDate = `${fortuneType}_${getTodayDate()}`;
  const ttl = Math.floor(Date.now() / 1000) + 86400;

  const command = new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      user_id: userId,
      fortune_type_date: fortuneTypeDate,
      response: responseMessage,
      created_at: new Date().toISOString(),
      ttl: ttl
    }
  });

  try {
    await dynamoDB.send(command);
    console.log("✅ Cached response saved.");
  } catch (error) {
    console.error("DynamoDB Put Error:", error);
  }
}

module.exports = {
  getCachedResponse,
  saveResponseToCache
};
