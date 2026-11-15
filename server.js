// Server lokal tanpa npm: node server.js, lalu buka http://localhost:3000
// Menyajikan file statis dan menjalankan fungsi server /api/kurs (sama seperti di Vercel).
// API key dibaca dari .env, yang tidak pernah disajikan ke browser.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

try {
  process.loadEnvFile(path.join(__dirname, ".env")); // Node 20.12+ / 21.7+
} catch (e) {
  console.warn("Peringatan: .env tidak ditemukan, /api/kurs akan menjawab kurs tidak tersedia.");
}

const kurs = require("./api/kurs.js");
const PORT = Number(process.env.PORT) || 3000;
const ROOT = __dirname;
// Hanya jenis file ini yang boleh disajikan; dotfile (.env, .git) dan folder api/ ditolak.
const TIPE = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

http
  .createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname === "/api/kurs") return kurs(req, res);

    const rel = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
    const file = path.join(ROOT, rel);
    const bagian = path.relative(ROOT, file).split(path.sep);
    const terlarang =
      !file.startsWith(ROOT + path.sep) ||
      bagian.some((b) => b.startsWith(".")) ||
      bagian[0] === "api" ||
      !(path.extname(file) in TIPE);
    if (terlarang) {
      res.statusCode = 404;
      return res.end("Tidak ditemukan");
    }
    fs.readFile(file, (err, isi) => {
      if (err) {
        res.statusCode = 404;
        return res.end("Tidak ditemukan");
      }
      res.setHeader("Content-Type", TIPE[path.extname(file)]);
      res.setHeader("Cache-Control", "no-store");
      res.end(isi);
    });
  })
  .listen(PORT, () => console.log("Kalkulator jalan di http://localhost:" + PORT));
