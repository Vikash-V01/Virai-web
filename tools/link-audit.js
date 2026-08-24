const fs = require("fs");
const path = require("path");
const dir = path.join(__dirname, "..", "site");
const files = fs.readdirSync(dir).filter(f => f.endsWith(".html"));
let broken = 0, checked = 0;
const hrefRe = /(?:href|src)="([^"#]+)"/g;
for (const f of files) {
  const html = fs.readFileSync(path.join(dir, f), "utf8");
  let m;
  while ((m = hrefRe.exec(html)) !== null) {
    const raw = m[1];
    if (/^(https?:|data:|mailto:|#|javascript:)/.test(raw)) continue;
    const clean = raw.split("?")[0];
    checked++;
    const target = path.join(dir, clean);
    if (!fs.existsSync(target)) { console.log("BROKEN in " + f + " -> " + raw); broken++; }
  }
}
console.log(checked + " local refs checked, " + broken + " broken");

const idRe = /id="([^"]+)"/g;
const anchors = new Set();
for (const f of files) {
  const html = fs.readFileSync(path.join(dir, f), "utf8");
  let a; while ((a = idRe.exec(html)) !== null) anchors.add(f + "#" + a[1]);
}
for (const f of files) {
  const html = fs.readFileSync(path.join(dir, f), "utf8");
  let m; const re = /href="([^"]*)#([^"]+)"/g;
  while ((m = re.exec(html)) !== null) {
    const page = m[1] === "" ? f : m[1];
    if (!anchors.has(page + "#" + m[2])) console.log("MISSING ANCHOR in " + f + " -> " + page + "#" + m[2]);
  }
}
