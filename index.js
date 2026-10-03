const express = require("express");
const line = require("@line/bot-sdk");

const app = express();

const config = {
  channelSecret: process.env.CHANNEL_SECRET,
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
};

const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: config.channelAccessToken
});

app.get("/", (req, res) => {
  res.send("TRỢ LÝ HTN đang hoạt động!");
});

app.post("/webhook", line.middleware(config), async (req, res) => {
  try {
    await Promise.all(req.body.events.map(handleEvent));
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

async function handleEvent(event) {
  if (event.type !== "message" || event.message.type !== "text") {
    return null;
  }

  const text = event.message.text.trim();

  let reply = "";

  if (text.toLowerCase() === "hello" || text.toLowerCase() === "hi") {
    reply = "Xin chào! 👋\nLuna – Trợ lý HTN đã sẵn sàng.";
  } else if (text.toLowerCase() === "menu") {
    reply =
      "📋 MENU TRỢ LÝ HTN\n\n" +
      "• MENU – Xem chức năng\n" +
      "• TEST – Kiểm tra bot\n" +
      "• HELLO – Chào Luna";
  } else if (text.toLowerCase() === "test") {
    reply = "✅ Bot TRỢ LÝ HTN đang hoạt động bình thường.";
  } else {
    reply = `Luna đã nhận: "${text}"`;
  }

  return client.replyMessage({
    replyToken: event.replyToken,
    messages: [
      {
        type: "text",
        text: reply
      }
    ]
  });
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`TRỢ LÝ HTN running on port ${PORT}`);
});
