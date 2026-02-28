// server.js
import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

// Load environment variables
dotenv.config();

// Log API key status (for debugging, not the actual key)
console.log("Loaded API Key:", process.env.OPENAI_API_KEY ? "✅ Found" : "❌ Not Found");

const app = express();
const PORT = process.env.PORT || 3000;

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Default route — serves chatbot UI
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Chat route — handles messages from the frontend
app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  if (!userMessage) {
    return res.status(400).json({ reply: "⚠️ No message provided." });
  }

  try {
    // Send request to OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    // Parse JSON response
    const data = await response.json();

    // Log full response for debugging
    console.log("🔍 Full API Response:", JSON.stringify(data, null, 2));

    // Handle API errors
    if (data.error) {
      console.error("❌ OpenAI API Error:", data.error.message);
      return res.json({ reply: `⚠️ OpenAI API Error: ${data.error.message}` });
    }

    // Return chatbot reply
    if (data.choices && data.choices.length > 0) {
      res.json({ reply: data.choices[0].message.content });
    } else {
      res.json({ reply: "⚠️ No valid response from OpenAI API." });
    }
  } catch (error) {
    console.error("💥 Fetch error:", error);
    res.status(500).json({ reply: "⚠️ Error contacting OpenAI API." });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
