const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

function crc32(buf) {
    let table = crc32.table;
    if (!table) {
        table = crc32.table = new Int32Array(256);
        for (let n = 0; n < 256; n++) {
            let c = n;
            for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
            table[n] = c;
        }
    }
    let crc = -1;
    for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
    return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body));
    return Buffer.concat([len, body, crc]);
}

function png(width, height, pixelFn) {
    const raw = Buffer.alloc(height * (1 + width * 3));
    for (let y = 0; y < height; y++) {
        const row = y * (1 + width * 3);
        raw[row] = 0;
        for (let x = 0; x < width; x++) {
            const [r, g, b] = pixelFn(x, y, width, height);
            const o = row + 1 + x * 3;
            raw[o] = r; raw[o + 1] = g; raw[o + 2] = b;
        }
    }
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = 8; ihdr[9] = 2;
    return Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        chunk("IHDR", ihdr),
        chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
        chunk("IEND", Buffer.alloc(0)),
    ]);
}

const inRect = (x, y, x0, y0, x1, y1) => x >= x0 && x < x1 && y >= y0 && y < y1;

function inPlay(x, y, w, h) {
    const cx = w / 2, cy = h / 2;
    const ax = cx - w * 0.10, ay = cy - h * 0.13;
    const bx = cx - w * 0.10, by = cy + h * 0.13;
    const cxp = cx + w * 0.16, cyp = cy;
    const s = (px, py, qx, qy, rx, ry) => (qx - px) * (ry - py) - (qy - py) * (rx - px);
    const d1 = s(x, y, ax, ay, bx, by);
    const d2 = s(x, y, bx, by, cxp, cyp);
    const d3 = s(x, y, cxp, cyp, ax, ay);
    const neg = (d1 < 0) || (d2 < 0) || (d3 < 0);
    const pos = (d1 > 0) || (d2 > 0) || (d3 > 0);
    return !(neg && pos);
}

function draw(x, y, w, h, maskable) {
    const bgGrad = (t) => {
        const c0 = [0x3f, 0xa9, 0xf5], c1 = [0x15, 0x2a, 0x3a];
        return c0.map((v, i) => Math.round(v + (c1[i] - v) * t));
    };

    if (!maskable) {
        const t = (x / w + y / h) / 2;
        const c = bgGrad(t);
        const m = w * 0.06;
        if (x < m || y < m || x >= w - m) return c;
    } else {
        const t = y / h;
        const c = bgGrad(t * 0.5 + 0.25);
        const inner = w * 0.2;
        if (x < inner || x >= w - inner || y < inner || y >= h - inner) return c;
    }

    const cx = w / 2, cy = h / 2, r = w * 0.30;
    const dx = x - cx, dy = y - cy;
    if (dx * dx + dy * dy <= r * r) {
        if (inPlay(x, y, w, h)) return [255, 255, 255];
        return [0x10, 0x14, 0x18];
    }
    return maskable ? bgGrad(y / h * 0.5 + 0.25) : bgGrad((x / w + y / h) / 2);
}

const outDir = path.join(__dirname, "..", "icons");
fs.mkdirSync(outDir, { recursive: true });

const targets = [
    ["icon-192.png", 192, false],
    ["icon-512.png", 512, false],
    ["icon-maskable-512.png", 512, true],
];

for (const [name, size, maskable] of targets) {
    fs.writeFileSync(path.join(outDir, name), png(size, size, (x, y, w, h) => draw(x, y, w, h, maskable)));
    console.log("wrote", name);
}
