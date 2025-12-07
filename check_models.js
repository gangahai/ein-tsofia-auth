const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

console.log("🚀 Starting Model Check Script...");

// Function to load env vars manually
function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        console.log(`📂 Looking for .env.local at: ${envPath}`);

        if (!fs.existsSync(envPath)) {
            console.error("❌ .env.local file NOT found!");
            return;
        }

        const envConfig = fs.readFileSync(envPath, 'utf8');
        console.log("📄 File read successfully. Parsing...");

        const lines = envConfig.split('\n');
        lines.forEach((line, index) => {
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine.startsWith('#')) return; // Skip comments and empty lines

            const separatorIndex = trimmedLine.indexOf('=');
            if (separatorIndex === -1) return;

            const key = trimmedLine.substring(0, separatorIndex).trim();
            let value = trimmedLine.substring(separatorIndex + 1).trim();

            // Remove quotes if present
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }

            process.env[key] = value;
            // Print found keys (masked value)
            console.log(`   🔑 Found key: ${key} (Length: ${value.length})`);
        });

    } catch (e) {
        console.error("❌ Error loading .env.local:", e.message);
    }
}

loadEnv();

async function listModels() {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error("\n❌ CRITICAL ERROR: Could not find NEXT_PUBLIC_GEMINI_API_KEY or GEMINI_API_KEY in environment variables.");
        console.log("   Please check your .env.local file and ensure the key is defined like:");
        console.log("   NEXT_PUBLIC_GEMINI_API_KEY=AIzaSy...");
        return;
    }

    console.log(`\n✅ API Key found! (Starts with: ${apiKey.substring(0, 4)}...)`);

    const genAI = new GoogleGenerativeAI(apiKey);

    const modelsToTest = [
        // Gemini 2.5 Models
        'gemini-2.5-pro-preview-03-25',     // Gemini 2.5 Pro Preview
        'gemini-2.5-flash',                 // Gemini 2.5 Flash
        'gemini-2.5-pro',                   // Gemini 2.5 Pro

        // Gemini 2.0 Models
        'gemini-2.0-flash-exp',             // Gemini 2.0 Flash (Experimental)
        'gemini-2.0-flash',                 // Gemini 2.0 Flash
        'gemini-2.0-flash-thinking-exp-01-21', // Gemini 2.0 Flash Thinking
        'gemini-2.0-flash-thinking-exp',    // Gemini 2.0 Flash Thinking (shorter)
        'gemini-2.0-pro-exp',               // Gemini 2.0 Pro

        // Gemini Experimental
        'gemini-exp-1206',                  // Gemini Exp (Dec 2024)
        'gemini-exp-1121',                  // Gemini Exp (Nov 2024)

        // Gemini 1.5 Models
        'gemini-1.5-pro',                   // Gemini 1.5 Pro
        'gemini-1.5-pro-latest',            // Gemini 1.5 Pro Latest
        'gemini-1.5-pro-002',               // Gemini 1.5 Pro v002
        'gemini-1.5-flash',                 // Gemini 1.5 Flash
        'gemini-1.5-flash-latest',          // Gemini 1.5 Flash Latest
        'gemini-1.5-flash-002',             // Gemini 1.5 Flash v002
        'gemini-1.5-flash-8b',              // Gemini 1.5 Flash 8B

        // Legacy
        'gemini-pro',                       // Gemini Pro (Legacy)
        'gemini-pro-vision'                 // Gemini Pro Vision
    ];

    console.log("\n🔍 Checking Gemini Model Availability...\n");

    for (const modelName of modelsToTest) {
        try {
            process.stdout.write(`Testing ${modelName.padEnd(35)} ... `);
            const model = genAI.getGenerativeModel({ model: modelName });
            await model.generateContent("Hi");
            console.log(`✅ AVAILABLE`);
        } catch (error) {
            let msg = error.message || "Unknown error";
            if (msg.includes("404")) msg = "Not Found (404)";
            else if (msg.includes("403")) msg = "Permission Denied (403)";
            else if (msg.includes("400")) msg = "Bad Request (400)";

            console.log(`❌ ${msg}`);
        }
    }
    console.log("\nDone.");
}

listModels();
