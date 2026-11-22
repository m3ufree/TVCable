const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "..", "..", "player");
const dst = path.join(__dirname, "..", "web");

function copy(dir, out) {
    fs.mkdirSync(out, { recursive: true });
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === "tools") continue;
        const s = path.join(dir, entry.name);
        const d = path.join(out, entry.name);
        if (entry.isDirectory()) copy(s, d);
        else fs.copyFileSync(s, d);
    }
}

copy(src, dst);
console.log("Synced", src, "->", dst);
