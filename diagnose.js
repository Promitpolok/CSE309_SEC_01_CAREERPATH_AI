require('dotenv').config();

async function checkGoogleAI() {
    const key = process.env.GEMINI_API_KEY;

    if (!key) {
        console.log("❌ ERROR: Could not find GEMINI_API_KEY in .env file.");
        return;
    }

    console.log(`🔑 Key found: ${key.substring(0, 5)}... (Checking access...)`);

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            console.log("\n❌ API Error:");
            console.log(JSON.stringify(data.error, null, 2));
        } else {
            console.log("\n✅ SUCCESS! Connection established.");
            console.log("Here are the models available to your API Key:");
            console.log("------------------------------------------------");
            
            // Filter to show only the ones we care about
            const usefulModels = data.models.filter(m => 
                m.name.includes('gemini') && m.supportedGenerationMethods.includes('generateContent')
            );

            usefulModels.forEach(m => console.log(`• ${m.name.replace('models/', '')}`));
            
            console.log("------------------------------------------------");
            console.log("Use one of the names above in your server.js file.");
        }
    } catch (error) {
        console.log("❌ Network Error:", error.message);
    }
}

checkGoogleAI();