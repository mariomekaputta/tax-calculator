// Jalankan: node --test
const test = require("node:test");
const assert = require("node:assert/strict");
const { hitung, tarif, TER, KATEGORI } = require("./app.js");

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
