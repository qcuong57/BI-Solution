// index.js
import express from "express";
import fs from "fs";
import admin from "firebase-admin";
import fetch from "node-fetch";
import dotenv from "dotenv";
import { Trino } from "trino-client";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const TRINO_SERVER = process.env.TRINO_SERVER || "http://localhost:8080";
const TRINO_USER = process.env.TRINO_USER || "admin";
const TRINO_CATALOG = process.env.TRINO_CATALOG || "mysql";
const TRINO_SCHEMA = process.env.TRINO_SCHEMA || "ecommerce_bi";

console.log(`[INIT] Starting Chatbot Server on port ${PORT}`);
console.log(`[INIT] Trino: ${TRINO_SERVER}/${TRINO_CATALOG}.${TRINO_SCHEMA}`);

try {
  const serviceAccount = JSON.parse(
    fs.readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT, "utf8")
  );
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://bi-solution-4441c-default-rtdb.asia-southeast1.firebasedatabase.app/`,
  });
  console.log("[Firebase] Connected successfully");
} catch (error) {
  console.error("[Firebase] Initialization failed:", error.message);
}
const db = admin.database();

const trinoClient = Trino.create({
  server: TRINO_SERVER,
  user: TRINO_USER,
});
console.log(`[Trino] Connected to ${trinoClient.server}`);

const log = (type, msg) =>
  console.log(`[${new Date().toISOString()}] [${type}] ${msg}`);

const sendResponse = (res, status, success, message, data = null, error = null) =>
  res.status(status).json({ success, message, data, error });

const runTrinoQuery = async (sqlQuery) => {
  log("TRINO", `Executing: ${sqlQuery}`);
  if (!sqlQuery.toLowerCase().startsWith("select")) {
    throw new Error("Chỉ hỗ trợ câu lệnh SELECT");
  }

  try {
    let response = await fetch(`${TRINO_SERVER}/v1/statement`, {
      method: "POST",
      headers: {
        "X-Trino-User": TRINO_USER,
        "X-Trino-Catalog": TRINO_CATALOG,
        "X-Trino-Schema": TRINO_SCHEMA,
      },
      body: sqlQuery,
    });

    let result = await response.json();
    let data = result.data || [];
    let columns = result.columns?.map((c) => c.name) || [];

    while (result.nextUri) {
      const nextRes = await fetch(result.nextUri);
      result = await nextRes.json();
      if (result.data) data.push(...result.data);
      if (result.columns) columns = result.columns.map((c) => c.name);
    }

    return data.map((row) => {
      const obj = {};
      columns.forEach((c, i) => (obj[c] = row[i]));
      return obj;
    });
  } catch (err) {
    log("ERROR", `Trino query failed: ${err.message}`);
    throw new Error(`Trino Error: ${err.message}`);
  }
};

const openSupersetDashboard = async (dashboardId) => {
  log("SUPERSET", `Opening dashboard ${dashboardId}`);
  return {
    id: dashboardId,
    url: `http://localhost:8088/superset/dashboard/${dashboardId}`,
    name: "Dashboard Doanh thu (Giả lập)",
  };
};

const GEMINI_MODEL = process.env.GEMINI_MODEL;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const GEMINI_SAFETY = [
  { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
];

async function callGemini(prompt) {
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    safetySettings: GEMINI_SAFETY,
  };

  const res = await fetch(GEMINI_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  return json?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}


app.post("/ask", async (req, res) => {
  const { question, userId } = req.body;
  if (!question || !userId) {
    return sendResponse(res, 400, false, "Thiếu question hoặc userId");
  }

  log("USER", `[${userId}] ${question}`);

  try {
    // --- 1️⃣ PHÂN LOẠI CÂU HỎI ---
    const classificationPrompt = `
Bạn là trợ lý BI thông minh. Phân tích câu hỏi và xuất JSON theo dạng sau:

1️⃣ Nếu là câu hỏi về dữ liệu:
{"type":"bi_query","engine":"trino","query":"SELECT ... FROM mysql.ecommerce_bi.table_name ..."}
2️⃣ Nếu muốn mở dashboard:
{"type":"open_dashboard","dashboard_id":"1"}
3️⃣ Nếu là câu hỏi chung:
{"type":"general_query"}

Câu hỏi: "${question}"
`;
    let classificationText = await callGemini(classificationPrompt);
    classificationText = classificationText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let classification;
    try {
      classification = JSON.parse(classificationText);
    } catch {
      classification = { type: "general_query" };
    }

    log("CLASSIFY", JSON.stringify(classification));

    let finalAnswer = "";
    let debugData = {};

    if (classification.type === "bi_query") {
      const query = classification.query;
      try {
        const queryResults = await runTrinoQuery(query);

        const summaryPrompt = `
Câu hỏi: "${question}"
Kết quả dữ liệu: ${JSON.stringify(queryResults)}
=> Tóm tắt ngắn gọn (bằng tiếng Việt, dễ hiểu):`;

        finalAnswer = await callGemini(summaryPrompt);
        debugData = { query, queryResults };
      } catch (err) {
        return sendResponse(res, 500, false, "Lỗi khi chạy truy vấn BI", null, err.message);
      }
    } else if (classification.type === "open_dashboard") {
      const dashboard = await openSupersetDashboard(classification.dashboard_id);
      finalAnswer = `Đã mở dashboard "${dashboard.name}". Xem tại: ${dashboard.url}`;
      debugData = { dashboard };
    } else {
      finalAnswer = await callGemini(question);
    }

    // --- 3️⃣ LƯU FIREBASE ---
    await db.ref(`/chats/${userId}`).push({
      question,
      answer: finalAnswer,
      classification: classification.type,
      createdAt: new Date().toISOString(),
    });

    // --- 4️⃣ PHẢN HỒI ---
    return sendResponse(res, 200, true, {
      answer: finalAnswer,
      type: classification.type,
      debug: debugData,
    });
  } catch (err) {
    log("ERROR", err.message);
    return sendResponse(res, 500, false, "Đã xảy ra lỗi máy chủ", null, err.message);
  }
});

// =======================
// 🚀 START SERVER
// =======================
app.listen(PORT, () => {
  console.log(`[READY] Chatbot API running at http://localhost:${PORT}`);
});
