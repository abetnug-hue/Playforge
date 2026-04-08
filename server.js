import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import path from "path";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const API_KEY = process.env.API_KEY;

app.get("/", (req, res) => {
  res.sendFile(path.resolve("public/index.html"));
});

app.post("/generate", async (req, res) => {
  const prompt = req.body.prompt;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://laudable-energy-production-63c5.up.railway.app",
        "X-Title": "PlayForge"
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat-v3:free", // 🔥 DEEPSEEK FREE
        messages: [
          {
            role: "system",
            content: `
You are a professional game developer.

STRICT RULES:
- Return ONLY raw HTML
- No markdown, no explanation
- MUST include <!DOCTYPE html>
- MUST include a <canvas>
- MUST include a working game loop
- MUST include controls
- MUST run instantly
- No comments
`
          },
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });

    const data = await response.json();

    if (data.error) {
      console.log("AI ERROR:", data.error);
      return res.json({
        html: fallbackGame(),
        message: "AI failed 😭"
      });
    }

    let html = data.choices?.[0]?.message?.content || "";

    // clean formatting
    html = html.replace(/```html/g, "").replace(/```/g, "").trim();

    if (!html.includes("<!DOCTYPE html>")) {
      html = "<!DOCTYPE html>" + html;
    }

    if (!html.includes("<canvas")) {
      html = html.replace("<body>", "<body><canvas id='c'></canvas>");
    }

    res.json({
      html,
      message: "🤖 DeepSeek cooked something 🔥"
    });

  } catch (err) {
    console.log("SERVER ERROR:", err);

    res.json({
      html: fallbackGame(),
      message: "Server error 😭"
    });
  }
});

function fallbackGame() {
  return `
<!DOCTYPE html>
<html>
<body style="margin:0;background:black">
<canvas id="c"></canvas>
<script>
const c=document.getElementById("c");
const ctx=c.getContext("2d");
c.width=800;c.height=400;

let x=100,y=300,v=0;

document.addEventListener("keydown",()=>v=-10);

function loop(){
v+=0.5;y+=v;
if(y>300){y=300;v=0;}

ctx.clearRect(0,0,800,400);
ctx.fillStyle="cyan";
ctx.fillRect(x,y,50,50);

requestAnimationFrame(loop);
}
loop();
</script>
</body>
</html>`;
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🔥 running on " + PORT);
});
