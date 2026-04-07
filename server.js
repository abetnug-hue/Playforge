import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import path from "path";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// 🔑 PUT YOUR NEW API KEY HERE
const API_KEY = "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";

// ✅ ROOT FIX (SERVES YOUR UI)
app.get("/", (req, res) => {
    res.sendFile(path.resolve("public/index.html"));
});

// 🎮 GENERATE GAME
app.post("/generate", async (req, res) => {
    const prompt = req.body.prompt;

    let html = "";

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "openai/gpt-3.5-turbo", // 🔥 safer model
                messages: [
                    {
                        role: "system",
                        content: `You are a pro game dev. Return ONLY a full HTML5 canvas game. No text.`
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ]
            })
        });

        const data = await response.json();

        console.log("AI RESPONSE:", JSON.stringify(data)); // 🔍 DEBUG

        html = data.choices?.[0]?.message?.content || "";

        // clean markdown
        html = html.replace(/```html/g, "").replace(/```/g, "").trim();

    } catch (err) {
        console.log("AI ERROR:", err);
    }

    // 🔧 FIXES
    if (html && !html.includes("<!DOCTYPE html>")) {
        html = "<!DOCTYPE html>" + html;
    }

    if (html && !html.includes("<canvas")) {
        html = html.replace("<body>", "<body><canvas id='c'></canvas>");
    }

    // 🎮 FALLBACK GAME (IF AI FAILS)
    if (!html || !html.includes("<canvas")) {
        console.log("⚠️ AI FAILED — USING FALLBACK");

        html = `
<!DOCTYPE html>
<html>
<body style="margin:0;background:black">
<canvas id="c"></canvas>
<script>
const c = document.getElementById("c");
const ctx = c.getContext("2d");
c.width=800;c.height=400;

let player={x:100,y:300,v:0};

document.addEventListener("keydown",()=>player.v=-10);

function loop(){
player.v+=0.5;
player.y+=player.v;
if(player.y>300){player.y=300;player.v=0;}

ctx.clearRect(0,0,800,400);
ctx.fillStyle="cyan";
ctx.fillRect(player.x,player.y,50,50);

requestAnimationFrame(loop);
}
loop();
</script>
</body>
</html>`;
    }

    res.json({
        html,
        message: html.includes("<canvas")
            ? "🤖 I cooked up something for you!"
            : "⚠️ AI struggled… but I saved it 😤"
    });
});

// 🔥 RAILWAY PORT FIX
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("🔥 PlayForge running on port " + PORT);
});
