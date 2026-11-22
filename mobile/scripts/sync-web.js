const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "..", "player");
const dst = path.join(__dirname, "..", "www");

fs.rmSync(dst, { recursive: true, force: true });
fs.cpSync(src, dst, { recursive: true, filter: (s) => path.basename(s) !== "tools" });
console.log("Synced", src, "->", dst);
