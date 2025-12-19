// server.js
require("dotenv").config();
const express = require("express");
const multer = require("multer");
const pdf = require("pdf-parse");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const cors = require("cors");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public")); // Serves your HTML files

// Configure Multer (File Upload)
const upload = multer({ dest: "uploads/" });

// Configure Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// ----------------------------------------------------
// API 1: Resume Analysis (The Core Feature)
// ----------------------------------------------------
app.post("/api/analyze-resume", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // 1. Extract Text from PDF
    const dataBuffer = fs.readFileSync(req.file.path);
    const pdfData = await pdf(dataBuffer);
    const resumeText = pdfData.text;

    // 2. Prepare Prompt for Gemini
    // We ask for JSON format so our Frontend Graphs can read it
    const prompt = `
            You are an expert Career Counselor and AI Data Analyst. 
            Analyze the following resume text for a candidate aiming for a Junior Developer/Tech role.
            Check current industry trends (2025-2026) for skills demand.

            Resume Text: "${resumeText.substring(0, 8000)}"

            Return ONLY a valid JSON object (no markdown formatting) with this exact structure:
            {
                "matchScore": (number 0-100),
                "softSkills": { "match": (number 0-100), "gap": (number 0-100) },
                "techSkills": [
                    { "name": "Skill Name", "current": (0-100), "demand": (0-100) },
                    { "name": "Skill Name", "current": (0-100), "demand": (0-100) },
                    { "name": "Skill Name", "current": (0-100), "demand": (0-100) }
                ],
                "recommendations": ["Rec 1", "Rec 2", "Rec 3"],
                "missingSkills": ["Skill 1", "Skill 2"]
            }
        `;

    // 3. Generate Content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Cleanup: Remove markdown code blocks if AI adds them
    text = text.replace(/```json/g, "").replace(/```/g, "");

    const jsonResponse = JSON.parse(text);

    // 4. Delete temp file
    fs.unlinkSync(req.file.path);

    res.json(jsonResponse);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Analysis failed" });
  }
});

// ----------------------------------------------------
// API 2: Chatbot (Interactive)
// ----------------------------------------------------
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [
            {
              text: "You are a helpful career mentor AI. Keep answers concise.",
            },
          ],
        },
        {
          role: "model",
          parts: [
            { text: "Understood. I am ready to help with career advice." },
          ],
        },
      ],
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    res.json({ reply: text });
  } catch (error) {
    console.error("Chat Error:", error);
    res.status(500).json({ error: "Chat failed" });
  }
});

// Start Server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
