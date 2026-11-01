// TER bulanan kategori A, Lampiran PP 58/2023 (lihat tarif-ter.md).
// Tiap baris: [batas atas "sampai dengan", tarif dalam basis poin (1% = 100)].
const TER_A = [
  [5400000, 0], [5650000, 25], [5950000, 50], [6300000, 75],
  [6750000, 100], [7500000, 125], [8550000, 150], [9650000, 175],
  [10050000, 200], [10350000, 225], [10700000, 250], [11050000, 300],
  [11600000, 350], [12500000, 400], [13750000, 500], [15100000, 600],
  [16950000, 700], [19750000, 800], [24150000, 900], [26450000, 1000],
  [28000000, 1100], [30050000, 1200], [32400000, 1300], [35400000, 1400],
  [39100000, 1500], [43850000, 1600], [47800000, 1700], [51400000, 1800],
  [56300000, 1900], [62200000, 2000], [68600000, 2100], [77500000, 2200],
  [89000000, 2300], [103000000, 2400], [125000000, 2500], [157000000, 2600],
  [206000000, 2700], [337000000, 2800], [454000000, 2900], [550000000, 3000],
  [695000000, 3100], [910000000, 3200], [1400000000, 3300], [Infinity, 3400],
];

function tarifTerA(bruto) {
  return TER_A.find(([batas]) => bruto <= batas)[1];
}

function hitung(bruto) {
  const bp = tarifTerA(bruto);
  // Basis poin bulat agar tidak ada galat floating point; dibulatkan ke bawah per rupiah.
  const pph = Math.floor((bruto * bp) / 10000);
  return { bp, pph, bersih: bruto - pph };
}

const rupiah = (n) => "Rp" + n.toLocaleString("id-ID");
const persen = (bp) => (bp / 100).toLocaleString("id-ID") + "%";

if (typeof document !== "undefined") {
  const input = document.getElementById("gaji");
  const err = document.getElementById("error");
  const el = (id) => document.getElementById(id);

  function tampilkan(bruto) {
    const h = hitung(bruto);
    el("kotor").textContent = rupiah(bruto);
    el("tarif").textContent = persen(h.bp);
    el("pph").textContent = "−" + rupiah(h.pph);
    el("bersih").textContent = rupiah(h.bersih);
  }

  input.addEventListener("input", () => {
    // Simpan posisi kursor sebagai jumlah digit di kirinya, lalu format ulang.
    const kiri = input.value.slice(0, input.selectionStart).replace(/\D/g, "").length;
    const angka = input.value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
    const bruto = Number(angka);

    if (!Number.isSafeInteger(bruto)) {
      err.textContent = "Angkanya terlalu besar.";
      return;
    }
    err.textContent = "";

    input.value = angka ? bruto.toLocaleString("id-ID") : "";
    let pos = 0;
    for (let digit = 0; pos < input.value.length && digit < kiri; pos++) {
      if (/\d/.test(input.value[pos])) digit++;
    }
    input.setSelectionRange(pos, pos);

    tampilkan(bruto);
  });

  tampilkan(0);
}

if (typeof module !== "undefined") module.exports = { hitung };
