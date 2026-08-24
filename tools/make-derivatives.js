const path = require("path");
const fs = require("fs");
let sharp;
try{
  sharp = require("V:/OpenCode/opsvault/node_modules/sharp");
}catch(e){
  console.error("sharp unavailable:", e.message);
  process.exit(1);
}

const SRC = path.join(__dirname, "..", "site", "img");
const OUT = path.join(SRC, "w");
if(!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive:true });

function targetWidth(file){
  if(/^[0-9]+[abc]\.webp$/.test(file)) return 720;
  if(/^1[1-5]\./.test(file)) return 1400;
  if(/^(1[6-9]|2[0-6])\./.test(file)) return 1200;
  if(/^([23][0-9]|3[01])\.webp$/.test(file)) return 900;
  if(file === "17.webp") return null;
  if(file.startsWith("virai-logo")) return null;
  return null;
}

(async function(){
  const files = fs.readdirSync(SRC).filter(f => f.endsWith(".webp") && !f.includes("_1242x2208"));
  let done = 0, skipped = 0;
  for(const f of files){
    const w = targetWidth(f);
    const outPath = path.join(OUT, f.replace(/\.webp$/, "-720.webp").replace(/\.[0-9]+-720/, (m)=>m));
    const named = path.join(OUT, f.replace(/\.webp$/, "") + "-" + (w || 0) + ".webp");
    if(!w){ skipped++; continue; }
    await sharp(path.join(SRC, f), { failOn:"none" })
      .resize({ width:w, withoutEnlargement:true })
      .webp({ quality:76, effort:4 })
      .toFile(named);
    done++;
    console.log(named.replace(SRC, "img"), "<-", f);
  }
  console.log("done:", done, "skipped:", skipped);
})();
