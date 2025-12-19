require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  try {
    // This asks Google: "What models can I use?"
    // We intentionally force the older API version to see if that's the issue, 
    // but the SDK handles most of this.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    console.log("Checking API connection...");
    const result = await model.generateContent("Hello");
    console.log("Success! 'gemini-1.5-flash' works.");
    console.log("Response:", result.response.text());

  } catch (error) {
    console.log("\n❌ 'gemini-1.5-flash' FAILED.");
    console.log("Error details:", error.message);
    
    console.log("\n--- TRYING FALLBACK (gemini-pro) ---");
    try {
        const model2 = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result2 = await model2.generateContent("Hello");
        console.log("✅ Success! 'gemini-pro' works.");
    } catch (err2) {
        console.log("❌ 'gemini-pro' ALSO FAILED.");
        console.log("Error details:", err2.message);
    }
  }
}

listModels();