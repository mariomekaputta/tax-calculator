# Progress — Kalkulator Gaji Bersih

Kalkulator gaji bersih (take home pay) di browser: PPh 21 bulanan dengan tarif TER (PP 58/2023) plus potongan BPJS. HTML, CSS, dan JavaScript biasa, tanpa framework dan tanpa npm.

## Link

- GitHub: https://github.com/mariomekaputta/tax-calculator
- Vercel: https://tax-calculator-me-cfea.vercel.app — tercatat sebagai homepage repo. Saat dicek 1 November 2026 link ini membuka halaman login Vercel (Deployment Protection aktif), jadi isi deploy belum bisa dipastikan sama dengan `main`.
- Tes: `node --test` (Node 18+, tanpa npm)
- Lokal: `python3 -m http.server 3000` di folder ini, lalu buka http://localhost:3000

## Struktur proyek

| File | Isi |
|---|---|
| `index.html` | Halaman utama: pilihan status PTKP, isian gaji, kartu hasil, rincian dasar PPh 21 |
| `style.css` | Tampilan mobile-first, mode gelap otomatis |
| `app.js` | Tabel TER A/B/C, pemetaan status → kategori, konstanta BPJS, fungsi `hitung()`, logika UI. Mengekspor `hitung`, `tarif`, `TER`, `KATEGORI` untuk dites di Node |
| `test.js` | Tes otomatis (`node --test`): kasus uji, pemetaan status, urutan tabel TER, batas tiap rentang A/B/C, batas dasar iuran BPJS |
| `tarif-ter.md` | Tabel TER kategori A, B, C dan pemetaan status PTKP, ditranskripsi dari sumber resmi beserta link-nya |
| `PROGRESS.md` | Dokumen ini |
| `.gitignore` | `.DS_Store`, folder editor, `.claude/settings.local.json`, `.env*`, `node_modules/` |

## Fitur yang sudah selesai

| Commit | Fitur |
|---|---|
| `1eb30a7` | v1: hitung PPh 21 TER kategori A (TK/0) dan gaji bersih |
| `2388064` | Input berformat Rupiah saat diketik, hitung otomatis tanpa tombol, kartu hasil, ramah HP |
| `2f66657` | Pilihan status PTKP TK/0–TK/3 dan K/0–K/3, kategori TER A/B/C otomatis, kategori tampil di hasil |
| `80a0955` | Potongan BPJS karyawan, iuran perusahaan masuk bruto, rincian dasar perhitungan PPh 21; versi aset `?v=4` untuk mencegah cache lama |
| `100084e` → `714b99f` | Catatan batasan perhitungan ditambahkan, lalu dibatalkan dengan `git revert` |
| (commit ini) | Tes otomatis `test.js`; pencarian tarif dipisah ke fungsi `tarif()`; aset `?v=5` |

## Aturan hitung

Sumber tarif: Lampiran PP 58/2023 (pajak.go.id), rincian di `tarif-ter.md`.

**Kategori TER berdasarkan status PTKP**

| Kategori | Status |
|---|---|
| A | TK/0, TK/1, K/0 |
| B | TK/2, TK/3, K/1, K/2 |
| C | K/3 |

**Iuran BPJS**

| Iuran | Dibayar | Tarif | Dasar maksimal |
|---|---|---|---|
| JHT | Karyawan (potong gaji) | 2% | — |
| JP | Karyawan (potong gaji) | 1% | Rp11.086.300 |
| BPJS Kesehatan | Karyawan (potong gaji) | 1% | Rp12.000.000 |
| JKK | Perusahaan (masuk bruto) | 0,24% | — |
| JKM | Perusahaan (masuk bruto) | 0,3% | — |
| BPJS Kesehatan | Perusahaan (masuk bruto) | 4% | Rp12.000.000 |

**Rumus**

```
bruto     = gaji + JKK + JKM + BPJS Kesehatan perusahaan
PPh 21    = bruto × tarif TER (kategori sesuai status, rentang sesuai bruto)
gaji bersih = gaji − JHT − JP − BPJS Kesehatan karyawan − PPh 21
```

- Batas rentang TER: bruto tepat di batas "sampai dengan" ikut tarif rentang itu.
- Tarif disimpan dalam basis poin (1% = 100) agar bebas galat floating point.
- Tiap iuran BPJS dibulatkan ke rupiah terdekat; PPh 21 dibulatkan ke bawah.
- Hanya untuk masa Januari–November. Desember (hitung ulang setahun dengan Pasal 17) belum didukung.

**Kasus uji yang sudah dicek**

| Status | Gaji | Bruto | Tarif | PPh 21 | Gaji bersih |
|---|---:|---:|---:|---:|---:|
| TK/0 | 10.000.000 | 10.454.000 | 2,5% | 261.350 | 9.338.650 |
| K/1 | 7.000.000 | 7.317.800 | 1% | 73.178 | 6.646.822 |

## Catatan dan risiko

- Batas upah JP berubah tiap tahun; nilai Rp11.086.300 berasal dari spesifikasi, belum dicek ke sumber resmi BPJS Ketenagakerjaan.
- Aturan pembulatan iuran BPJS belum dikonfirmasi.
- Server lokal `http.server` tidak mengirim header cache; ganti angka `?v=` di `index.html` setiap kali CSS/JS berubah.
- Email author commit memakai alamat pribadi dan repo bersifat publik.

## Ide fitur berikutnya

1. **Perhitungan Desember / setahun**: PPh 21 Pasal 17 dengan PTKP, biaya jabatan, dan pengurang iuran JHT/JP, supaya total setahun akurat.
2. **Tunjangan dan komponen lain**: tunjangan tetap/tidak tetap, THR, bonus, lembur.
3. **Mode kebalikan**: dari gaji bersih yang diinginkan, cari gaji kotor (gross-up).
4. **Pengaturan BPJS**: opsi tidak ikut JP/BPJS Kesehatan, tarif JKK sesuai tingkat risiko, batas upah yang bisa diubah.
5. **Bagikan dan cetak**: simpan input ke URL agar bisa dibagikan, tombol salin/cetak rincian.
6. **Deploy**: pastikan Vercel publik dan otomatis deploy dari `main`, atau pakai GitHub Pages.
