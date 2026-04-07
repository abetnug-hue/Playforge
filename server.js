import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// 🔑 PUT YOUR API KEY HERE (regenerate if needed)
const API_KEY = "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";

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
                model: "meta-llama/llama-3-8b-instruct",
                messages: [
                    {
                        role: "system",
                        content: `You are a professional game developer.

Create a COMPLETE HTML5 canvas game.

RULES:
- MUST include <!DOCTYPE html>
- MUST include <canvas>
- MUST be playable immediately
- Use images if possible
- ONLY return HTML`
                    },
                    {
                        role: "user",
                        content: `Game idea: ${prompt}`
                    }
                ]
            })
        });

        const data = await response.json();
        html = data.choices?.[0]?.message?.content || "";

        // clean markdown
        html = html.replace(/```html/g, "").replace(/```/g, "").trim();

    } catch (err) {
        console.log("AI ERROR:", err);
    }

    // 🔧 BASIC FIXES
    if (html && !html.includes("<!DOCTYPE html>")) {
        html = "<!DOCTYPE html>" + html;
    }

    if (html && !html.includes("<canvas")) {
        html = html.replace("<body>", "<body><canvas id='c'></canvas>");
    }

    // 🔥 AUTO INJECT ASSETS
    if (html && html.includes("<script>")) {
        html = html.replace("<script>", `
<script>

// 🔥 ASSETS (AUTO)
const playerImg = new Image();
playerImg.src = "/assets/player.png";

const enemyImg = new Image();
enemyImg.src = "/assets/enemy.png";

const bgImg = new Image();
bgImg.src = "/assets/bg.png";

const coinImg = new Image();
coinImg.src = "/assets/coin.png";

const platformImg = new Image();
platformImg.src = "/assets/platform.png";

// 🎮 BASIC OBJECTS
let player = {x:100,y:300,v:0};
let enemy = {x:500,y:300};
let coin = {x:650,y:200};

`);
    }

    // 🔥 FORCE FULL GAME RENDER
    if (html && !html.includes("drawImage")) {
        html = html.replace("function loop()", `
function loop(){

// 🌄 background
ctx.drawImage(bgImg, 0, 0, c.width, c.height);

// 🧍 player physics
player.v += 0.5;
player.y += player.v;
if(player.y > 300){ player.y = 300; player.v = 0; }

// 👾 enemy movement
enemy.x -= 2;
if(enemy.x < -50) enemy.x = 800;

// ⭐ coin float
coin.y += Math.sin(Date.now()/200)*0.5;

// 🎨 draw everything
ctx.drawImage(playerImg, player.x, player.y, 50, 50);
ctx.drawImage(enemyImg, enemy.x, enemy.y, 50, 50);
ctx.drawImage(coinImg, coin.x, coin.y, 30, 30);

`);
    }

    // 🎮 FALLBACK GAME (FULL ASSETS)
    if (!html || !html.includes("<canvas")) {
        html = `
<!DOCTYPE html>
<html>
<body style="margin:0;background:black">
<canvas id="c"></canvas>
<script>
const c = document.getElementById("c");
const ctx = c.getContext("2d");
c.width=800;c.height=400;

const playerImg = new Image();
playerImg.src="/assets/player.png";

const enemyImg = new Image();
enemyImg.src="/assets/enemy.png";

const coinImg = new Image();
coinImg.src="/assets/coin.png";

const bgImg = new Image();
bgImg.src="/assets/bg.png";

let player={x:100,y:300,v:0};
let enemy={x:500,y:300};
let coin={x:650,y:200};

document.addEventListener("keydown",()=>player.v=-10);

function loop(){
player.v+=0.5;
player.y+=player.v;
if(player.y>300){player.y=300;player.v=0;}

enemy.x-=2;
if(enemy.x<-50)enemy.x=800;

ctx.clearRect(0,0,800,400);
ctx.drawImage(bgImg,0,0,800,400);
ctx.drawImage(playerImg,player.x,player.y,50,50);
ctx.drawImage(enemyImg,enemy.x,enemy.y,50,50);
ctx.drawImage(coinImg,coin.x,coin.y,30,30);

requestAnimationFrame(loop);
}
loop();
</script>
</body>
</html>`;
    }

    res.json({ html });
});

app.listen(3000, () => {
    console.log("🔥 PlayForge running FULL ENGINE at http://localhost:3000");
});