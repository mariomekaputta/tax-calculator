// Jalankan: node --test
const test = require("node:test");
const assert = require("node:assert/strict");
const { hitung, tarif, TER, KATEGORI, keRupiah } = require("./app.js");
const { bacaKurs, ambilKursUsd, PESAN_GAGAL } = require("./api/kurs.js");

test("kasus uji di PROGRESS.md", () => {
  const cases = [
    ["TK/0", 10000000, { kategori: "A", bruto: 10454000, bp: 250, pph: 261350, bersih: 9338650 }],
    ["K/1", 7000000, { kategori: "B", bruto: 7317800, bp: 100, pph: 73178, bersih: 6646822 }],
  ];
  for (const [status, gaji, harap] of cases) {
    const h = hitung(gaji, status);
    for (const k in harap) assert.equal(h[k], harap[k], `${status} ${gaji} ${k}`);
  }
});

test("pemetaan status PTKP ke kategori TER", () => {
  assert.deepEqual(KATEGORI, {
    "TK/0": "A", "TK/1": "A", "K/0": "A",
    "TK/2": "B", "TK/3": "B", "K/1": "B", "K/2": "B",
    "K/3": "C",
  });
});

for (const [kategori, baris] of Object.entries(TER)) {
  test(`tabel TER ${kategori}: batas naik, tarif naik, ditutup Infinity`, () => {
    assert.equal(baris.at(-1)[0], Infinity);
    assert.equal(baris.at(-1)[1], 3400);
    for (let i = 1; i < baris.length; i++) {
      assert.ok(baris[i][0] > baris[i - 1][0], `batas baris ${i}`);
      assert.ok(baris[i][1] > baris[i - 1][1], `tarif baris ${i}`);
    }
  });

  test(`tabel TER ${kategori}: bruto di batas ikut rentang itu, +1 rupiah naik`, () => {
    baris.forEach(([batas, bp], i) => {
      if (batas === Infinity) return;
      assert.equal(tarif(batas, kategori), bp, `tepat ${batas}`);
      assert.equal(tarif(batas + 1, kategori), baris[i + 1][1], `lewat ${batas}`);
    });
    assert.equal(tarif(0, kategori), 0);
  });
}

test("batas dasar iuran JP dan BPJS Kesehatan", () => {
  const h = hitung(50000000, "TK/0");
  assert.equal(h.potongan.jht, 1000000);
  assert.equal(h.potongan.jp, 110863);
  assert.equal(h.potongan.kesehatan, 120000);
  assert.equal(h.tunjangan.kesehatan, 480000);
});

test("gaji nol", () => {
  const h = hitung(0, "K/3");
  assert.equal(h.pph, 0);
  assert.equal(h.bersih, 0);
});

test("bacaKurs mengambil conversion_rates.IDR", () => {
  const k = bacaKurs({
    result: "success",
    time_last_update_utc: "Sun, 15 Nov 2026 00:00:01 +0000",
    time_next_update_unix: 1795219201,
    conversion_rates: { USD: 1, IDR: 16543.2134 },
  });
  assert.deepEqual(k, { rate: 16543.2134, waktu: "Sun, 15 Nov 2026 00:00:01 +0000" });
});

test("bacaKurs menolak respons gagal atau tanpa IDR", () => {
  assert.throws(() => bacaKurs({ result: "error", "error-type": "invalid-key" }), /invalid-key/);
  assert.throws(() => bacaKurs({ result: "success", conversion_rates: { USD: 1 } }), /IDR/);
  assert.throws(() => bacaKurs({ result: "success", conversion_rates: { IDR: 0 } }), /IDR/);
  assert.throws(() => bacaKurs(null));
});

test("gaji USD dikonversi ke rupiah lalu dihitung seperti biasa", () => {
  const gaji = keRupiah(625, 16000);
  assert.equal(gaji, 10000000);
  assert.equal(hitung(gaji, "TK/0").bersih, 9338650);
  assert.equal(keRupiah(1, 16543.2134), 16543);
  assert.equal(keRupiah(3, 16543.5), 49631);
});

test("/api/kurs: key belum di-set atau tidak valid -> 503 'Kurs USD sedang tidak tersedia'", async () => {
  const diam = console.error;
  console.error = () => {};
  try {
    const jangan = () => assert.fail("tidak boleh memanggil API tanpa key");
    assert.deepEqual(await ambilKursUsd(undefined, jangan), { status: 503, body: { error: PESAN_GAGAL } });
    assert.deepEqual(await ambilKursUsd("", jangan), { status: 503, body: { error: PESAN_GAGAL } });

    const kunciSalah = async () => ({ json: async () => ({ result: "error", "error-type": "invalid-key" }) });
    assert.deepEqual(await ambilKursUsd("salah", kunciSalah), { status: 503, body: { error: PESAN_GAGAL } });

    const putus = async () => { throw new Error("ECONNRESET"); };
    assert.deepEqual(await ambilKursUsd("abc", putus), { status: 503, body: { error: PESAN_GAGAL } });
  } finally {
    console.error = diam;
  }
  assert.equal(PESAN_GAGAL, "Kurs USD sedang tidak tersedia");
});

test("/api/kurs: sukses mengembalikan rate tanpa membocorkan key", async () => {
  let dipanggil;
  const ok = async (url) => {
    dipanggil = url;
    return { json: async () => ({ result: "success", time_last_update_utc: "X", conversion_rates: { IDR: 18229.3636 } }) };
  };
  const hasil = await ambilKursUsd("rahasia123", ok);
  assert.equal(dipanggil, "https://v6.exchangerate-api.com/v6/rahasia123/latest/USD");
  assert.deepEqual(hasil, { status: 200, body: { rate: 18229.3636, waktu: "X" } });
  assert.ok(!JSON.stringify(hasil.body).includes("rahasia123"));
});
