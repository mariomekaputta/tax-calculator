// TER bulanan kategori A, B, C, Lampiran PP 58/2023 (lihat tarif-ter.md).
// Tiap baris: [batas atas "sampai dengan", tarif dalam basis poin (1% = 100)].
const TER = {
  A: [
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
  ],
  B: [
    [6200000, 0], [6500000, 25], [6850000, 50], [7300000, 75], [9200000, 100],
    [10750000, 150], [11250000, 200], [11600000, 250], [12600000, 300],
    [13600000, 400], [14950000, 500], [16400000, 600], [18450000, 700],
    [21850000, 800], [26000000, 900], [27700000, 1000], [29350000, 1100],
    [31450000, 1200], [33950000, 1300], [37100000, 1400], [41100000, 1500],
    [45800000, 1600], [49500000, 1700], [53800000, 1800], [58500000, 1900],
    [64000000, 2000], [71000000, 2100], [80000000, 2200], [93000000, 2300],
    [109000000, 2400], [129000000, 2500], [163000000, 2600], [211000000, 2700],
    [374000000, 2800], [459000000, 2900], [555000000, 3000], [704000000, 3100],
    [957000000, 3200], [1405000000, 3300], [Infinity, 3400],
  ],
  C: [
    [6600000, 0], [6950000, 25], [7350000, 50], [7800000, 75], [8850000, 100],
    [9800000, 125], [10950000, 150], [11200000, 175], [12050000, 200],
    [12950000, 300], [14150000, 400], [15550000, 500], [17050000, 600],
    [19500000, 700], [22700000, 800], [26600000, 900], [28100000, 1000],
    [30100000, 1100], [32600000, 1200], [35400000, 1300], [38900000, 1400],
    [43000000, 1500], [47400000, 1600], [51200000, 1700], [55800000, 1800],
    [60400000, 1900], [66700000, 2000], [74500000, 2100], [83200000, 2200],
    [95600000, 2300], [110000000, 2400], [134000000, 2500], [169000000, 2600],
    [221000000, 2700], [390000000, 2800], [463000000, 2900], [561000000, 3000],
    [709000000, 3100], [965000000, 3200], [1419000000, 3300], [Infinity, 3400],
  ],
};

// Status PTKP -> kategori TER, sesuai ayat (4) batang tubuh PP 58/2023.
const KATEGORI = {
  "TK/0": "A", "TK/1": "A", "K/0": "A",
  "TK/2": "B", "TK/3": "B", "K/1": "B", "K/2": "B",
  "K/3": "C",
};

// Iuran BPJS dalam basis poin; batas = gaji maksimal yang dipakai sebagai dasar iuran.
// Batas upah JP disesuaikan pemerintah tiap tahun, perbarui bila berubah.
const BPJS = {
  karyawan: {
    jht: { bp: 200 },
    jp: { bp: 100, batas: 11086300 },
    kesehatan: { bp: 100, batas: 12000000 },
  },
  perusahaan: {
    jkk: { bp: 24 },
    jkm: { bp: 30 },
    kesehatan: { bp: 400, batas: 12000000 },
  },
};

function iuran(gaji, { bp, batas = Infinity }) {
  return Math.round((Math.min(gaji, batas) * bp) / 10000);
}

// Tarif TER (basis poin) untuk bruto; bruto tepat di batas ikut tarif rentang itu.
function tarif(bruto, kategori) {
  return TER[kategori].find(([batas]) => bruto <= batas)[1];
}

function hitung(gaji, status = "TK/0") {
  const potongan = {
    jht: iuran(gaji, BPJS.karyawan.jht),
    jp: iuran(gaji, BPJS.karyawan.jp),
    kesehatan: iuran(gaji, BPJS.karyawan.kesehatan),
  };
  const tunjangan = {
    jkk: iuran(gaji, BPJS.perusahaan.jkk),
    jkm: iuran(gaji, BPJS.perusahaan.jkm),
    kesehatan: iuran(gaji, BPJS.perusahaan.kesehatan),
  };
  // Iuran yang dibayar perusahaan menambah penghasilan bruto untuk PPh 21.
  const bruto = gaji + tunjangan.jkk + tunjangan.jkm + tunjangan.kesehatan;

  const kategori = KATEGORI[status];
  const bp = tarif(bruto, kategori);
  // Basis poin bulat agar tidak ada galat floating point; dibulatkan ke bawah per rupiah.
  const pph = Math.floor((bruto * bp) / 10000);
  const totalBpjs = potongan.jht + potongan.jp + potongan.kesehatan;
  return { kategori, bp, bruto, potongan, tunjangan, pph, bersih: gaji - totalBpjs - pph };
}

const rupiah = (n) => "Rp" + n.toLocaleString("id-ID");
const persen = (bp) => (bp / 100).toLocaleString("id-ID") + "%";

if (typeof document !== "undefined") {
  const input = document.getElementById("gaji");
  const err = document.getElementById("error");
  const status = document.getElementById("status");
  const el = (id) => document.getElementById(id);
  const brutoSaatIni = () => Number(input.value.replace(/\D/g, "")) || 0;

  function tampilkan(bruto) {
    const h = hitung(bruto, status.value);
    el("kategori").textContent = "TER kategori " + h.kategori;
    el("status-hasil").textContent = status.value;
    el("kotor").textContent = rupiah(bruto);
    el("jht").textContent = "−" + rupiah(h.potongan.jht);
    el("jp").textContent = "−" + rupiah(h.potongan.jp);
    el("kes").textContent = "−" + rupiah(h.potongan.kesehatan);
    el("tarif").textContent = persen(h.bp);
    el("pph").textContent = "−" + rupiah(h.pph);
    el("jkk").textContent = rupiah(h.tunjangan.jkk);
    el("jkm").textContent = rupiah(h.tunjangan.jkm);
    el("kes-pr").textContent = rupiah(h.tunjangan.kesehatan);
    el("bruto").textContent = rupiah(h.bruto);
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

  status.addEventListener("change", () => tampilkan(brutoSaatIni()));

  tampilkan(brutoSaatIni());

  // Tombol tema: Otomatis (ikut OS) -> Terang -> Gelap -> Otomatis.
  const TEMA = [["auto", "Otomatis"], ["light", "Terang"], ["dark", "Gelap"]];
  const tombolTema = el("tema");
  const temaSaatIni = () => document.documentElement.dataset.theme || "auto";
  const labelTema = () => {
    const label = TEMA.find(([k]) => k === temaSaatIni())[1];
    tombolTema.textContent = label;
    tombolTema.setAttribute("aria-label", "Tema: " + label + ". Klik untuk ganti.");
  };
  tombolTema.addEventListener("click", () => {
    const i = TEMA.findIndex(([k]) => k === temaSaatIni());
    const [berikut] = TEMA[(i + 1) % TEMA.length];
    if (berikut === "auto") delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = berikut;
    try {
      if (berikut === "auto") localStorage.removeItem("tema");
      else localStorage.setItem("tema", berikut);
    } catch (e) {}
    labelTema();
  });
  labelTema();
}

if (typeof module !== "undefined") module.exports = { hitung, tarif, TER, KATEGORI };
