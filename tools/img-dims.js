const fs = require("fs");
const path = require("path");
const DIR = path.join(__dirname, "..", "site", "img");

function webpSize(buf){
  const fourcc = buf.toString("ascii", 12, 16);
  if(fourcc === "VP8X"){
    const w = 1 + ((buf[24]) | (buf[25] << 8) | (buf[26] << 16));
    const h = 1 + ((buf[27]) | (buf[28] << 8) | (buf[29] << 16));
    return [w, h];
  }
  if(fourcc === "VP8 "){
    return [buf.readUInt16LE(26) & 0x3fff, buf.readUInt16LE(28) & 0x3fff];
  }
  if(fourcc === "VP8L"){
    const b = buf[21], bits = (buf[20] << 8) | b;
    const w = (bits & 0x3fff) + 1;
    const h = ((bits >> 6) & 0x3fff) + 1;
    return [w, h];
  }
  return null;
}

const out = {};
for(const f of fs.readdirSync(DIR)){
  if(!f.endsWith(".webp")) continue;
  const fd = fs.openSync(path.join(DIR, f), "r");
  const buf = Buffer.alloc(64);
  fs.readSync(fd, buf, 0, 64, 0);
  fs.closeSync(fd);
  const s = webpSize(buf);
  out[f] = s ? { w:s[0], h:s[1] } : null;
}
console.log(JSON.stringify(out, null, 1));
