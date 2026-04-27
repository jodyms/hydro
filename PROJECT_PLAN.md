# 📋 Hydromart Sales & Maintenance System - Project Plan & Tracking

Dokumen ini berfungsi sebagai acuan kelangsungan pengembangan aplikasi **Hydromart Sales & Maintenance Database**. Ditujukan bagi developer manapun yang akan meneruskan proyek ini agar dapat langsung memahami struktur, *track record* pengerjaan, serta status *task* saat ini.

---

## 🎯 **Tujuan Utama Proyek (Objective)**
Migrasi sistem *Sales & Maintenance* Hydromart dari purwarupa (POC) berbasis JSON (`dataMock.js`) ke sistem *production-ready* menggunakan **MySQL (Database Relasional)** dan **PHP PDO (Backend API)**, terintegrasi penuh dengan tampilan antarmuka React. Sistem harus menerapkan kontrol akses ketat (RBAC), fitur *Audit Trail* (Pelacakan User/Data), dan *User Experience* yang modern (seperti penggunaan *DataTable* pada setiap modul tabel).

## 🛠️ **Tech Stack**
*   **Database:** MySQL (Skema ada di `hydromart_sales_schema.sql`).
*   **Backend:** PHP Native API (dengan PDO untuk keamanan *Prepared Statements*).
*   **Frontend:** React (menggunakan Vite build tool).
*   **Akses Kontrol:** Sistem RBAC (Role-Based Access Control) kustom.

---

## ✅ **Track Record (Apa Yang Sudah Diselesaikan)**

### 1. Database & Backend API (Fase 1 - Selesai)
- [x] Desain skema relasional `hydromart_sales_schema.sql`.
- [x] Membangun koneksi ke database tersentralisasi di `api/config.php` dan `api/db.php`.
- [x] Pembuatan API endpoint untuk Master Data (User, Roles, Teams, Permissions, Regions, Companies, PICs).
- [x] Pembuatan API endpoint transaksional (Installations, History).
- [x] Pembaharuan struktur tabel untuk pelacakan (menambahkan kolom *Audit Logging*: `created_by`, `updated_by`).
- [x] Modifikasi `auth.php` untuk menangani *Login Session* dan *Permissions*.
- [x] Penyesuaian `teams.php` dan sistem otorisasi terkait visibilitas datanya (`showall` handling).

### 2. Frontend / React Integration (Fase 2 & 3 - Sebagian Besar Selesai)
- [x] Migrasi state global di `App.jsx` untuk tidak lagi memuat data statis `dataMock.js`. Proses diganti dengan pemanggilan `fetch` secara asinkron ke endpoint API.
- [x] Refactor halaman `Dashboard` dan logika optimasi *System Rollover* (otomatis memperpanjang perawatan jika terlewat).
- [x] Refactor `Users`, `Roles`, `Teams`, `Companies`, dan `PICs` (modul-modul master data).
- [x] **Refactoring Komponen Instalasi:**
  - [x] **SalesPage:** Refactor agar mencakup `DataTable` aktif dan status *cards*. Migrasi API endpoint.
  - [x] **InstallationPage:** Integrasikan `DataTable`, fitur filter perusahaan yang efisien (Multi-select filter), *inline edit status* menggunakan level *permission*, dan sinkronisasi map `is_history`.
  - [x] **HistoryPage:** Penyesuaian *field mapping* agar mengambil data perpanjangan history dari Database, bukan properti CamelCase *mock* lawas (`is_history` vs `isHistory`).
  - [x] **ProspectingPage & WorkOrderPage:** Adaptasi pembacaan field Database dan *list* `region` dinamis.
- [x] Menghapus blok sisa (*orphan code*) dari proses penimpaan file usang pada versi awal aplikasi.
- [x] Definisi standar pengembangan modul ke depan via dokumentasi `MASTER_DATA_STANDARDS.md`.

---

## 🚀 **Task Tracker (Apa Yang Harus Dikerjakan Selanjutnya)**

Bagi developer yang mengambil alih, silakan merujuk ke tabel ini:

| Status | Modul / Fitur | Deskripsi Task Selanjutnya | Prioritas |
| :--- | :--- | :--- | :---: |
| 🔄 **On-Going** | Pembersihan Mock Data | Menghapus tuntas file `dataMock.js`. Memastikan *file* ini tidak diimpor lagi di seluruh komponen, dan memverifikasi tidak ada error *Undefined* di layar saat diuji (E2E). | P1 |
| ⏳ **To-Do** | Pengujian *Role* (QA) | Lakukan pengujian lintas pengguna *Role* (misalkan masuk sebagai "Teknisi" vs "Sales"). Sistem diharapkan menyembunyikan elemen (seperti tombol hapus atau *edit status*) menyesuaikan RBAC yang ada di DB. | P2 |
| ⏳ **To-Do** | Sinkronisasi PIC / Company | Di `SalesPage` / `InstallationPage` saat ini ada daftar instalasi di perusahaan. Verifikasikan alur jika suatu instalasi dihapus/diperbarui, tabel terkait diperbarui secara *real-time*. | P2 |
| ⏳ **To-Do** | *Deployment Preparation* | Mengganti base-URL lokal `import.meta.env.VITE_API_URL` dengan variabel tersembunyi yang disesuaikan saat migrasi ke *host / server* tujuan (Production). | P2 |
| ⏳ **To-Do** | UI/UX Refinement | Rapihkan *Alert System*. Saat terjadi *error* pada saat simpan (contoh: di `SalesPage`), perbarui UI `alert()` menggunakan notifikasi *Toast* yang tidak mem-block *view* browser. | P3 |
| ⏳ **To-Do** | *Maintenance Mode* | Menerapkan fitur 'Cancel Installation' dengan mencatut alasannya jika barang produk dibatalkan atau ditarik dari *Client*. | P3 |

---

## 📖 **Catatan Penting untuk Developer (Guidelines)**

1. **Format Nama Variabel (Case Convention):**
   *   Saat mengirim / memanggil field dari **API (Database)**, berpegang pada format `snake_case` (contoh: `company_id`, `product_name`, `installation_date`).
   *   Sistem lawas (`dataMock.js`) memakai `camelCase`. Jika menemukan kode lokal yang masih menggunakan `item.companyId`, pastikan segera diperbaiki menjadi `item.company_id`.
2. **Keamanan Update:**
   Bila ingin menambah struktur tabel pada MySQL `hydromart_sales_schema.sql`, usahakan membuat *script alter* terpisah (sebagaimana file `api/alter_*.php`) guna mengindari rusaknya data instalasi yang sudah dimasukkan pengguna saat *testing*.
3. **Data Grid UI:**
   Aplikasi standar *harus* memanfaatkan `<DataTable />` dari komponen yang sudah disediakan dalam `App.jsx`, hindari pembuatan *raw table* `<table>`, khususnya pada kumpulan data lebih dari 10 baris rekaman.

---
*Dokumen ini dibuat pada:* **`April 2026`**
*Status Aplikasi Hari Ini:* **Sudah terhubung ke MySQL, fasa transisi *Frontend view* ~95% teratasi.**
