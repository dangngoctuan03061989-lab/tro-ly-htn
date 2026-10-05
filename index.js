const express = require("express");
const line = require("@line/bot-sdk");
const { OpenAI } = require("openai");

const app = express();

const config = {
  channelSecret: process.env.CHANNEL_SECRET,
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
};

const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: config.channelAccessToken
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Trang kiểm tra server
app.get("/", (req, res) => {
  res.send("TRỢ LÝ HTN đang hoạt động!");
});

// Webhook LINE
app.post("/webhook", line.middleware(config), async (req, res) => {
  try {
    await Promise.all(req.body.events.map(handleEvent));
    res.sendStatus(200);
  } catch (error) {
    console.error("Webhook error:", error);
    res.sendStatus(500);
  }
});

async function handleEvent(event) {
  // Chỉ xử lý tin nhắn dạng text
  if (event.type !== "message" || event.message.type !== "text") {
    return null;
  }

  let text = event.message.text.trim();

  // ==============================
  // CHỈ TRẢ LỜI KHI ĐƯỢC @ TRONG NHÓM
  // ==============================
  const isGroup =
    event.source &&
    (event.source.type === "group" || event.source.type === "room");

  if (isGroup) {
    const mentionees = event.message.mention?.mentionees || [];

    const mentionedBot = mentionees.some(
      (person) => person.isSelf === true
    );

    // Không @ bot -> không trả lời
    if (!mentionedBot) {
      return null;
    }

    // Xóa phần @TRỢ LÝ HTN khỏi câu hỏi
    const botMentions = mentionees
      .filter((person) => person.isSelf === true)
      .sort((a, b) => b.index - a.index);

    for (const mention of botMentions) {
      text =
        text.slice(0, mention.index) +
        text.slice(mention.index + mention.length);
    }

    text = text.trim();
  }

  // Nếu sau khi bỏ @ mà không còn nội dung
  if (!text) {
    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [
        {
          type: "text",
          text: "Dạ, Tuấn cần Luna hỗ trợ việc gì ạ?"
        }
      ]
    });
  }

  // ==============================
  // LỆNH TEST
  // ==============================
  const lowerText = text.toLowerCase();

  if (lowerText === "test") {
    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [
        {
          type: "text",
          text: "✅ TRỢ LÝ HTN đang hoạt động bình thường!"
        }
      ]
    });
  }

  // ==============================
  // GỌI OPENAI
  // ==============================
  try {
    const response = await openai.responses.create({
      model: "gpt-5.5",

      instructions: `
Bạn là TRỢ LÝ HTN, trợ lý AI hỗ trợ công việc tại DC Hàm Thuận Nam.

Nguyên tắc:
- Trả lời bằng tiếng Việt.
- Ngắn gọn, rõ ràng, thực tế.
- Ưu tiên cách làm cụ thể và dễ áp dụng.
- Khi người dùng hỏi về công việc kho, hãy tư duy theo góc độ vận hành, nhân sự, tồn kho, kiểm kê, PCCC, VSATTP, logistics và quản lý kho.
- Nếu không có đủ dữ liệu thì nói rõ là chưa đủ dữ liệu, không tự bịa số liệu.
- Không tự nhận rằng đã thực hiện một hành động ngoài hệ thống.
- Khi tính toán, hãy nêu công thức và kết quả rõ ràng.
      `,

      input: text
    });

    const reply =
      response.output_text ||
      "Xin lỗi, Luna chưa tạo được câu trả lời lúc này.";

    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [
        {
          type: "text",
          text: reply.substring(0, 5000)
        }
      ]
    });

  } catch (error) {
    console.error("OpenAI error:", error);

    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [
        {
          type: "text",
          text: "⚠️ Luna đang gặp lỗi kết nối AI. Tuấn kiểm tra lại Render giúp Luna nhé."
        }
      ]
    });
  }
}

// Khởi động server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`TRỢ LÝ HTN running on port ${PORT}`);
});
