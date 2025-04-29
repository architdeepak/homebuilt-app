import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Client } from "@gradio/client";
import fs from "fs"; // To handle image file operations

const app = express();
const PORT = process.env.PORT || 5000; // ✅ Use dynamic port for Render

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: "100mb" })); // Set JSON body limit to 100MB
app.use(bodyParser.urlencoded({ limit: "100mb", extended: true })); // Set URL-encoded body limit to 100MB

// Gemini setup (for chatting)
const genAI = new GoogleGenerativeAI("AIzaSyAV4J4reSrOsiSZgkuhUab0vDeNXpgN1Qc");

// Initialize Gradio Client for Image Editor
const client = await Client.connect("taesiri/Gemini-Text-based-Image-Editor");

// Define a prompt that Gemini will follow for all responses
const basePrompt = "Please respond in a helpful, friendly, and professional manner, assisting with DIY projects. Keep your responses clear and simple, as if you were explaining it to someone who is a beginner.";

// ✅ Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "✅ Backend is up!" });
});

// Chat API endpoint
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash", // Model used for chat
    });

    const prompt = `${basePrompt} User says: "${message}"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log(`User Message: ${message}`);
    console.log(`AI Response: ${text}`);

    res.json({ reply: text });
  } catch (error) {
    console.error("Gemini API error:", error);
    res.status(500).json({ error: "Gemini API request failed." });
  }
});

// Image Editor API endpoint
app.post("/api/edit-image", async (req, res) => {
  const { image, instruction } = req.body;

  try {
    const imageBlob = Buffer.from(image.split(",")[1], "base64");

    const result = await client.predict("/process_image", {
      image: imageBlob,
      instruction: instruction
    });

    console.log("Image Editing Result:", result.data);
    
    res.json({ result: result.data });
  } catch (error) {
    console.error("Image Editing Error:", error);
    res.status(500).json({ error: "Image editing failed." });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
