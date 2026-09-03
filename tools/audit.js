const path = require("path");
const fs = require("fs");
const pw = require("V:/OpenCode/opsvault/node_modules/playwright");

const BASE = "http://localhost:8080";
const OUT = path.join(__dirname, "shots2");
if(!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive:true });
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
let failures = 0;

function judge(label, r){
  const bad = r.broken.length === 0 && r.hidden.length === 0 && r.invisibleCards === 0 && r.errors.length === 0;
  if(!bad) failures++;
  console.log((bad ? "PASS " : "FAIL ") + label +
    "  imgs:" + r.total +
    (r.broken.length ? "  BROKEN:" + JSON.stringify(r.broken) : "") +
    (r.hidden.length ? "  HIDDEN:" + JSON.stringify(r.hidden) : "") +
    (r.invisibleCards ? "  INVISIBLE:" + r.invisibleCards : "") +
    (r.errors.length ? "  ERRORS:" + JSON.stringify(r.errors.slice(0,3)) : ""));
}

(async function(){
  const browser = await pw.chromium.launch({ executablePath:CHROME });

  async function session(vp, tag){
    const page = await browser.newPage({ viewport:vp });
    const errors = [];
    page.on("pageerror", e => errors.push(e.message.split("\n")[0]));
    page.on("console", m => { if(m.type() === "error" && m.text().indexOf("IMAGE LOAD FAILED") !== -1) errors.push(m.text()); });
    page.on("response", r => { if(r.status() === 404) errors.push("404 " + r.url()); });

    async function report(){
      return { errors:errors.slice(), ...(await page.evaluate(() => ({
        total: document.querySelectorAll("img").length,
        broken: Array.from(document.querySelectorAll("img")).filter(i => i.complete && i.naturalWidth === 0 && i.style.opacity !== "0").map(i => i.getAttribute("src")),
        hidden: Array.from(document.querySelectorAll("img")).filter(i => i.style.display === "none" || (i.complete && i.naturalWidth === 0 && i.style.opacity === "0")).map(i => i.getAttribute("src")),
        invisibleCards: document.querySelectorAll(".reveal:not(.in):not(.pcard),.reveal-init:not(.in)").length
      }))) };
    }
    async function shot(n){ await page.screenshot({ path:path.join(OUT, tag + "-" + n + ".png") }); }

    await page.goto(BASE + "/index.html", { waitUntil:"networkidle" });
    await page.waitForTimeout(1600);
    judge(tag + " index-top", await report());
    await shot("index-top");
    const name1 = await page.textContent(".ls-name");
    await page.click(".ls-nav-btn[data-land=neithal]");
    await page.waitForTimeout(1100);
    const name2 = await page.textContent(".ls-name");
    if(name1.trim() === name2.trim()){ failures++; console.log("FAIL " + tag + " switcher did not change landscape"); }
    else { console.log("PASS " + tag + " switcher " + name1.trim() + " -> " + name2.trim()); }
    judge(tag + " index-switched", await report());
    await shot("index-switcher");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.3));
    await page.waitForTimeout(900);
    judge(tag + " index-strip", await report());
    await shot("index-strip");

    await page.goto(BASE + "/shop.html", { waitUntil:"networkidle" });
    await page.waitForTimeout(800);
    for(let i = 0; i < 5; i++){
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(350);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(350);
    }
    judge(tag + " shop-scroll-cycles", await report());
    await shot("shop-all");

    const lands = ["kurinji","mullai","marutham","neithal","palai"];
    for(const l of lands){
      await page.click("[data-land=" + l + "]");
      await page.waitForTimeout(550);
      const r = await report();
      const cnt = await page.textContent("#countLabel");
      judge(tag + " shop-filter-" + l + " (" + cnt.trim() + ")", r);
      await shot("shop-" + l);
    }
    await page.click("[data-land='']");
    await page.waitForTimeout(550);
    judge(tag + " shop-cleared", await report());

    await page.goto(BASE + "/ainthinai.html", { waitUntil:"networkidle" });
    await page.waitForTimeout(700);
    await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.1));
    await page.waitForTimeout(1000);
    judge(tag + " ainthinai", await report());
    await shot("ainthinai");

    for(const id of ["kurinji","mullai","palai"]){
      await page.goto(BASE + "/landscape.html?id=" + id, { waitUntil:"networkidle" });
      await page.waitForTimeout(800);
      judge(tag + " landscape-" + id, await report());
      if(id === "kurinji") await shot("landscape-kurinji");
    }

    for(const p of ["craft","story","fragrance-memory","gift","weddings","corporate","find-your-virai","search","faq","contact","care","shipping","returns"]){
      await page.goto(BASE + "/" + p + ".html", { waitUntil:"networkidle" });
      await page.waitForTimeout(650);
      judge(tag + " " + p, await report());
    }
    await page.goto(BASE + "/craft.html", { waitUntil:"networkidle" });
    await page.waitForTimeout(500);
    await shot("craft");
    await page.goto(BASE + "/fragrance-memory.html", { waitUntil:"networkidle" });
    await page.waitForTimeout(500);
    await shot("memory");

    await page.goto(BASE + "/product.html?id=kurinji-candle", { waitUntil:"networkidle" });
    await page.waitForTimeout(900);
    judge(tag + " pdp", await report());
    await shot("pdp");

    await page.close();
  }

  await session({ width:1440, height:900 }, "d1440");
  await session({ width:390, height:844 }, "m390");

  await browser.close();
  console.log(failures === 0 ? "=== ALL CHECKS PASSED ===" : "=== " + failures + " FAILURES ===");
  process.exit(failures === 0 ? 0 : 1);
})();
