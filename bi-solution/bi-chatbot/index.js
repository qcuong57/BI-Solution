// index.js
import express from "express";
import fs from "fs";
import admin from "firebase-admin";
import fetch from "node-fetch";
import dotenv from "dotenv";
import { Trino } from "trino-client";
import cors from 'cors';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({ origin: 'http://localhost:5173' }))

const PORT = process.env.PORT || 3000;
const TRINO_SERVER = process.env.TRINO_SERVER || "http://localhost:8080";
const TRINO_USER = process.env.TRINO_USER || "admin";
const TRINO_CATALOG = process.env.TRINO_CATALOG || "mysql";
const TRINO_SCHEMA = process.env.TRINO_SCHEMA || "ecommerce_bi";
const SUPERSET_URL = process.env.SUPERSET_URL;
const SUPERSET_ADMIN_USER = process.env.SUPERSET_ADMIN_USER;
const SUPERSET_ADMIN_PASS = process.env.SUPERSET_ADMIN_PASS;

const log = (type, msg) =>
  console.log(`[${new Date().toISOString()}] [${type}] ${msg}`);

const sendResponse = (
  res,
  status,
  success,
  message,
  data = null,
  error = null
) => res.status(status).json({ success, message, data, error });

console.log(`[INIT] Starting Chatbot Server on port ${PORT}`);
console.log(`[INIT] Trino: ${TRINO_SERVER}/${TRINO_CATALOG}.${TRINO_SCHEMA}`);

async function getSupersetToken() {
  log("SUPERSET", "Đang lấy Access Token bằng tài khoản Admin...");
  try {
    const response = await fetch(`${SUPERSET_URL}/api/v1/security/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: SUPERSET_ADMIN_USER,
        password: SUPERSET_ADMIN_PASS,
        provider: "db",
      }),
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.msg || "Không thể lấy token");

    log("SUPERSET", "Lấy Access Token thành công!");
    return json.access_token;
  } catch (err) {
    log("ERROR", `Lỗi Superset Token: ${err.message}`);
    return null;
  }
}

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

const verifyFirebaseToken = async (req, res, next) => {
  log("AUTH", "Verifying token...");
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    log("AUTH", "Failed: Missing or invalid Authorization header");
    return sendResponse(res, 401, false, "Token không hợp lệ hoặc bị thiếu");
  }

  const idToken = authHeader.split("Bearer ")[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    log("AUTH", `Success: Token verified for user ${req.user.uid}`);
    next();
  } catch (error) {
    log("AUTH", `Failed: ${error.message}`);
    return sendResponse(res, 403, false, "Token không hợp lệ hoặc đã hết hạn");
  }
};

const trinoClient = Trino.create({
  server: TRINO_SERVER,
  user: TRINO_USER,
});
console.log(`[Trino] Connected to ${trinoClient.server}`);

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

const openSupersetDashboard = async (dashboardName) => {
  log("SUPERSET", `Đang tìm dashboard tên: ${dashboardName}`);

  const token = await getSupersetToken();
  if (!token) {
    throw new Error("Không thể xác thực với Superset");
  }

  const filterQuery = `(filters:!((col:dashboard_title,opr:ct,value:'${dashboardName}')))`;
  const searchUrl = `${SUPERSET_URL}/api/v1/dashboard/?q=${encodeURIComponent(
    filterQuery
  )}`;

  const response = await fetch(searchUrl, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error("Lỗi khi tìm kiếm dashboard");
  }

  if (json.count === 0) {
    return { name: dashboardName, url: null, found: false };
  }

  const dashboard = json.result[0];
  return {
    name: dashboard.dashboard_title,
    url: `${SUPERSET_URL}${dashboard.url}`,
    found: true,
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

// Hàm retry cho Gemini
async function callGeminiWithRetry(prompt, maxRetries = 2) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await callGemini(prompt);
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      log("WARN", `Gemini retry ${i + 1}/${maxRetries}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

// Validation cho classification
function validateClassification(classification) {
  if (!classification || !classification.type) {
    return { type: "general_query" };
  }
  
  if (classification.type === "bi_query") {
    if (!classification.query || !classification.query.toLowerCase().includes('select')) {
      log("WARN", "Invalid SQL query, fallback to general");
      return { type: "general_query" };
    }
  }
  
  if (classification.type === "open_dashboard") {
    if (!classification.dashboard_name) {
      log("WARN", "Missing dashboard_name, fallback to general");
      return { type: "general_query" };
    }
  }
  
  return classification;
}

app.post("/ask", verifyFirebaseToken, async (req, res) => {
  const { question } = req.body;
  const userId = req.user.uid;
  
  if (!question || !userId) {
    return sendResponse(res, 400, false, "Thiếu question hoặc userId");
  }

  log("USER", `[${userId}] ${question}`);

  try {
    // --- PHÂN LOẠI CÂU HỎI với Schema đầy đủ ---
    const classificationPrompt = `
Bạn là trợ lý BI thông minh phân tích dữ liệu e-commerce.

**SCHEMA DATABASE (mysql.ecommerce_bi):**

📋 **BẢNG CHÍNH:**
1. **customers** (Khách hàng)
   - customer_id (INT) - Mã khách hàng
   - first_name (VARCHAR) - Tên
   - last_name (VARCHAR) - Họ
   - email (VARCHAR) - Email
   - city (VARCHAR) - Thành phố
   - country (VARCHAR) - Quốc gia
   - created_at (TIMESTAMP) - Ngày đăng ký

2. **products** (Sản phẩm)
   - product_id (INT) - Mã sản phẩm
   - product_name (VARCHAR) - Tên sản phẩm
   - category (VARCHAR) - Danh mục (Electronics, Furniture, Home, Accessories)
   - price (DECIMAL) - Giá bán
   - cost (DECIMAL) - Giá vốn

3. **orders** (Đơn hàng)
   - order_id (INT) - Mã đơn hàng
   - customer_id (INT) - Mã khách hàng
   - order_date (DATE) - Ngày đặt hàng
   - status (VARCHAR) - Trạng thái (completed, pending, shipped)
   - total_amount (DECIMAL) - Tổng tiền

4. **order_items** (Chi tiết đơn hàng)
   - order_item_id (INT) - Mã chi tiết
   - order_id (INT) - Mã đơn hàng
   - product_id (INT) - Mã sản phẩm
   - quantity (INT) - Số lượng
   - unit_price (DECIMAL) - Đơn giá

📍 **BẢNG ĐỊA LÝ & PHÂN TÍCH:**
5. **poi_locations** (Điểm bán hàng)
   - poi_id, poi_name, city, country, latitude, longitude

6. **employee_counts** (Số nhân viên)
   - poi_id, employee_count

7. **sales_regions** (Khu vực bán hàng)
   - region_id, region_name, center_latitude, center_longitude, region_geojson

8. **country_region_map** (Ánh xạ quốc gia - khu vực)
   - country, region_name

📊 **VIEW PHÂN TÍCH:**
9. **poi_sales_analysis** - Phân tích doanh số theo điểm bán
10. **sales_region_sales** - Doanh số theo khu vực

**NHIỆM VỤ:** Phân tích câu hỏi và trả về JSON thuần (KHÔNG có markdown, KHÔNG có \`\`\`):

**1️⃣ BI Query** - Khi cần truy vấn dữ liệu:
{"type":"bi_query","engine":"trino","query":"SELECT ... FROM mysql.ecommerce_bi.table_name ..."}

**VÍ DỤ BI QUERY:**
- "Doanh thu hôm nay?" 
  → {"type":"bi_query","engine":"trino","query":"SELECT SUM(total_amount) as doanh_thu FROM mysql.ecommerce_bi.orders WHERE order_date = CURRENT_DATE"}

- "Top 5 sản phẩm bán chạy?"
  → {"type":"bi_query","engine":"trino","query":"SELECT p.product_name, SUM(oi.quantity) as tong_ban FROM mysql.ecommerce_bi.order_items oi JOIN mysql.ecommerce_bi.products p ON oi.product_id = p.product_id GROUP BY p.product_name ORDER BY tong_ban DESC LIMIT 5"}

- "Có bao nhiêu khách hàng?"
  → {"type":"bi_query","engine":"trino","query":"SELECT COUNT(*) as so_khach FROM mysql.ecommerce_bi.customers"}

- "Doanh thu theo danh mục sản phẩm?"
  → {"type":"bi_query","engine":"trino","query":"SELECT p.category, SUM(o.total_amount) as doanh_thu FROM mysql.ecommerce_bi.orders o JOIN mysql.ecommerce_bi.order_items oi ON o.order_id = oi.order_id JOIN mysql.ecommerce_bi.products p ON oi.product_id = p.product_id GROUP BY p.category ORDER BY doanh_thu DESC"}

- "Top 10 khách hàng chi tiêu nhiều nhất?"
  → {"type":"bi_query","engine":"trino","query":"SELECT CONCAT(c.first_name, ' ', c.last_name) as ten_khach, c.email, SUM(o.total_amount) as tong_chi FROM mysql.ecommerce_bi.customers c JOIN mysql.ecommerce_bi.orders o ON c.customer_id = o.customer_id GROUP BY c.customer_id, c.first_name, c.last_name, c.email ORDER BY tong_chi DESC LIMIT 10"}

- "Doanh số theo quốc gia?"
  → {"type":"bi_query","engine":"trino","query":"SELECT c.country, COUNT(DISTINCT o.order_id) as so_don, SUM(o.total_amount) as doanh_thu FROM mysql.ecommerce_bi.customers c JOIN mysql.ecommerce_bi.orders o ON c.customer_id = o.customer_id GROUP BY c.country ORDER BY doanh_thu DESC"}

- "Lợi nhuận theo sản phẩm?"
  → {"type":"bi_query","engine":"trino","query":"SELECT p.product_name, SUM((oi.unit_price - p.cost) * oi.quantity) as loi_nhuan FROM mysql.ecommerce_bi.order_items oi JOIN mysql.ecommerce_bi.products p ON oi.product_id = p.product_id GROUP BY p.product_name ORDER BY loi_nhuan DESC"}

- "Phân tích theo điểm bán?"
  → {"type":"bi_query","engine":"trino","query":"SELECT * FROM mysql.ecommerce_bi.poi_sales_analysis ORDER BY total_sales DESC"}

**2️⃣ Open Dashboard** - Khi yêu cầu mở/xem dashboard:
{"type":"open_dashboard","dashboard_name":"tên dashboard"}

Từ khóa: "mở", "xem", "hiển thị", "cho tôi xem", "dashboard"
VÍ DỤ:
- "Mở dashboard doanh thu" → {"type":"open_dashboard","dashboard_name":"doanh thu"}
- "Cho xem dashboard bán hàng" → {"type":"open_dashboard","dashboard_name":"bán hàng"}

**3️⃣ General Query** - Câu hỏi chung (chào hỏi, hướng dẫn, giải thích):
{"type":"general_query"}

VÍ DỤ: "Xin chào", "Bạn giúp được gì?", "Hệ thống có gì?"

**LƯU Ý QUAN TRỌNG:**
✅ Query phải hợp lệ với Trino SQL
✅ LUÔN dùng tên đầy đủ: mysql.ecommerce_bi.table_name
✅ CHỈ dùng SELECT, KHÔNG INSERT/UPDATE/DELETE
✅ Với ngày: dùng CURRENT_DATE, CURRENT_TIMESTAMP
✅ Với tháng/năm: dùng MONTH(), YEAR(), DATE_TRUNC()
✅ JOIN đúng foreign key: customers ↔ orders ↔ order_items ↔ products
✅ Dùng alias rõ ràng để dễ đọc kết quả

**BÂY GIỜ PHÂN TÍCH CÂU HỎI NÀY:**
Câu hỏi: "${question}"

Trả về JSON thuần, KHÔNG giải thích thêm:`;

    let classificationText = await callGeminiWithRetry(classificationPrompt);
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

    // Validate classification
    classification = validateClassification(classification);
    log("CLASSIFY", JSON.stringify(classification));

    let finalAnswer = "";
    let debugData = {};

    if (classification.type === "bi_query") {
      const query = classification.query;
      try {
        const queryResults = await runTrinoQuery(query);

        const summaryPrompt = `
Bạn là chuyên gia phân tích dữ liệu e-commerce.

**CÂU HỎI:** "${question}"

**DỮ LIỆU THỰC TẾ:**
${JSON.stringify(queryResults, null, 2)}

**YÊU CẦU TRẢ LỜI:**
1. ✅ Trả lời TRỰC TIẾP câu hỏi bằng tiếng Việt
2. ✅ Nêu con số/insight quan trọng nhất TRƯỚC
3. ✅ Nếu có nhiều dữ liệu: tóm tắt top 3-5 kết quả nổi bật
4. ✅ Thêm nhận xét ngắn gọn (nếu cần thiết)
5. ✅ Định dạng dễ đọc (dùng số, bullet points nếu cần)
6. ✅ Làm tròn số tiền (VD: 1,329.98 → 1,330 hoặc 1.33K)
7. ❌ KHÔNG lặp lại câu hỏi
8. ❌ KHÔNG giải thích kỹ thuật

**VÍ DỤ TRẢ LỜI TỐT:**
✅ "Doanh thu hôm nay là 125.5 triệu đồng, tăng 15% so với hôm qua."
✅ "Top 3 sản phẩm bán chạy:
   1. Laptop Pro - 250 đơn
   2. Wireless Mouse - 180 đơn  
   3. Desk Chair - 120 đơn"
✅ "Hiện có 1,234 khách hàng, trong đó 856 là khách VIP (đã mua >5 đơn). Tập trung nhiều ở New York (350 khách) và London (280 khách)."
✅ "Lợi nhuận gộp: 45.2 triệu (margin 35%). Danh mục Electronics đóng góp 60% lợi nhuận."

Trả lời ngắn gọn, súc tích (2-4 câu):`;

        finalAnswer = await callGeminiWithRetry(summaryPrompt);
        debugData = { 
          query, 
          resultCount: queryResults.length,
          sampleData: queryResults.slice(0, 3) // Chỉ show 3 dòng đầu
        };
      } catch (err) {
        return sendResponse(
          res,
          500,
          false,
          "Lỗi khi chạy truy vấn BI",
          null,
          err.message
        );
      }
    } else if (classification.type === "open_dashboard") {
      const dashboardName = classification.dashboard_name;
      const dashboard = await openSupersetDashboard(dashboardName);

      if (dashboard.found) {
        finalAnswer = `Đã tìm thấy dashboard "${dashboard.name}". Bạn có thể xem tại: ${dashboard.url}`;
      } else {
        finalAnswer = `Rất tiếc, tôi không tìm thấy dashboard nào có tên "${dashboardName}". Vui lòng kiểm tra lại tên dashboard hoặc liên hệ quản trị viên.`;
      }
      debugData = { dashboard };
    } else {
      // General query
      const generalPrompt = `
Bạn là trợ lý BI thông minh cho hệ thống e-commerce.

**KHẢ NĂNG CỦA BẠN:**
🔍 Truy vấn dữ liệu:
- Doanh thu, đơn hàng (theo ngày/tháng/năm, theo quốc gia, theo danh mục)
- Sản phẩm (bán chạy, tồn kho, lợi nhuận)
- Khách hàng (số lượng, chi tiêu, phân bố địa lý)
- Phân tích điểm bán hàng (POI) và khu vực

📊 Mở dashboard phân tích:
- Dashboard doanh thu, bán hàng, khách hàng, sản phẩm

💡 Trả lời câu hỏi chung:
- Hướng dẫn sử dụng
- Giải thích về BI, phân tích dữ liệu
- Tư vấn chiến lược kinh doanh

**DỮ LIỆU CÓ SẴN:**
📦 Sản phẩm: Electronics, Furniture, Home, Accessories
🌍 Quốc gia: USA, UK, Canada, Australia, Germany
👥 Khách hàng: 10+ customers với lịch sử mua hàng
📍 Điểm bán: New York, London, Toronto, Sydney, Berlin

Câu hỏi: "${question}"

Trả lời thân thiện, hữu ích bằng tiếng Việt (2-4 câu):`;
      
      finalAnswer = await callGeminiWithRetry(generalPrompt);
    }

    // --- LƯU FIREBASE ---
    await db.ref(`/chats/${userId}`).push({
      question,
      answer: finalAnswer,
      classification: classification.type,
      createdAt: new Date().toISOString(),
    });

    // --- PHẢN HỒI ---
    return sendResponse(res, 200, true, "Thành công", {
      answer: finalAnswer,
      type: classification.type,
      timestamp: new Date().toISOString(),
      ...(debugData.query && { sql: debugData.query }),
      ...(debugData.resultCount !== undefined && { 
        resultCount: debugData.resultCount 
      }),
      ...(debugData.sampleData && { 
        sampleData: debugData.sampleData 
      }),
      ...(debugData.dashboard && { 
        dashboard: debugData.dashboard 
      })
    });
  } catch (err) {
    log("ERROR", err.message);
    return sendResponse(
      res,
      500,
      false,
      "Đã xảy ra lỗi máy chủ",
      null,
      err.message
    );
  }
});

app.listen(PORT, () => {
  console.log(`[READY] Chatbot API running at http://localhost:${PORT}`);
});