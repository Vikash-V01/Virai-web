const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "site");
const PORT = process.env.PORT || 8080;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
  ".json": "application/json"
};

http.createServer(function(req, res){
  let urlPath = decodeURIComponent(req.url.split("?")[0]);
  if(urlPath.endsWith("/")) urlPath += "index.html";
  const filePath = path.join(ROOT, urlPath);
  if(!filePath.startsWith(ROOT)){
    res.writeHead(403); res.end("Forbidden"); return;
  }
  fs.readFile(filePath, function(err, data){
    if(err){
      res.writeHead(404, {"Content-Type":"text/plain"});
      res.end("Not found: " + urlPath);
      return;
    }
    res.writeHead(200, {"Content-Type": TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream"});
    res.end(data);
  });
}).listen(PORT, function(){
  console.log("VIRAI running at http://localhost:" + PORT);
});
