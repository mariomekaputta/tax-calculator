// Fungsi server GET /api/kurs: kurs USD -> IDR dari ExchangeRate-API.
// API key hanya ada di server (env EXCHANGE_RATE_API_KEY, dari .env atau pengaturan Vercel),
// jadi browser hanya melihat request ke /api/kurs dan tidak pernah melihat key.
// Tanpa cache: setiap request mengambil kurs terbaru dari API.
// Dokumentasi API: https://www.exchangerate-api.com/docs/standard-requests

const KURS_API = "https://v6.exchangerate-api.com/v6/";
const PESAN_GAGAL = "Kurs USD sedang tidak tersedia";

// Ambil kurs IDR dari respons /latest/USD; lempar error bila respons tidak bisa dipakai.
function bacaKurs(data) {
  if (!data || data.result !== "success") {
    throw new Error("respons gagal" + (data && data["error-type"] ? " (" + data["error-type"] + ")" : ""));
  }
  const rate = data.conversion_rates && data.conversion_rates.IDR;
  if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) {
    throw new Error("kurs IDR tidak ada di respons");
  }
  return { rate, waktu: data.time_last_update_utc };
}

// Hasil: { status, body }. fetchFn bisa diganti saat tes.
async function ambilKursUsd(key, fetchFn = fetch) {
  if (!key) {
    console.error("[api/kurs] EXCHANGE_RATE_API_KEY belum di-set");
    return { status: 503, body: { error: PESAN_GAGAL } };
  }
  try {
    const res = await fetchFn(KURS_API + encodeURIComponent(key) + "/latest/USD", {
      signal: AbortSignal.timeout(8000),
    });
    return { status: 200, body: bacaKurs(await res.json()) };
  } catch (e) {
    // Jangan log URL: isinya API key.
    console.error("[api/kurs] gagal mengambil kurs:", e.message);
    return { status: 503, body: { error: PESAN_GAGAL } };
  }
}

// Handler gaya Node (req, res): dipakai Vercel Functions dan server.js lokal.
async function handler(req, res) {
  const { status, body } = await ambilKursUsd(process.env.EXCHANGE_RATE_API_KEY);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

module.exports = handler;
module.exports.ambilKursUsd = ambilKursUsd;
module.exports.bacaKurs = bacaKurs;
module.exports.PESAN_GAGAL = PESAN_GAGAL;
