const pw = require("V:/OpenCode/opsvault/node_modules/playwright");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
let fails = 0;
function check(label, ok, detail){
  if(!ok) fails++;
  console.log((ok ? "PASS " : "FAIL ") + label + (detail ? "  " + detail : ""));
}
(async function(){
  const b = await pw.chromium.launch({ executablePath:CHROME });
  for(const vp of [{w:1440,h:900,t:"d1440"},{w:390,h:844,t:"m390"},{w:768,h:1024,t:"t768"}]){
    const p = await b.newPage({ viewport:{ width:vp.w, height:vp.h } });
    const errs = [];
    p.on("pageerror", e => errs.push(e.message));
    await p.goto("http://localhost:8080/index.html", { waitUntil:"networkidle" });
    await p.waitForTimeout(600);

    const hTop = await p.evaluate(() => document.querySelector(".site-head").offsetHeight);
    const annInside = await p.evaluate(() => !!document.querySelector(".site-head .head-util"));
    check(vp.t + " announce outside header", !annInside);

    const marker = await p.evaluate(() => {
      const el = document.querySelector(".intro-grid");
      const r = el.getBoundingClientRect();
      return { top: r.top + window.scrollY, left: r.left };
    });

    await p.evaluate(() => window.scrollTo(0, 600));
    await p.waitForTimeout(450);
    const hScrolled = await p.evaluate(() => ({
      h: document.querySelector(".site-head").offsetHeight,
      top: document.querySelector(".site-head").getBoundingClientRect().top,
      scrolledClass: document.querySelector(".site-head").classList.contains("scrolled")
    }));
    check(vp.t + " header height constant", hScrolled.h === hTop, hTop + "px -> " + hScrolled.h + "px");
    check(vp.t + " header pinned top:0", hScrolled.top === 0);
    check(vp.t + " scrolled class applied", hScrolled.scrolledClass);

    const marker2 = await p.evaluate(() => {
      const el = document.querySelector(".intro-grid");
      return el.getBoundingClientRect().left;
    });
    check(vp.t + " no horizontal shift", Math.abs(marker2 - marker.left) < 0.5);

    for(let i = 0; i < 12; i++){
      await p.evaluate(y => window.scrollTo(0, y), i % 2 === 0 ? 300 : 900);
      await p.waitForTimeout(90);
    }
    await p.evaluate(() => window.scrollTo(0, 450));
    await p.waitForTimeout(300);
    const mid = await p.evaluate(() => ({
      h: document.querySelector(".site-head").offsetHeight,
      top: document.querySelector(".site-head").getBoundingClientRect().top,
      cls: document.querySelector(".site-head").classList.contains("scrolled")
    }));
    check(vp.t + " rapid-direction stability", mid.h === hTop && mid.top === 0 && mid.cls, JSON.stringify(mid));

    await p.evaluate(() => window.scrollTo(0, 0));
    await p.waitForTimeout(450);
    const backTop = await p.evaluate(() => ({
      h: document.querySelector(".site-head").offsetHeight,
      cls: document.querySelector(".site-head").classList.contains("scrolled"),
      annVisible: !!document.querySelector(".top-announce .head-util") && document.querySelector(".top-announce").getBoundingClientRect().bottom > 0
    }));
    check(vp.t + " top state restores", backTop.h === hTop && !backTop.cls && backTop.annVisible, JSON.stringify(backTop));

    const navOk = await p.evaluate(() => {
      const links = Array.from(document.querySelectorAll(".head-nav a, .icon-btn, .brand-mark"));
      return links.length >= 5 && links.every(a => a.getBoundingClientRect().width > 0 || a.closest(".head-nav") === null);
    });
    check(vp.t + " nav elements present", navOk);
    check(vp.t + " no page errors", errs.length === 0, errs.join(" | ").slice(0,120));
    await p.close();
  }
  await b.close();
  console.log(fails === 0 ? "=== HEADER STABLE ===" : "=== " + fails + " FAILURES ===");
  process.exit(fails ? 1 : 0);
})();
